import Link from 'next/link';
import supabase from '@/lib/supabase';
import { EpisodeWithPodcast, GetEpisodeWithPodcastBySlug } from 'podverse-utils';
import moment from 'moment';
import { EpisodeIndicators } from '../Indicators';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Chat } from '@/components/Chat';
import { Collapse, CollapseWithToggle } from '@/components/Collapse';

function EpisodeHeader({ episode }: { episode: EpisodeWithPodcast }) {
  const episodeWithoutPodcast = { ...episode, podcast: 0 };

  return (
    <div className="flex w-full flex-col gap-4 font-mono">
      <div className="text-muted-foreground">
        From{' '}
        <Link href={`/podcast/${episode.podcast.slug}`}>
          <span className="text-primary">
            {episode.podcast.title}
            <ArrowTopRightOnSquareIcon className="text-primary ml-1 inline size-3 align-super" />
          </span>
        </Link>
      </div>
      <div className="flex w-full flex-row gap-4">
        <div className="w-[250px]">{episode.imageUrl && <img src={episode.imageUrl} />}</div>
        <div className="flex w-full flex-col gap-4">
          <div className="text-primary text-xl font-bold">
            <Link href={episode.url || `/podcast/${episode.podcast.slug}/episode/${episode.slug}`}>
              <span className="text-primary">
                {episode.title}
                <ArrowTopRightOnSquareIcon className="text-primary ml-1 inline size-4 align-super" />
              </span>
            </Link>
          </div>
          <CollapseWithToggle extra={
            <div className="flex flex-col gap-2">
              <div className="text-muted-foreground font-mono text-sm">
                Published {moment(episode.pubDate).format('MMMM Do YYYY')}
              </div>
              <EpisodeIndicators episode={episodeWithoutPodcast} />
            </div>
          }>
            <div className="font-sans text-sm">{episode.description}</div>
          </CollapseWithToggle>
        </div>
      </div>
    </div>
  );
}

async function EpisodeSummary({ episode }: { episode: EpisodeWithPodcast }) {
  if (episode.summaryUrl === null) {
    return (
      <div className="mt-8 flex w-full flex-col gap-2">
        <div>
          <h1>Summary</h1>
        </div>
        <div className="size-full overflow-y-auto border p-4 text-xs">
          <div className="text-muted-foreground text-sm">Summary not available</div>
        </div>
      </div>
    );
  }

  const res = await fetch(episode.summaryUrl);
  const result = await res.text();
  return (
    <div className="mt-8 flex w-full flex-col gap-2">
      <div>
        <h1>Summary</h1>
      </div>
      <div className="w-full overflow-y-auto border p-4 font-[Inter] text-sm">{result}</div>
    </div>
  );
}

function ParagraphView({ paragraph }: { paragraph: any }) {
  const speakerColors = ['text-teal-400', 'text-sky-400', 'text-[#0000FF]'];

  const start = paragraph.start;
  const startHours = Math.floor(start / 3600);
  const startMinutes = Math.floor((start % 3600) / 60);
  const startSeconds = Math.floor(start % 60);
  const startString = `${startHours}:${startMinutes.toString().padStart(2, '0')}:${startSeconds
    .toString()
    .padStart(2, '0')}`;

  const startTime = moment.duration(start, 'seconds');
  const endTime = paragraph.end;
  const sentences = paragraph.sentences;
  const speaker = paragraph.speaker;
  const speakerColor = speakerColors[speaker % speakerColors.length];
  return (
    <div className="flex flex-row gap-2">
      <div className="flex w-1/5 flex-col gap-2 overflow-hidden text-wrap text-xs">
        <div className="text-primary">Speaker {speaker}</div>
        <div className="text-muted-foreground">{startString}</div>
      </div>
      <div className={`w-4/5 font-[Inter] text-base ${speakerColor}`}>
        {sentences.map((sentence: any, index: number) => (
          <div key={index}>{sentence.text}</div>
        ))}
      </div>
    </div>
  );
}

function TranscriptView({ transcript }: { transcript: any }) {
  const paragraphs = transcript.results?.channels[0].alternatives[0].paragraphs.paragraphs as any[];
  const views = paragraphs.map((paragraph: any, index: number) => <ParagraphView paragraph={paragraph} key={index} />);

  return (
    <div className="w-full overflow-y-auto border p-4 text-xs">
      <div className="flex flex-col gap-4">{views}</div>
    </div>
  );
}

async function EpisodeTranscript({ episode }: { episode: EpisodeWithPodcast }) {
  if (episode.rawTranscriptUrl === null) {
    return (
      <div className="mt-8 flex h-[600px] w-3/5 flex-col gap-2">
        <div>
          <h1>Transcript</h1>
        </div>
        <div className="size-full overflow-y-auto border p-4 text-xs">
          <div className="text-muted-foreground text-xs">Transcript not available</div>
        </div>
      </div>
    );
  }

  const res = await fetch(episode.rawTranscriptUrl, { cache: 'no-store' });
  const result = await res.json();
  return (
    <div className="mt-8 flex h-[600px] w-3/5 flex-col gap-2">
      <div>
        <h1>Transcript</h1>
      </div>
      <TranscriptView transcript={result} />
    </div>
  );
}

async function EpisodeChat({ episode }: { episode: EpisodeWithPodcast }) {
  return (
    <div className="mt-8 flex h-[600px] w-2/5 flex-col gap-2">
      <div>
        <h1>Chat</h1>
      </div>
      <div className="size-full overflow-y-auto border p-4 text-xs">
        <Chat />
      </div>
    </div>
  );
}

export async function EpisodeDetail({ podcastSlug, episodeSlug }: { podcastSlug: string; episodeSlug: string }) {
  const episode = await GetEpisodeWithPodcastBySlug(supabase, podcastSlug, episodeSlug);

  return (
    <div className="mx-auto mt-8 w-4/5 font-mono">
      <EpisodeHeader episode={episode} />
      <EpisodeSummary episode={episode} />
      <div className="flex flex-row gap-4">
        <EpisodeTranscript episode={episode} />
        <EpisodeChat episode={episode} />
      </div>
    </div>
  );
}
