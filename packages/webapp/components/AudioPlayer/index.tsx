'use client';

import React, { createContext, useContext, useRef, useState, MutableRefObject } from 'react';
//import { Audio } from 'openai/resources';
import { EpisodeWithPodcast } from 'podverse-utils';
//import { WaveSurfer, WaveForm } from 'wavesurfer-react';

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

export function AudioPlayer({ episode }: { episode: EpisodeWithPodcast }) {
  const audioUrl = '/audio/7a623d27-1461-4144-a653-850b04b788df.mp3';
  //const audioRef = useRef<HTMLAudioElement | null>(null);
  const player = useAudioPlayer();
  if (!player) {
    return null;
  }
  const { audioRef } = player;

  //   const wavesurferRef = useRef<WaveSurfer | null>(null);
  //   const handleMount = useCallback((waveSurfer: WaveSurfer) => {
  //     wavesurferRef.current = waveSurfer;
  //     if (wavesurferRef.current) {
  //       //const proxyUrl = `/api/proxy?url=${episode.audioUrl}`;
  //       const proxyUrl = '/audio/7a623d27-1461-4144-a653-850b04b788df.mp3';
  //       wavesurferRef.current.load(proxyUrl);
  //       wavesurferRef.current.on('ready', () => {
  //         console.log('WaveSurfer is ready');
  //       });
  //       wavesurferRef.current.on('loading', (data: any) => {
  //         console.log('loading --> ', data);
  //       });
  //       if (window) {
  //         // @ts-ignore
  //         window.surferidze = wavesurferRef.current;
  //       }
  //     }
  //   }, [episode.audioUrl]);

  return (
    <div className="w-full flex flex-row gap-0 mt-2">
      <div className="w-max" />
      <div className="ml-auto">
        <audio src={audioUrl} ref={audioRef} controls />
      </div>
      {/* <WaveSurfer onMount={handleMount} container="#waveform">
        <WaveForm></WaveForm>
      </WaveSurfer> */}
    </div>
  );
}
