'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Track } from '@/types';

export interface PlayingTrackData {
  track: Track;
  releaseTitle: string;
  artistName: string;
  coverUrl: string;
}

export type AudioPlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

interface AudioContextType {
  currentTrack: PlayingTrackData | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackState: AudioPlaybackState;
  errorMessage: string | null;
  playTrack: (track: Track, releaseTitle: string, artistName: string, coverUrl: string) => void;
  pauseTrack: () => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  closePlayer: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<PlayingTrackData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize singleton audio element
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio();
    audio.preload = 'metadata';
    audio.volume = volume;
    audio.muted = isMuted;
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const onCanPlay = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
      setPlaybackState((prev) => (prev === 'loading' ? 'playing' : prev));
    };

    const onPlay = () => {
      setIsPlaying(true);
      setPlaybackState('playing');
      setErrorMessage(null);
    };

    const onPause = () => {
      setIsPlaying(false);
      setPlaybackState((prev) => (prev === 'ended' || prev === 'error' ? prev : 'paused'));
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setPlaybackState('ended');
      setCurrentTime(audio.duration || 0);
    };

    const onError = () => {
      setIsPlaying(false);
      setPlaybackState('error');
      setErrorMessage('Preview unavailable');
    };

    const onWaiting = () => {
      setPlaybackState('loading');
    };

    const onPlaying = () => {
      setIsPlaying(true);
      setPlaybackState('playing');
      setErrorMessage(null);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  const pauseTrack = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const playTrack = useCallback(
    (track: Track, releaseTitle: string, artistName: string, coverUrl: string) => {
      const audio = audioRef.current;
      if (!audio) return;

      const previewUrl = track.audioPreviewUrl?.trim() || '';

      // Check if we are tapping the currently active track
      const isSameTrack =
        currentTrack &&
        ((track.id && currentTrack.track.id === track.id) ||
          (track.title === currentTrack.track.title && currentTrack.releaseTitle === releaseTitle));

      if (isSameTrack) {
        if (isPlaying) {
          pauseTrack();
        } else {
          if (!previewUrl) {
            setPlaybackState('error');
            setErrorMessage('Preview unavailable');
            return;
          }
          setPlaybackState('loading');
          audio.play().catch(() => {
            setIsPlaying(false);
            setPlaybackState('error');
            setErrorMessage('Preview unavailable');
          });
        }
        return;
      }

      // New track selection
      setCurrentTrack({ track, releaseTitle, artistName, coverUrl });
      setCurrentTime(0);
      setDuration(0);
      setErrorMessage(null);

      if (!previewUrl) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
        setIsPlaying(false);
        setPlaybackState('error');
        setErrorMessage('Preview unavailable');
        return;
      }

      try {
        audio.pause();
        audio.src = previewUrl;
        audio.load();
        setPlaybackState('loading');

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            // Autoplay rejection or network issue handled gracefully
            console.warn('Playback request did not start automatically:', err?.message || err);
            setIsPlaying(false);
            setPlaybackState('paused');
          });
        }
      } catch (err) {
        console.warn('Audio playback error:', err);
        setIsPlaying(false);
        setPlaybackState('error');
        setErrorMessage('Preview unavailable');
      }
    },
    [currentTrack, isPlaying, pauseTrack]
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    const previewUrl = currentTrack.track.audioPreviewUrl?.trim() || '';
    if (!previewUrl) {
      setPlaybackState('error');
      setErrorMessage('Preview unavailable');
      return;
    }

    if (isPlaying) {
      pauseTrack();
    } else {
      setPlaybackState('loading');
      audio.play().catch(() => {
        setIsPlaying(false);
        setPlaybackState('error');
        setErrorMessage('Preview unavailable');
      });
    }
  }, [currentTrack, isPlaying, pauseTrack]);

  const seek = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const targetTime = Math.max(0, Math.min(seconds, duration || audio.duration || 0));
      audio.currentTime = targetTime;
      setCurrentTime(targetTime);
    },
    [duration]
  );

  const setVolume = useCallback((newVolume: number) => {
    const audio = audioRef.current;
    const clamped = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clamped);
    if (audio) {
      audio.volume = clamped;
      if (clamped > 0 && audio.muted) {
        audio.muted = false;
        setIsMuted(false);
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const newMuted = !audio.muted;
    audio.muted = newMuted;
    setIsMuted(newMuted);
  }, []);

  const closePlayer = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setPlaybackState('idle');
    setErrorMessage(null);
  }, []);

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        playbackState,
        errorMessage,
        playTrack,
        pauseTrack,
        togglePlay,
        seek,
        setVolume,
        toggleMute,
        closePlayer,
      }}
    >
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
