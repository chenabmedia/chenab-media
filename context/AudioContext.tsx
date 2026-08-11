'use client';

import React, { createContext, useContext, useState } from 'react';
import { Track } from '@/types';

interface AudioContextType {
  currentTrack: { track: Track; releaseTitle: string; artistName: string; coverUrl: string } | null;
  isPlaying: boolean;
  playTrack: (track: Track, releaseTitle: string, artistName: string, coverUrl: string) => void;
  pauseTrack: () => void;
  togglePlay: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<{ track: Track; releaseTitle: string; artistName: string; coverUrl: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playTrack = (track: Track, releaseTitle: string, artistName: string, coverUrl: string) => {
    setCurrentTrack({ track, releaseTitle, artistName, coverUrl });
    setIsPlaying(true);
  };

  const pauseTrack = () => {
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (currentTrack) {
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <AudioContext.Provider value={{ currentTrack, isPlaying, playTrack, pauseTrack, togglePlay }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
