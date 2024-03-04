'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState, MutableRefObject } from 'react';
import { EpisodeWithPodcast } from 'podverse-utils';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/outline';

interface AudioPlayerContextType {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  isPlaying: boolean;
  audioRef: MutableRefObject<HTMLAudioElement>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function useAudioPlayer() {
  return useContext(AudioPlayerContext);
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef(new Audio());
  const [isPlaying, setIsPlaying] = useState(false);

  const play = () => {
    audioRef.current.play();
    setIsPlaying(true);
  };

  const pause = () => {
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const seek = (time: number) => {
    audioRef.current.currentTime = time;
  };

  const value = {
    play,
    pause,
    seek,
    isPlaying,
    audioRef,
  };

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>;
}

function secondsToTime(seconds: number) {
  const numHours = Math.floor(seconds / 3600);
  const numMinutes = Math.floor((seconds % 3600) / 60);
  const numSeconds = Math.floor(seconds % 60);
  return `${numHours}:${numMinutes.toString().padStart(2, '0')}:${numSeconds.toString().padStart(2, '0')}`;
}

export function AudioPlayer({ episode }: { episode: EpisodeWithPodcast }) {
  const [duration, setDuration] = useState(0);
  const player = useAudioPlayer();
  if (!player) {
    return null;
  }
  const { audioRef } = player;

  //const audioUrl = '/audio/7a623d27-1461-4144-a653-850b04b788df.mp3';
  const audioUrl = `/api/proxy?url=${episode.audioUrl}`;
  console.log('Loading audio from URL: ', audioUrl);

  const onLoadedMetadata = () => {
    const seconds = audioRef.current.duration;
    setDuration(seconds);
  };

  return (
    <div className="border-primary bg-muted fixed bottom-0 z-20 w-4/5 border-t p-4">
      <AudioControls audioRef={audioRef} duration={duration} />
      <audio src={audioUrl} ref={audioRef} onLoadedMetadata={onLoadedMetadata} />
    </div>
  );
}

function AudioControls({ audioRef, duration }: { audioRef: MutableRefObject<HTMLAudioElement>; duration: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [curTime, setCurTime] = useState(0);
  const playAnimationRef = useRef<number | undefined>(undefined);

  const doUpdate = useCallback(() => {
    setIsPlaying(!audioRef.current.paused);
    setCurTime(audioRef.current.currentTime);
    playAnimationRef.current = requestAnimationFrame(doUpdate);
  }, [audioRef]);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
    playAnimationRef.current = requestAnimationFrame(doUpdate);
  }, [isPlaying, audioRef, doUpdate]);

  const onPlayPauseClick = () => {
    if (audioRef.current.paused) {
      audioRef.current.play();
    } else {
      audioRef.current.pause();
    }
    setIsPlaying(!audioRef.current.paused);
  };

  const onSeek = (time: number) => {
    audioRef.current.currentTime = time;
    setCurTime(time);
  };

  return (
    <div className="flex w-full flex-row items-center gap-2">
      <div>{secondsToTime(curTime)}</div>
      <PausePlayButton isPlaying={isPlaying} onClick={onPlayPauseClick} />
      <AudioSeeker audioRef={audioRef} curTime={curTime} duration={duration} onValueChange={onSeek} />
      <div>{secondsToTime(duration)}</div>
    </div>
  );
}

function PausePlayButton({ isPlaying, onClick }: { isPlaying: boolean; onClick: () => void }) {
  return (
    <Button onClick={onClick} variant="secondary">
      {isPlaying ? <PauseIcon className="size-6" /> : <PlayIcon className="size-6" />}
    </Button>
  );
}

function AudioSeeker({
  audioRef,
  curTime,
  duration,
  onValueChange,
}: {
  audioRef: MutableRefObject<HTMLAudioElement>;
  curTime: number;
  duration: number;
  onValueChange: (value: number) => void;
}) {
  return <Slider onValueChange={(val) => onValueChange(val[0])} value={[curTime]} min={0} max={duration} step={1} />;
}
