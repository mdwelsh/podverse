import Link from 'next/link';
import supabase from '@/lib/supabase';
import { Episode, EpisodeWithPodcast, GetEpisodeWithPodcastBySlug } from 'podverse-utils';
import moment from 'moment';
import { EpisodeIndicators } from '../Indicators';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { Chat } from '@/components/Chat';

function EpisodeHeader({ episode }: { episode: EpisodeWithPodcast }) {
  const episodeWithoutPodcast = { ...episode, podcast: 0 };

  return (
    <div className="w-full flex flex-col gap-4 font-mono">
      <div className="text-muted-foreground">
        From{' '}
        <Link href={`/podcast/${episode.podcast.slug}`}>
          <span className="text-primary">
            {episode.podcast.title}
            <ArrowTopRightOnSquareIcon className="text-primary h-3 w-3 ml-1 inline align-super" />
          </span>
        </Link>
      </div>
      <div className="w-full flex flex-row gap-4">
        <div className="w-[250px]">{episode.imageUrl && <img src={episode.imageUrl} />}</div>
        <div className="w-full flex flex-col gap-4">
          <div className="text-xl font-bold text-primary">
            <Link href={episode.url || `/podcast/${episode.podcast.slug}/episode/${episode.slug}`}>
              <span className="text-primary">
                {episode.title}
                <ArrowTopRightOnSquareIcon className="text-primary h-4 w-4 ml-1 inline align-super" />
              </span>
            </Link>
          </div>
          <div className="text-sm font-sans">{episode.description}</div>
          <div className="text-sm text-muted-foreground">
            Published {moment(episode.pubDate).format('MMMM Do YYYY')}
          </div>
          <EpisodeIndicators episode={episodeWithoutPodcast} />
        </div>
      </div>
    </div>
  );
}

async function EpisodeSummary({ episode }: { episode: EpisodeWithPodcast }) {
  if (episode.summaryUrl === null) {
    return (
      <div className="w-full mt-8 flex flex-col gap-2">
        <div>
          <h1>Summary</h1>
        </div>
        <div className="w-full border p-4 text-xs overflow-y-auto h-full">
          <div className="text-sm text-muted-foreground">Summary not available</div>
        </div>
      </div>
    );
  }

  const res = await fetch(episode.summaryUrl);
  const result = await res.text();
  return (
    <div className="w-full mt-8 flex flex-col gap-2">
      <div>
        <h1>Summary</h1>
      </div>
      <div className="w-full border p-4 text-sm overflow-y-auto font-[Inter]">{result}</div>
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
      <div className="text-xs w-1/5 text-wrap overflow-hidden flex flex-col gap-2">
        <div className="text-primary">Speaker {speaker}</div>
        <div className="text-muted-foreground">{startString}</div>
      </div>
      <div className={`w-4/5 text-base font-[Inter] ${speakerColor}`}>
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
    <div className="w-full border p-4 text-xs overflow-y-auto">
      <div className="flex flex-col gap-4">{views}</div>
    </div>
  );
}

async function EpisodeTranscript({ episode }: { episode: EpisodeWithPodcast }) {
  if (episode.rawTranscriptUrl === null) {
    return (
      <div className="w-3/5 mt-8 h-[600px] flex flex-col gap-2">
        <div>
          <h1>Transcript</h1>
        </div>
        <div className="w-full border p-4 text-xs overflow-y-auto h-full">
          <div className="text-xs text-muted-foreground">Transcript not available</div>
        </div>
      </div>
    );
  }

  const res = await fetch(episode.rawTranscriptUrl, { cache: 'no-store' });
  const result = await res.json();
  return (
    <div className="w-3/5 mt-8 h-[600px] flex flex-col gap-2">
      <div>
        <h1>Transcript</h1>
      </div>
      <TranscriptView transcript={result} />
    </div>
  );
}

async function EpisodeChat({ episode }: { episode: EpisodeWithPodcast }) {
  return (
    <div className="w-2/5 mt-8 h-[600px] flex flex-col gap-2">
      <div>
        <h1>Chat</h1>
      </div>
      <div className="w-full border p-4 text-xs overflow-y-auto h-full">
        <Chat />
      </div>
    </div>
  );
}

export async function EpisodeDetail({ podcastSlug, episodeSlug }: { podcastSlug: string; episodeSlug: string }) {
  const episode = await GetEpisodeWithPodcastBySlug(supabase, podcastSlug, episodeSlug);

  return (
    <div className="w-4/5 mx-auto mt-8 font-mono">
      <EpisodeHeader episode={episode} />
      <EpisodeSummary episode={episode} />
      <div className="flex flex-row gap-4">
        <EpisodeTranscript episode={episode} />
        <EpisodeChat episode={episode} />
      </div>
    </div>
  );
}
