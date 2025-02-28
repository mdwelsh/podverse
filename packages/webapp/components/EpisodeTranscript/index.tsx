'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { EpisodeWithPodcast } from 'podverse-utils';
import { EditSpeakersDialog } from '../EditSpeakersDialog';
import { useAudioPlayer } from '@/components/AudioPlayer';
import { PlayCircleIcon } from '@heroicons/react/24/outline';
import { PoweredBy } from '@/components/PoweredBy';

/** Top level transcript component. Includes the AudioPlayer. */
export function EpisodeTranscript({ episode, embed }: { episode: EpisodeWithPodcast; embed?: boolean }) {
  const [transcript, setTranscript] = useState(null);

  useEffect(() => {
    if (episode.rawTranscriptUrl === null) {
      return;
    }

    fetch(episode.rawTranscriptUrl, { cache: 'no-store' })
      .then((res) => res.json())
      .then((result) => {
        setTranscript(result);
      });
  }, [episode]);

  if (episode.rawTranscriptUrl === null || transcript === null) {
    return embed ? null : (
      <div className="mt-8 flex h-[600px] w-full flex-col gap-2 lg:w-3/5">
        <div>
          <h1>Transcript</h1>
        </div>
        <div className="size-full overflow-y-auto border p-4 text-xs"></div>
      </div>
    );
  }

  return embed ? (
    <div className="mt-4 flex flex-col gap-2">
      <PoweredBy />
      <TranscriptView transcript={transcript} episode={episode} embed />
    </div>
  ) : (
    <div className="mt-8 flex h-[600px] w-full flex-col gap-2 lg:w-3/5">
      <div>
        <h1>Transcript</h1>
      </div>
      <TranscriptView transcript={transcript} episode={episode} />
    </div>
  );
}

/** Show view of transcript when available. */
function TranscriptView({
  transcript,
  episode,
  embed,
}: {
  transcript: any;
  episode: EpisodeWithPodcast;
  embed?: boolean;
}) {
  const paragraphs = transcript.results?.channels[0].alternatives[0].paragraphs.paragraphs as any[];
  const itemRefs = useRef(paragraphs.map(() => React.createRef<HTMLDivElement>()));
  const playAnimationRef = useRef<number | undefined>(undefined);
  const player = useAudioPlayer();
  const { audioRef } = player || {};
  const [curTime, setCurTime] = useState(0);

  const doUpdate = useCallback(() => {
    if (audioRef && audioRef.current) {
      setCurTime(audioRef.current.currentTime);
      playAnimationRef.current = requestAnimationFrame(doUpdate);
    }
  }, [audioRef]);

  useEffect(() => {
    const scrollToTime = (time: number) => {
      const index = paragraphs.findIndex((para) => time >= para.start && time <= para.end);
      if (itemRefs.current[index] === undefined) {
        return;
      }
      // Disable scrolling for now.
      //itemRefs.current[index].current?.scrollIntoView({ block: 'center' });
    };
    scrollToTime(curTime);
  }, [curTime, paragraphs, itemRefs, doUpdate]);

  useEffect(() => {
    playAnimationRef.current = requestAnimationFrame(doUpdate);
  }, [doUpdate]);

  const views = paragraphs.map((paragraph: any, index: number) => {
    const isCurrent = (paragraph.start <= curTime && paragraph.end >= curTime) || false;
    return (
      <ParagraphView
        highlight={isCurrent}
        selfRef={itemRefs.current[index]}
        paragraph={paragraph}
        episode={episode}
        key={index}
        embed={embed}
      />
    );
  });

  return (
    <div className="w-full overflow-y-auto border p-4 text-xs">
      <div className="flex flex-col gap-4">{views}</div>
    </div>
  );
}

/** Show a single paragraph. */
function ParagraphView({
  paragraph,
  episode,
  selfRef,
  highlight,
  embed,
}: {
  paragraph: any;
  episode: EpisodeWithPodcast;
  selfRef: React.Ref<HTMLDivElement>;
  highlight: boolean;
  embed?: boolean;
}) {
  const speakerColors = [
    'text-gray-300',
    'text-sky-300',
    'text-rose-200',
    'text-indigo-200',
    'text-lime-200',
    'text-yellow-200',
    'text-indigo-200',
    'text-amber-200',
    'text-pink-200',
    'text-emerald-200',
    'text-purple-200',
  ];

  const start = paragraph.start;
  const startHours = Math.floor(start / 3600);
  const startMinutes = Math.floor((start % 3600) / 60);
  const startSeconds = Math.floor(start % 60);
  const startString = `${startHours}:${startMinutes.toString().padStart(2, '0')}:${startSeconds
    .toString()
    .padStart(2, '0')}`;

  const sentences = paragraph.sentences;
  const speaker = (episode.speakers && episode.speakers[paragraph.speaker]) ?? `Speaker ${paragraph.speaker}`;
  const speakerColor = speakerColors[paragraph.speaker % speakerColors.length];

  return (
    <div className={`group flex flex-row items-start gap-2 border-b pb-2 ${highlight && 'bg-secondary'}`} ref={selfRef}>
      <div className="flex w-1/5 flex-col gap-2 overflow-hidden text-wrap pt-1 text-xs">
        <div className="text-primary">{speaker}</div>
        <div className="text-muted-foreground">{startString}</div>
        {!embed && (
          <div className="hidden text-xs group-hover:block">
            <EditSpeakersDialog episode={episode} speaker={paragraph.speaker} />
          </div>
        )}
      </div>
      <ParagraphText startTime={start} sentences={sentences} speakerColor={speakerColor} embed={embed} />
    </div>
  );
}

export function ParagraphText({
  sentences,
  speakerColor,
  startTime,
  embed,
}: {
  sentences: any;
  speakerColor: string;
  startTime: number;
  embed?: boolean;
}) {
  const audioPlayer = useAudioPlayer();
  if (!embed && !audioPlayer) {
    return null;
  }
  const { play, seek } = audioPlayer || {};

  const doSeek = () => {
    if (!embed) {
      seek!(startTime);
      play!();
    }
  };

  return (
    <div className="flex w-full flex-row justify-between gap-1">
      <div className={`w-full font-sans text-sm ${speakerColor}`}>
        {!embed && (
          <div className="text-primary hidden group-hover:block" onClick={doSeek}>
            <PlayCircleIcon className="float-right size-8" />
          </div>
        )}
        {sentences.map((sentence: any, index: number) => (
          <span key={index}>{sentence.text}&nbsp;&nbsp;</span>
        ))}
      </div>
    </div>
  );
}
