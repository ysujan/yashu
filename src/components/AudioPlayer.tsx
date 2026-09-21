import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Repeat,
  Download,
  Loader2,
  Music,
  Sliders,
  Disc,
} from 'lucide-react';
import { FileItem } from '../types';
import { formatBytes } from '../lib/storage';

interface AudioPlayerProps {
  item: FileItem;
  blobUrl: string | null;
  isLoading: boolean;
  onDownload: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  item,
  blobUrl,
  isLoading,
  onDownload,
}) => {
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isLooping, setIsLooping] = React.useState(false);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [audioError, setAudioError] = React.useState(false);

  // Format seconds into MM:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused || audio.ended) {
      audio.play().catch((err) => console.warn('Audio playback error', err));
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleSkip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      audioRef.current.muted = newVol === 0;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      const restore = volume > 0 ? volume : 0.8;
      audioRef.current.muted = false;
      audioRef.current.volume = restore;
      setIsMuted(false);
      setVolume(restore);
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const toggleLoop = () => {
    if (!audioRef.current) return;
    const next = !isLooping;
    audioRef.current.loop = next;
    setIsLooping(next);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2, 0.75];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextRate = speeds[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  return (
    <div
      id="audio-player-card"
      className="w-full max-w-lg bg-zinc-950 rounded-3xl p-6 sm:p-8 shadow-2xl border border-zinc-800 flex flex-col items-center select-none relative overflow-hidden"
    >
      {/* Background ambient glow */}
      <div className="absolute top-1/4 -left-12 w-48 h-48 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-12 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden Native Audio Element */}
      {blobUrl && (
        <audio
          ref={audioRef}
          src={blobUrl}
          onTimeUpdate={() => {
            if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) setDuration(audioRef.current.duration);
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            if (!isLooping) setIsPlaying(false);
          }}
          onError={() => setAudioError(true)}
        />
      )}

      {/* Album Artwork / Spinning Disc Art */}
      <div className="relative mb-6">
        <div
          className={`w-32 h-32 rounded-full bg-gradient-to-tr from-zinc-900 via-zinc-850 to-zinc-900 border-4 border-zinc-800 flex items-center justify-center shadow-2xl transition-transform duration-700 ${
            isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''
          }`}
        >
          {/* Vinyl Grooves */}
          <div className="w-24 h-24 rounded-full border border-zinc-800/80 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border border-zinc-800/60 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-400">
                <Music className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Playing Badge */}
        {isPlaying && (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono text-amber-300 font-semibold uppercase tracking-wider">
            Playing
          </span>
        )}
      </div>

      {/* Track Title & Meta */}
      <h3 className="text-base font-semibold text-white text-center max-w-sm truncate mb-1">
        {item.name}
      </h3>
      <div className="flex items-center space-x-2 text-xs font-mono text-zinc-400 mb-6">
        <span>{item.name.split('.').pop()?.toUpperCase() || 'AUDIO'}</span>
        <span>•</span>
        <span>{formatBytes(item.size)}</span>
      </div>

      {/* Animated Equalizer Waveform Bars */}
      <div className="flex items-end justify-center space-x-1.5 h-12 w-full max-w-xs mb-6 px-4">
        {[18, 32, 24, 45, 28, 50, 36, 22, 42, 30, 48, 26, 38, 20, 34, 46, 28, 16].map(
          (baseHeight, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all duration-200 ${
                isPlaying
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-zinc-700'
              }`}
              style={{
                height: isPlaying ? `${Math.max(8, (baseHeight * ((i % 3) + 1)) % 48)}px` : '8px',
                animationDelay: `${i * 60}ms`,
              }}
            />
          )
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center space-x-2 text-xs text-amber-400 mb-4 font-mono">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading audio stream...</span>
        </div>
      )}

      {/* Scrubber Timeline */}
      <div className="w-full mb-4">
        <input
          type="range"
          min={0}
          max={duration || 1}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:h-2 transition-all"
        />
        <div className="flex justify-between text-[11px] font-mono text-zinc-400 mt-1.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Primary Playback Controls */}
      <div className="flex items-center space-x-4 sm:space-x-6 mb-6">
        <button
          type="button"
          onClick={() => handleSkip(-10)}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-850 transition-colors cursor-pointer"
          title="Rewind 10s"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handlePlayPause}
          className="w-14 h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 flex items-center justify-center shadow-xl shadow-amber-500/25 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 fill-current" />
          ) : (
            <Play className="w-6 h-6 fill-current ml-0.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => handleSkip(10)}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-850 transition-colors cursor-pointer"
          title="Forward 10s"
        >
          <RotateCw className="w-5 h-5" />
        </button>
      </div>

      {/* Secondary Controls: Volume, Loop, Speed, Download */}
      <div className="w-full pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
        {/* Volume */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={toggleMute}
            className="hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-blue-400" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
        </div>

        {/* Speed & Loop */}
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={toggleLoop}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLooping ? 'text-amber-400 bg-amber-950/40' : 'hover:text-white hover:bg-zinc-850'
            }`}
            title={isLooping ? 'Looping enabled' : 'Enable loop'}
          >
            <Repeat className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={cycleSpeed}
            className="px-2 py-1 rounded-md bg-zinc-850 hover:bg-zinc-800 text-[11px] font-mono text-zinc-300 transition-colors cursor-pointer"
            title="Cycle Playback Speed"
          >
            {playbackRate}x
          </button>
        </div>

        {/* Download Button */}
        <button
          type="button"
          onClick={onDownload}
          className="px-3 py-1.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 active:bg-zinc-700 text-zinc-200 hover:text-white font-medium flex items-center space-x-1.5 transition-colors cursor-pointer border border-zinc-750"
          title="Download Audio File"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download</span>
        </button>
      </div>
    </div>
  );
};
