import { SupabaseClient } from '@supabase/supabase-js';
import { Ingest, isReady, Invitation, GetPodcastWithEpisodesByID, PodcastWithEpisodes } from 'podverse-utils';
import { Inngest } from 'inngest';
import Mailgun from 'mailgun.js';
import { FormData } from 'formdata-node';

/** This is the type of the data held in the CSV file which we generate invitations from. */
export interface RawInvite {
  priority: string;
  rssUrl: string;
  contactName: string;
  contactEmail: string;
}

// Must have at least this many episodes processed for a podcast to be invite-ready.
const MIN_PROCESSED = 5;

// Newly-imported podcasts will have this many episodes processed.
const NUM_TO_PROCESS = 10;

// Time (in ms) to wait before sending follow-up emails.
const FOLLOW_UP_DELAY = 1000 * 60 * 60 * 24 * 7;

// This is the default owner for podcasts that are imported.
// It is the mdw@mdw.la user in prod.
const DEFAULT_OWNER = 'user_2eEqltdMFHh6eKqOqnWQS8mQqDJ';

// This is the Mailgun domain to use.
const DEFAULT_DOMAIN = 'mail1.ziggylabs.ai';

// Address to BCC all emails to.
const DEFAULT_BCC_ADDRESS = 'matt@ziggylabs.ai';

// The invitation state machine looks like this:
// (no invitation) -> podcast imported -> podcast processed -> initial email sent -> follow up emails sent
// At any point after the initial email is sent, the invitee can claim the podcast, at which point we
// stop the state machine for this invite.

async function setStatus(supabase: SupabaseClient, inviteId: number, status: string): Promise<void> {
  await supabase.from('Invitations').update({ status, modified_at: new Date() }).eq('id', inviteId);
}

/** Create an invitation. */
export async function createInvitation(
  supabase: SupabaseClient,
  invite: RawInvite,
  owner?: string,
): Promise<Invitation> {
  // First check if podcast exists for this RSS url.
  const { data: existingPodcast, error } = await supabase
    .from('Podcasts')
    .select('*')
    .eq('rssUrl', invite.rssUrl)
    .limit(1);
  if (error) {
    throw error;
  }
  let podcast = null;
  if (existingPodcast.length == 0) {
    // We haven't imported this podcast yet.
    podcast = await Ingest({ supabase, podcastUrl: invite.rssUrl, owner: owner || DEFAULT_OWNER });
  } else {
    podcast = existingPodcast[0];
  }

  // Check if existing invite exists.
  let invitation = null;
  const { data: existingInvite, error: e2 } = await supabase.from('Invitations').select('*').eq('podcast', podcast.id);
  if (e2) {
    throw e2;
  }
  if (existingInvite.length == 0) {
    // Create the new invitation.
    invitation = await supabase
      .from('Invitations')
      .insert([{ podcast: podcast.id, name: invite.contactName, email: invite.contactEmail, status: 'new' }])
      .select('*');
  } else {
    invitation = existingInvite[0];
  }
  return invitation;
}

/** Step through all existing invitations. */
export async function stepInvitations(supabase: SupabaseClient, stage?: string, force?: boolean, dryRun?: boolean) {
  const { data: invites, error } = await supabase.from('Invitations').select('*');
  if (error) {
    throw error;
  }
  console.log(invites);
  for (const invite of invites) {
    while (await stepInvitation({ supabase, invite, stage, force, dryRun })) {
      // Keep stepping until we can't anymore.
    }
  }
}

/**
 * For the given invitation, progress its state machine. Returns true if more processing
 * could be done at this time.
 */
export async function stepInvitation({
  supabase,
  invite,
  stage,
  force,
  dryRun,
}: {
  supabase: SupabaseClient;
  invite: Invitation;
  stage?: string;
  force?: boolean;
  dryRun?: boolean;
}): Promise<boolean> {
  const podcast = await GetPodcastWithEpisodesByID(supabase, invite.podcast.toString());
  console.log(`Stepping invitation for ${podcast.slug} - status ${invite.status}`);

  // Note that the invite status might have been updated since it was last passed to us.
  const { data: updatedInvite, error } = await supabase.from('Invitations').select('*').eq('id', invite.id);
  if (error) {
    throw error;
  }
  if (updatedInvite.length == 0) {
    console.log(`  Invite ${invite.id} no longer exists`);
    return false;
  }
  const updated = updatedInvite[0];
  if (updated.status !== invite.status) {
    console.log(`  Invite ${invite.id} status has changed to ${updated.status}`);
    return false;
  }
  invite = updated;

  if (invite.status === 'no-reply' || invite.status === 'claimed') {
    return false;
  }

  if (podcast.owner !== DEFAULT_OWNER) {
    // Podcast has been claimed.
    console.log(`  Podcast ${podcast.slug} has been claimed`);
    if (!dryRun) {
      await setStatus(supabase, invite.id, 'claimed');
    }
    return false;
  }

  if (stage && stage !== invite.status) {
    // Doesn't meet stage filter, skip it.
    return false;
  }

  switch (invite.status) {
    case 'new':
    case 'processing': {
      // Check if podcast has been processed.
      const numReady = podcast.Episodes.filter(isReady).length;
      if (numReady >= MIN_PROCESSED || force) {
        console.log(`  Setting invite to processed`);
        if (!dryRun) {
          await setStatus(supabase, invite.id, 'processed');
        }
        return true;
      }
      // Kick off processing.
      console.log(`  Starting processing`);
      if (!dryRun) {
        const eventKey = process.env.INNGEST_EVENT_KEY;
        const inngest = new Inngest({ id: 'podverse-app', eventKey });
        const token = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        console.log(`  Using token ${token.slice(0, 12)}...`);
        await inngest.send({
          name: 'process/podcast',
          data: {
            podcastId: podcast.id,
            // Try to avoid processing too many at a time.
            episodeLimit: NUM_TO_PROCESS,
            maxEpisodes: NUM_TO_PROCESS,
            supabaseAccessToken: process.env.SUPABASE_SERVICE_ROLE_KEY,
          },
        });
        await setStatus(supabase, invite.id, 'processing');
      }
      return false;
    }
    case 'processed': {
      console.log(`  Sending first email`);
      if (!dryRun) {
        await sendFirstEmail(invite, podcast);
        await setStatus(supabase, invite.id, 'first-email-sent');
      }
      return false;
    }
    case 'first-email-sent': {
      if (force || (invite.modified_at && new Date(invite.modified_at).getTime() < Date.now() - FOLLOW_UP_DELAY)) {
        console.log(`  Sending second email`);
        if (!dryRun) {
          await sendSecondEmail(invite, podcast);
          await setStatus(supabase, invite.id, 'second-email-sent');
        }
      }
      return false;
    }
    case 'second-email-sent': {
      if (force || (invite.modified_at && new Date(invite.modified_at).getTime() < Date.now() - FOLLOW_UP_DELAY)) {
        console.log(`  Sending third email`);
        if (!dryRun) {
          await sendThirdEmail(invite, podcast);
          await setStatus(supabase, invite.id, 'third-email-sent');
        }
      }
      return false;
    }
    case 'third-email-sent': {
      if (force || (invite.modified_at && new Date(invite.modified_at).getTime() < Date.now() - FOLLOW_UP_DELAY)) {
        console.log(`  Setting status to no-reply`);
        if (!dryRun) {
          await setStatus(supabase, invite.id, 'no-reply');
        }
      }
      return false;
    }
    case 'refused':
    case 'claimed':
      console.log(`  Invite ${invite.id} is in final state ${invite.status}`);
      return false;
    default:
      console.warn('Ignoring invalid invitation status: ' + invite.status);
      return false;
  }
}

export async function sendEmail({
  to,
  subject,
  template,
  templateVars,
  text,
  bcc,
}: {
  to: string;
  subject: string;
  template?: string;
  templateVars?: Record<string, string>;
  text?: string;
  bcc?: string;
}): Promise<void> {
  // @ts-ignore
  const mailgun = new Mailgun(FormData);
  const apiKey = process.env.MAILGUN_API_KEY;
  if (!apiKey) {
    throw new Error('MAILGUN_API_KEY not set');
  }
  const mg = mailgun.client({ username: 'api', key: apiKey });
  const domain = process.env.MAILGUN_DOMAIN || DEFAULT_DOMAIN;
  console.log(`Sending email to ${to} using mailgun domain ${domain}`);
  // @ts-ignore
  const response = await mg.messages.create(domain, {
    from: 'Matt Welsh <matt@ziggylabs.ai>',
    to,
    subject,
    bcc: bcc || DEFAULT_BCC_ADDRESS,
    text,
    template,
    'h:X-Mailgun-Variables': JSON.stringify(templateVars),
  });
  console.log(response);
}

async function sendFirstEmail(invite: Invitation, podcast: PodcastWithEpisodes): Promise<void> {
  await sendEmail({
    to: invite.email,
    subject: 'Your feedback wanted - AI for your podcast?',
    template: 'first-invite-email',
    templateVars: {
      recipient_name: invite.name || '',
      podcast_title: podcast.title,
      podcast_link: `https://podverse.ai/podcast/${podcast.slug}?activationCode=${podcast.uuid?.replace(/-/g, '')}`,
    },
  });
}

async function sendSecondEmail(invite: Invitation, podcast: PodcastWithEpisodes): Promise<void> {
  await sendEmail({
    to: invite.email,
    subject: 'Following up - AI for your podcast?',
    template: 'second-invite-email',
    templateVars: {
      recipient_name: invite.name || '',
      podcast_title: podcast.title,
      podcast_link: `https://podverse.ai/podcast/${podcast.slug}?activationCode=${podcast.uuid?.replace(/-/g, '')}`,
    },
  });
}

async function sendThirdEmail(invite: Invitation, podcast: PodcastWithEpisodes): Promise<void> {
  await sendEmail({
    to: invite.email,
    subject: 'One last follow up - AI for your podcast?',
    template: 'third-invite-email',
    templateVars: {
      recipient_name: invite.name || '',
      podcast_title: podcast.title,
      podcast_link: `https://podverse.ai/podcast/${podcast.slug}?activationCode=${podcast.uuid?.replace(/-/g, '')}`,
    },
  });
}
