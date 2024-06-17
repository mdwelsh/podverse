import { Podcast, PodcastWithEpisodes, isReady } from 'podverse-utils';
import Link from 'next/link';
import { AcceptPodcastDialog } from '../AcceptPodcastDialog';
import { auth } from '@clerk/nextjs/server';

// This user is allowed to see invite links.
const ADMIN_USER_ID = 'user_2eEqltdMFHh6eKqOqnWQS8mQqDJ';

export function PodcastLinkHeader({
  podcast,
  activationCode,
}: {
  podcast: PodcastWithEpisodes | Podcast;
  activationCode?: string;
}) {
  const { userId } = auth();
  const numEpisodes = 'Episodes' in podcast ? podcast.Episodes.filter(isReady).length : undefined;
  const link = `/podcast/${podcast.slug}?uuid=${podcast.uuid?.replace(/-/g, '')}`;
  if (podcast.private) {
    if (activationCode && (!userId || userId !== podcast.owner)) {
      return (
        <div className="flex flex-row bg-sky-900 p-4 text-center text-white">
          <div className="mx-auto w-3/5">
            <div className="flex flex-col gap-3">
              <div className="font-mono underline underline-offset-8">Thanks for checking out Podverse!</div>
              <div className="text-pretty text-base">
                This page is a <b>private</b> demo of Podverse for <b className="text-primary">{podcast.title}</b>.{' '}
                {numEpisodes ? `We've imported ${numEpisodes} recent episodes to get started. ` : ' '}
                Feel free to click around and try out all the features.
              </div>
              <div className="text-pretty text-base">
                As part of our initial launch, you&apos;re invited to claim a <b>one-year free subscription</b> to
                Podverse &mdash; no strings attached. Just click below and we&apos;ll set up your free account, after
                which you can manage your podcast, import more episodes, and share links with your listeners.
              </div>
              <AcceptPodcastDialog podcast={podcast} />
              <div className="text-pretty text-base">
                I&apos;d love to get your feedback! Please drop me a line at{' '}
                <a className="underline font-mono" href="mailto:matt@ziggylabs.ai">
                  matt@ziggylabs.ai
                </a>
                . Thanks!
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      if (!userId || userId !== podcast.owner) {
        return null;
      }
      return (
        <div className="flex flex-row bg-red-900 p-2 text-center text-white">
          <div className="mx-auto w-full">
            <div className="flex flex-col gap-3">
              <div className="font-mono">This podcast is not yet published.</div>
              <div className="text-sm">
                The content here is only visible through the{' '}
                <Link href={link} className="text-primary underline">
                  private link
                </Link>{' '}
                and is intended as a preview.
              </div>
            </div>
          </div>
        </div>
      );
    }
  }
  if (!userId || userId !== podcast.owner) {
    return null;
  }
  return (
    <div className="bg-muted flex flex-row p-2 text-center text-white">
      <div className="mx-auto w-full">
        <div className="flex flex-col gap-3">
          <div className="font-mono text-sm">This podcast is public at the link:</div>
          <div className="text-primary font-mono">https://podverse.ai/podcast/{podcast.slug}</div>
        </div>
      </div>
    </div>
  );
}
