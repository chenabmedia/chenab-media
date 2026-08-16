'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, X, Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';

export const AudioPlayerDrawer: React.FC = () => {
  const { currentTrack, isPlaying, togglePlay, pauseTrack } = useAudio();
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentTrack) {
        pauseTrack();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, pauseTrack]);

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#111111]/95 backdrop-blur-lg border-t border-[#222222] px-5 sm:px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] transition-all duration-300 shadow-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.releaseTitle}
            className="w-12 h-12 object-cover rounded-xs border border-[#222222]"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-800/50 rounded-xs">
                NOW PLAYING
              </span>
              <span className="font-mono text-xs text-[#777777] hidden sm:inline-block truncate">
                {currentTrack.releaseTitle}
              </span>
            </div>
            <h4 className="font-display font-semibold text-sm text-[#F5F5F5] truncate mt-0.5">
              {currentTrack.track.title}
            </h4>
            <p className="font-mono text-xs text-[#999999] truncate">
              {currentTrack.artistName}
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-md hidden md:flex flex-col items-center gap-1.5 px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-[#F5F5F5] text-[#080808] hover:bg-white transition-colors focus-visible:ring-2 focus-visible:ring-emerald-400"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            </button>
          </div>
          <div className="w-full flex items-center gap-3 font-mono text-[11px] text-[#666666]">
            <span>01:14</span>
            <div className="flex-1 h-1 bg-[#222222] rounded-full overflow-hidden cursor-pointer">
              <div
                className="h-full bg-[#F5F5F5] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span>{currentTrack.track.duration}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={togglePlay}
            className="md:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-[#F5F5F5] text-[#080808] focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="hidden sm:flex min-w-[44px] min-h-[44px] items-center justify-center text-[#888888] hover:text-[#F5F5F5] transition-colors focus-visible:ring-1 focus-visible:ring-[#F5F5F5]"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <button
            onClick={pauseTrack}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#777777] hover:text-[#F5F5F5] transition-colors focus-visible:ring-1 focus-visible:ring-[#F5F5F5]"
            title="Close Player"
            aria-label="Close Player"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
