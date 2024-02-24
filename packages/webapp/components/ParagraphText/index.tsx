'use client';

import { PlayCircleIcon } from '@heroicons/react/24/outline';
import { useAudioPlayer } from '@/components/AudioPlayer';

export function ParagraphText({ sentences, speakerColor, startTime }: { sentences: any; speakerColor: string; startTime: number }) {
  const audioPlayer = useAudioPlayer();
  if (!audioPlayer) {
    return null;
  }
  const { play, pause, seek, isPlaying } = audioPlayer;

  const doSeek = () => {
    seek(startTime);
    play();
  }

  return (
    <div className="flex w-4/5 flex-row gap-1">
      <div className={`font-mono text-base ${speakerColor}`}>
        {sentences.map((sentence: any, index: number) => (
          <div key={index}>{sentence.text}</div>
        ))}
      </div>
      <div className="hidden group-hover:block text-primary" onClick={doSeek}>
        <PlayCircleIcon className="size-8" />
      </div>
    </div>
  );
}
