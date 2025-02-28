/**
 * This is a command-line utility to manage the set of Podcasts in the Podverse app.
 */

import { config } from 'dotenv';
config({ debug: true });

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_API_KEY as string);

import { program } from 'commander';
import terminal from 'terminal-kit';
const { terminal: term } = terminal;
import {
  GetPodcast,
  GetPodcasts,
  GetPodcastWithEpisodes,
  DeletePodcast,
  Transcribe,
  Summarize,
  SpeakerID,
  VectorSearch,
  Ingest,
  EmbedText,
  TextSplitter,
  SuggestQueries,
  Search,
  Podcast,
  PodcastWithEpisodes,
  PodcastMetadata,
  GetPodcastByID,
} from 'podverse-utils';
import { dump, load } from 'js-yaml';
import fs from 'fs';
import { Inngest } from 'inngest';
import { parse } from 'csv-parse/sync';
import { sendEmail, createInvitation, stepInvitations } from './invites.js';

/** Describes the configuration file YAML format. */
interface PodcastConfig {
  slug: string;
  rssUrl: string;
}

interface ConfigFile {
  podcasts: PodcastConfig[];
}

program.name('podverse-cli').version('0.0.1').description('CLI for managing Podverse state.');

function inviteLink(podcast: Podcast | PodcastMetadata | PodcastWithEpisodes) {
  const activationCode = podcast.uuid?.replace(/-/g, '');
  return `https://podverse.ai/podcast/${podcast.slug}?activationCode=${activationCode}`;
}

// This is the mdw@mdw.la user in prod.
const DEFAULT_OWNER = 'user_2eEqltdMFHh6eKqOqnWQS8mQqDJ';

program
  .command('list')
  .description('List all podcasts in the Podverse app.')
  .option('--owner <owner>', 'Filter by owner ID.')
  .action(async (opts) => {
    const { data, error } = await supabase.from('Podcasts').select('*');
    if (error) {
      throw new Error('Error fetching podcasts: ' + JSON.stringify(error));
    }
    let podcasts = data;
    if (opts.owner) {
      podcasts = podcasts.filter((podcast) => podcast.owner === opts.owner);
    }
    for (const podcast of podcasts) {
      term
        .blue(podcast.slug + '\t')
        .yellow(podcast.owner + '\t')
        .green(podcast.title.slice(0, 25) + '\t')
        .gray(inviteLink(podcast) + '\n');
    }
  });

program
  .command('get')
  .description('Get a podcast from the Podverse app.')
  .argument('<slug>', 'Slug of the podcast to get.')
  .option('--episodes', 'Return episodes as well.')
  .action(async (slug: string, opts) => {
    if (opts.episodes) {
      const podcast = await GetPodcastWithEpisodes(supabase, slug);
      console.log(JSON.stringify(podcast, null, 4));
    } else {
      const podcast = await GetPodcast(supabase, slug);
      console.log(JSON.stringify(podcast, null, 4));
    }
  });

program
  .command('ingest')
  .description('Ingest a podcast into the Podverse app.')
  .argument('<podcastUrl>', 'URL of the podcast RSS feed.')
  .option('--owner <owner>', 'Owner ID of the podcast.', DEFAULT_OWNER)
  .action(async (podcastUrl: string, opts) => {
    try {
      const podcast = await Ingest({ supabase, podcastUrl, owner: opts.owner });
      term('Ingested podcast: ').green(podcast.slug)(` (${podcast.Episodes?.length} episodes)\n`);
    } catch (err) {
      term('Error ingesting podcast: ').red(err);
    }
  });

program
  .command('delete')
  .description('Delete a podcast from the Podverse app.')
  .argument('<slug>', 'Slug of the podcast to delete.')
  .action(async (slug: string) => {
    await DeletePodcast(supabase, slug);
    term('Deleted podcast: ').green(slug + '\n');
  });

program
  .command('ingest-all')
  .description('Ingest all podcasts from the given YAML file.')
  .argument('<filename>', 'YAML file to read the podcast list from.')
  .action(async (filename: string) => {
    let created = 0;
    let skipped = 0;
    const configFile = load(fs.readFileSync(filename, 'utf8')) as ConfigFile;
    for (const podcastConfig of configFile.podcasts) {
      try {
        // Check to see if it exists.
        const p = await GetPodcast(supabase, podcastConfig.slug);
        term.yellow('Skipping: ').green(podcastConfig.slug + '\n');
        skipped += 1;
        continue;
      } catch (err) {
        // Assume the podcast does not exist, let's create it.
        term()
          .blue('Creating: ')
          .green(podcastConfig.slug + '\n');
      }
      try {
        const podcast = await Ingest({ slug: podcastConfig.slug, supabase, podcastUrl: podcastConfig.rssUrl });
        term('Ingested podcast: ').green(podcast.slug)(` (${podcast.Episodes?.length} episodes)\n`);
        created += 1;
      } catch (err) {
        term('Error ingesting podcast: ').red(err);
      }
    }
    term('Ingested podcasts from ').green(filename)(`: ${created} created, ${skipped} skipped.\n`);
  });

program
  .command('dump')
  .description('Save the current podcast list to a YAML file.')
  .argument('<filename>', 'YAML file to save the list to.')
  .option('--owner <owner>', 'Filter by owner ID.')
  .action(async (filename: string, opts) => {
    const { data, error } = await supabase.from('Podcasts').select('*');
    if (error) {
      throw new Error('Error fetching podcasts: ' + JSON.stringify(error));
    }
    let podcasts = data;
    if (opts.owner) {
      podcasts = podcasts.filter((podcast) => podcast.owner === opts.owner);
    }
    const config: ConfigFile = {
      podcasts,
    };
    fs.writeFile(filename, dump(config), (err) => {
      if (err) {
        console.log(err);
      }
    });
    term('Wrote config to ').green(filename);
  });

program
  .command('refresh')
  .description('Refresh podcast episodes by adding new episodes from their RSS feeds.')
  .argument('[slug]', 'Slug of the podcast to refresh. If not specified, all podcasts will be refreshed.')
  .action(async (slug: string) => {
    let slugs: string[] = [];
    if (slug) {
      slugs.push(slug);
    } else {
      slugs = await GetPodcasts(supabase).then((podcasts) => podcasts.map((podcast) => podcast.slug));
    }
    for (const slug of slugs) {
      const podcast = await GetPodcastWithEpisodes(supabase, slug);
      if (!podcast.rssUrl) {
        term('Unable to refresh, as podcast is missing RSS URL: ').red(slug + '\n');
        continue;
      }
      const newPodcast = await Ingest({ slug, supabase, podcastUrl: podcast.rssUrl, refresh: true });
      const diff = (newPodcast.Episodes?.length ?? 0) - (podcast.Episodes?.length ?? 0);
      term('Refreshed podcast: ').green(slug)(` (${newPodcast.Episodes?.length} episodes, ${diff} new)\n`);
    }
  });

program
  .command('process')
  .description('Send Inngest event to start processing.')
  .argument('<podcastSlug>', 'Podcast to process.')
  .option('--dev', 'Use the local development Inngest environment.')
  .option('--force', 'Force reprocessing of existing episodes.')
  .option('--numEpisodes <numEpisodes>', 'Number of episodes to process.')
  .option('--maxEpisodes <maxEpisodes>', 'Max number of episodes to process.')
  .action(async (podcastSlug: string, opts) => {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY === undefined) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
    }
    if (opts.force && opts.maxEpisodes) {
      throw new Error('Cannot specify both --force and --maxEpisodes.');
    }
    try {
      let eventKey: string | undefined = process.env.INNGEST_EVENT_KEY;
      if (opts.dev) {
        eventKey = undefined;
      } else if (!eventKey) {
        throw new Error('Missing INNGEST_EVENT_KEY environment variable.');
      }
      const inngest = new Inngest({ id: 'podverse-app', eventKey });
      const podcast = await GetPodcastWithEpisodes(supabase, podcastSlug);
      await inngest.send({
        name: 'process/podcast',
        data: {
          podcastId: podcast.id,
          force: opts.force,
          // Try to avoid processing too many at a time.
          episodeLimit: opts.numEpisodes || 10,
          maxEpisodes: opts.maxEpisodes,
          supabaseAccessToken: process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
      });
      term('Started processing ').green(podcastSlug)('\n');
    } catch (err) {
      term('Error sending process event: ').red(err);
    }
  });

program
  .command('transcribe')
  .description('Send Inngest event to transcribe episode.')
  .argument('<episodeId>', 'ID of the episode to transcribe.')
  .option('--dev', 'Use the local development Inngest environment.')
  .action(async (episodeId, opts) => {
    try {
      let eventKey: string | undefined = process.env.INNGEST_EVENT_KEY;
      if (opts.dev) {
        eventKey = undefined;
      } else if (!eventKey) {
        throw new Error('Missing INNGEST_EVENT_KEY environment variable.');
      }
      const inngest = new Inngest({ id: 'podverse-app', eventKey });
      await inngest.send({
        name: 'process/transcribe',
        data: {
          episodeId,
        },
      });
      term.green(`Started transcription for episode ${episodeId}.\n`);
    } catch (err) {
      term('Error sending process event: ').red(err);
    }
  });

program
  .command('cancel')
  .description('Cancel Inngest function invocations.')
  .argument('<functionId>', 'ID of the function to cancel.')
  .action(async (functionId) => {
    const signKey: string | undefined = process.env.INNGEST_SIGN_KEY;
    if (!signKey) {
      throw new Error('Missing INNGEST_SIGN_KEY environment variable.');
    }
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const res = await fetch('https://api.inngest.com/v1/cancellations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${signKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: 'podverse-app',
        function_id: functionId,
        started_after: yesterday,
        started_before: tomorrow,
      }),
    });
    const data = await res.json();
    term.green(JSON.stringify(data));
  });

program
  .command('import')
  .description('Import Podcasts from a CSV file, creating new invitations for them.')
  .argument('<csvFile>', 'Filename of the CSV file.')
  .option('--priority <priority>', 'Only process CSV file entries with this Priority value.', 'Great')
  .action(async (csvFile: string, opts) => {
    try {
      const csvRaw = fs.readFileSync(csvFile, 'utf8');
      let csvData = parse(csvRaw, { columns: true });
      // Filter out rows with priority != opts.priority.
      csvData = csvData.filter((row: { priority: string }) => row.priority === opts.priority);
      for (const record of csvData) {
        const invitation = await createInvitation(supabase, record);
        console.log(invitation);
      }
    } catch (err) {
      term('Error importing: ').red(JSON.stringify(err));
      // @ts-ignore
      console.error(err.stack);
    }
  });

program
  .command('list-invites')
  .description('List pending invitations.')
  .action(async () => {
    try {
      const { data: invites, error } = await supabase.from('Invitations').select('*');
      if (error) {
        throw error;
      }
      for (const invite of invites) {
        const podcastId = invite.podcast.toString();
        const podcast = await GetPodcastByID(supabase, podcastId);
        invite.link = `https://podverse.ai/podcast/${podcast.slug}?activationCode=${podcast.uuid?.replace(/-/g, '')}`;
        console.log(invite);
      }
    } catch (err) {
      term('Error fetching invites');
      console.error(err);
      // @ts-ignore
      console.error(err.stack);
    }
  });

program
  .command('step-invites')
  .description('Step all pending invitations.')
  .option('--stage <stage>', 'Only process invitations at the current stage.')
  .option('--force', 'Force each invite to next stage.')
  .option('--dry-run', 'Do not make changes, just report what would happen.')
  .action(async (opts) => {
    try {
      if (opts.dryRun) {
        term.red('Dry run mode enabled - no changes will be made.\n');
      }
      stepInvitations(supabase, opts.stage, opts.force || false, opts.dryRun || false);
    } catch (err) {
      term('Error stepping: ').red(JSON.stringify(err));
    }
  });

program
  .command('send-email')
  .description('Send email message via Mailgun.')
  .argument('<to>', 'Email address to send to.')
  .argument('<body>', 'Message body.')
  .option('--subject <subject>', 'Message subject.', 'Message from Podverse.ai')
  .action(async (to, body, opts) => {
    try {
      sendEmail({ to, subject: opts.subject, text: body });
    } catch (err) {
      term('Error sending email: ').red(JSON.stringify(err));
    }
  });

program
  .command('transcribe-url')
  .description('Transcribe the given audio URL.')
  .argument('<audioUrl>', 'URL of the audio to transcribe.')
  .action(async (audioUrl, opts) => {
    try {
      const result = await Transcribe(audioUrl);
      term(JSON.stringify(result, null, 4));
    } catch (err) {
      term('Error transcribing audio: ').red(err);
    }
  });

program
  .command('summarize-url')
  .description('Summarize the text content at the given URL.')
  .argument('<url>', 'URL of the text to summarize.')
  .action(async (url: string) => {
    term(`Summarizing ${url}...`);
    const res = await fetch(url);
    const text = await res.text();
    const result = await Summarize({ text });
    term('Summary:\n').green(result + '\n');
  });

program
  .command('speakerid-url')
  .description('Identify the speakers in the transcript at the given URL.')
  .argument('<url>', 'URL of the text to identify.')
  .action(async (url: string) => {
    term(`Speaker ID for ${url}...`);
    const res = await fetch(url);
    const text = await res.text();
    const result = await SpeakerID({ text });
    term.green(result + '\n');
  });

program
  .command('suggest-url')
  .description('Suggest queries based on the transcript at the given URL.')
  .argument('<url>', 'URL of the text to provide suggested queries for.')
  .action(async (url: string) => {
    term(`Suggesting queries for ${url}...`);
    const res = await fetch(url);
    const text = await res.text();
    const result = await SuggestQueries({ text });
    term.green(JSON.stringify(result, null, 2) + '\n');
  });

program
  .command('chunk-url')
  .description('Chunk the text content at the given URL.')
  .argument('<url>', 'URL of the text to chunk.')
  .action(async (url: string) => {
    term(`Chunking ${url}...`);
    const res = await fetch(url);
    const text = await res.text();
    const splitter = new TextSplitter({ splitLongSentences: true });
    const chunks = splitter.splitText(text);
    term(`Got ${chunks.length} chunks.\n`);
    for (const chunk of chunks) {
      term.green(chunk + '\n\n');
    }
  });

program
  .command('embed-url')
  .description('Embed the text content at the given URL for the given episode.')
  .argument('<url>', 'URL of the text to embed.')
  .action(async (url: string) => {
    term(`Embedding ${url}...`);
    const pageId = await EmbedText(supabase, url, undefined, { source: 'CLI' });
    term(`Embedded as page ID: ${pageId}\n`);
  });

program
  .command('search')
  .description('Perform a full-text search for the given query.')
  .argument('<query>', 'Search query.')
  .action(async (query: string) => {
    term('Performing search for: ').yellow(query)('\n');
    const results = await Search({ supabase, input: query });
    for (const result of results) {
      term.green(JSON.stringify(result, null, 2) + '\n\n');
    }
  });

program
  .command('vector-search')
  .description('Perform a vector search for the given query.')
  .argument('<query>', 'Search query.')
  .option('--episode <episodeId>', 'Episode ID to query.')
  .option('--podcast <podcastId>', 'Podcast ID to query.')
  .action(async (query: string, opts) => {
    term('Performing vector search for: ').yellow(query)('\n');
    const episodeId = opts.episode ? parseInt(opts.episode) : undefined;
    const podcastId = opts.podcast ? parseInt(opts.podcast) : undefined;
    const results = await VectorSearch({ supabase, input: query, episodeId, podcastId });
    for (const result of results) {
      term.green(JSON.stringify(result, null, 2) + '\n\n');
    }
  });

// program
//   .command('process [podcast]')
//   .description('Process the given podcast, or all podcasts if not specified.')
//   .option('-f, --force', 'Force re-processing of already-processed episodes.')
//   .option('--no-transcribe', 'Disable audio transcription.')
//   .option('--no-summarize', 'Disable summarization.')
//   .option('--max-episodes [number]', 'Maximum number of episodes to process.')
//   .action(async (podcast: string | null, opts) => {
//     const podcasts = podcast ? [podcast] : await ListPodcasts();
//     for (const podcastSlug of podcasts) {
//       term('Processing: ').green(`${podcastSlug}...\n`);
//       const podcast = await GetPodcast(podcastSlug);
//       const processed = await ProcessPodcast(podcast, {
//         transcribe: opts.transcribe,
//         summarize: opts.summarize,
//         force: opts.force,
//         maxEpisodes: opts.maxEpisodes,
//       });
//       await SetPodcast(processed);
//       term('Finished processing: ').green(`${podcastSlug}\n`);
//     }
//   });

// program
//   .command('index [podcast]')
//   .description('Generate a Fixie Corpus for the given podcast, or all podcasts if not specified.')
//   .option('-f, --force', 'Force re-indexing of already-processed podcasts.')
//   .action(async (podcast: string | null, opts) => {
//     const podcasts = podcast ? [podcast] : await ListPodcasts();
//     for (const podcastSlug of podcasts) {
//       term('Indexing: ').green(`${podcastSlug}...\n`);
//       const podcast = await GetPodcast(podcastSlug);
//       const indexed = await IndexPodcast(podcast, { force: opts.force });
//       await SetPodcast(indexed);
//       term('Started indexing: ').green(`${podcastSlug}\n`);
//     }
//   });

program.parse(process.argv);
