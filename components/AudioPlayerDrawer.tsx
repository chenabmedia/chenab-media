'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, X, Volume2, VolumeX, AlertCircle, Loader2 } from 'lucide-react';
import { useAudio } from '@/context/AudioContext';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const AudioPlayerDrawer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackState,
    errorMessage,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    closePlayer,
  } = useAudio();

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekTime, setSeekTime] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept inputs/textareas
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'Escape' && currentTrack) {
        closePlayer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, closePlayer]);

  const activeTime = isSeeking ? seekTime : currentTime;
  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (activeTime / duration) * 100)) : 0;

  const handleSeekStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    setIsSeeking(true);
    updateSeekPosition(e);
  };

  const updateSeekPosition = useCallback(
    (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement> | MouseEvent | TouchEvent) => {
      if (!progressBarRef.current || duration <= 0) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const ratio = clickX / rect.width;
      const targetTime = ratio * duration;
      setSeekTime(targetTime);
    },
    [duration]
  );

  useEffect(() => {
    if (!isSeeking) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      updateSeekPosition(e);
    };

    const handleEnd = () => {
      setIsSeeking(false);
      seek(seekTime);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isSeeking, seekTime, seek, updateSeekPosition]);

  if (!currentTrack) return null;

  const isUnavailable =
    playbackState === 'error' ||
    !currentTrack.track.audioPreviewUrl ||
    currentTrack.track.audioPreviewUrl.trim() === '';
  const isLoading = playbackState === 'loading';

  return (
    <div
      id="audio-player-drawer"
      role="region"
      aria-label="Audio Preview Player"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0E0E0E]/95 backdrop-blur-xl border-t border-[#222222] px-4 sm:px-6 pt-3.5 pb-[calc(0.9rem+env(safe-area-inset-bottom,0px))] transition-all duration-300 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
        {/* Track info */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 sm:flex-initial max-w-[240px] sm:max-w-xs md:max-w-sm">
          <div className="relative w-12 h-12 rounded-xs border border-[#222222] overflow-hidden shrink-0 bg-[#161616]">
            {currentTrack.coverUrl ? (
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.releaseTitle}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-mono text-[9px] text-[#555]">
                CHENAB
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isUnavailable ? (
                <span className="font-mono text-[9px] text-amber-400 uppercase tracking-widest px-1.5 py-0.5 bg-amber-950/60 border border-amber-800/50 rounded-xs flex items-center gap-1">
                  <AlertCircle size={9} />
                  UNAVAILABLE
                </span>
              ) : (
                <span className="font-mono text-[9px] text-emerald-400 uppercase tracking-widest px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-800/50 rounded-xs">
                  {isPlaying ? 'PLAYING PREVIEW' : 'AUDIO PREVIEW'}
                </span>
              )}
              <span className="font-mono text-xs text-[#777777] hidden md:inline-block truncate">
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

        {/* Center controls (desktop & tablet) */}
        <div className="flex-1 max-w-lg hidden md:flex flex-col items-center gap-1.5 px-4">
          <div className="flex items-center gap-4">
            <button
              id="audio-player-play-btn"
              onClick={togglePlay}
              disabled={isUnavailable}
              className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition-all focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                isUnavailable
                  ? 'bg-[#222222] text-[#666666] cursor-not-allowed'
                  : 'bg-[#F5F5F5] text-[#080808] hover:bg-white active:scale-95'
              }`}
              aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
              title={isUnavailable ? 'Preview unavailable' : isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={16} />
              ) : (
                <Play size={16} className="ml-0.5" fill="currentColor" />
              )}
            </button>
          </div>

          {/* Real seekbar with timing */}
          <div className="w-full flex items-center gap-3 font-mono text-[11px] text-[#777777]">
            <span className="w-10 text-right shrink-0">{formatTime(activeTime)}</span>

            <div
              ref={progressBarRef}
              onMouseDown={handleSeekStart}
              onTouchStart={handleSeekStart}
              role="slider"
              tabIndex={0}
              aria-label="Seek audio preview"
              aria-valuemin={0}
              aria-valuemax={Math.floor(duration)}
              aria-valuenow={Math.floor(activeTime)}
              aria-valuetext={`${formatTime(activeTime)} of ${formatTime(duration)}`}
              onKeyDown={(e) => {
                if (duration <= 0) return;
                if (e.key === 'ArrowRight') seek(Math.min(duration, currentTime + 5));
                if (e.key === 'ArrowLeft') seek(Math.max(0, currentTime - 5));
              }}
              className={`flex-1 h-3 flex items-center cursor-pointer group ${
                duration <= 0 ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              <div className="w-full h-1 bg-[#222222] rounded-full overflow-hidden relative group-hover:h-1.5 transition-all">
                <div
                  className="h-full bg-white transition-all duration-75"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <span className="w-10 shrink-0">
              {duration > 0
                ? formatTime(duration)
                : currentTrack.track.duration || '--:--'}
            </span>
          </div>

          {errorMessage && (
            <span className="font-mono text-[10px] text-amber-400">{errorMessage}</span>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile play/pause toggle */}
          <button
            id="audio-player-mobile-play-btn"
            onClick={togglePlay}
            disabled={isUnavailable}
            className={`md:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              isUnavailable
                ? 'bg-[#222222] text-[#666666] cursor-not-allowed'
                : 'bg-[#F5F5F5] text-[#080808]'
            }`}
            aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={16} />
            ) : (
              <Play size={16} fill="currentColor" />
            )}
          </button>

          {/* Volume controls */}
          <div
            className="relative hidden sm:flex items-center"
            onMouseEnter={() => setShowVolumeSlider(true)}
            onMouseLeave={() => setShowVolumeSlider(false)}
          >
            <button
              id="audio-player-mute-btn"
              onClick={toggleMute}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[#888888] hover:text-[#F5F5F5] transition-colors focus-visible:ring-1 focus-visible:ring-[#F5F5F5]"
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? 'Unmute preview' : 'Mute preview'}
            >
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>

            {showVolumeSlider && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-[#181818] border border-[#2A2A2A] rounded shadow-xl flex items-center h-24 w-8 justify-center">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-16 h-1 accent-white transform -rotate-90 cursor-pointer"
                  aria-label="Audio volume"
                />
              </div>
            )}
          </div>

          {/* Close player */}
          <button
            id="audio-player-close-btn"
            onClick={closePlayer}
            className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-[#777777] hover:text-[#F5F5F5] transition-colors focus-visible:ring-1 focus-visible:ring-[#F5F5F5]"
            title="Close Preview Player"
            aria-label="Close Preview Player"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
