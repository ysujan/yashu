import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture2,
  Download,
  Loader2,
  AlertCircle,
  Sliders,
} from 'lucide-react';
import { FileItem } from '../types';
import { formatBytes } from '../lib/storage';

interface VideoPlayerProps {
  item: FileItem;
  blobUrl: string | null;
  isLoading: boolean;
  onDownload: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  item,
  blobUrl,
  isLoading,
  onDownload,
}) => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [isMuted, setIsMuted] = React.useState(false);
  const [playbackRate, setPlaybackRate] = React.useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [videoError, setVideoError] = React.useState<string | null>(null);
  const [resolution, setResolution] = React.useState<{ width: number; height: number } | null>(null);
  const [controlsVisible, setControlsVisible] = React.useState(true);
  const hideTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Format seconds into MM:SS or HH:MM:SS
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const mStr = String(m).padStart(2, '0');
    const sStr = String(s).padStart(2, '0');
    if (h > 0) {
      return `${h}:${mStr}:${sStr}`;
    }
    return `${mStr}:${sStr}`;
  };

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      video.play().catch((err) => {
        console.warn('Playback error:', err);
      });
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleSkip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      const restoreVol = volume > 0 ? volume : 0.7;
      videoRef.current.muted = false;
      videoRef.current.volume = restoreVol;
      setIsMuted(false);
      setVolume(restoreVol);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  const togglePip = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP error', e);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  React.useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // Auto-hide controls on mouse idle
  const handleMouseMove = () => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isPlaying) {
      hideTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
        setShowSpeedMenu(false);
      }, 2800);
    }
  };

  // Keyboard controls
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSkip(5);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSkip(-5);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration, volume, isMuted]);

  return (
    <div
      ref={containerRef}
      id="video-player-root"
      onMouseMove={handleMouseMove}
      className="relative w-full max-w-4xl h-[70vh] bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col justify-center items-center group"
    >
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 z-30 bg-zinc-950 flex flex-col items-center justify-center space-y-3 text-zinc-300">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          <p className="text-xs font-mono">
            Loading video stream ({formatBytes(item.size)})...
          </p>
        </div>
      )}

      {/* Codec Error Fallback */}
      {videoError && (
        <div className="absolute inset-0 z-30 bg-zinc-950/95 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">
            Playback Notice for {item.name}
          </h3>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            This video codec is not directly supported by browser rendering, but your full-size video ({formatBytes(item.size)}) is safely saved and ready to watch with VLC or your local media player.
          </p>
          <button
            type="button"
            onClick={onDownload}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Video ({formatBytes(item.size)})</span>
          </button>
        </div>
      )}

      {/* Video Element */}
      {blobUrl && (
        <video
          ref={videoRef}
          src={blobUrl}
          playsInline
          onClick={handlePlayPause}
          onTimeUpdate={() => {
            if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
              setResolution({
                width: videoRef.current.videoWidth,
                height: videoRef.current.videoHeight,
              });
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onError={() => {
            setVideoError('Video format unsupported by browser decoder');
          }}
          className="w-full h-full object-contain cursor-pointer"
        />
      )}

      {/* Center Big Play/Pause Button on Hover / Paused */}
      {!isPlaying && !isLoading && !videoError && (
        <button
          type="button"
          onClick={handlePlayPause}
          className="absolute z-20 w-16 h-16 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white flex items-center justify-center shadow-2xl shadow-blue-600/40 transform hover:scale-110 active:scale-95 transition-all cursor-pointer"
          title="Play (Space)"
        >
          <Play className="w-8 h-8 fill-white ml-1" />
        </button>
      )}

      {/* Top Details Overlay */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 flex items-center justify-between pointer-events-none transition-opacity duration-200 ${
          controlsVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center space-x-2 truncate">
          <span className="text-xs font-semibold text-white truncate max-w-sm">
            {item.name}
          </span>
          {resolution && (
            <span className="px-2 py-0.5 rounded-md bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono text-zinc-300">
              {resolution.width} × {resolution.height}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-md bg-zinc-900/80 border border-zinc-800 text-[10px] font-mono text-zinc-400">
            {formatBytes(item.size)}
          </span>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div
        id="video-controls-overlay"
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/95 via-black/80 to-transparent z-20 flex flex-col space-y-2 transition-opacity duration-200 ${
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Timeline Scrubber */}
        <div className="relative w-full flex items-center group/scrub">
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-zinc-700/80 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:h-2 transition-all"
          />
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between text-zinc-300 text-xs">
          {/* Left: Play/Pause, Skips, Time */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={handlePlayPause}
              className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            <button
              type="button"
              onClick={() => handleSkip(-10)}
              className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Rewind 10 seconds"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleSkip(10)}
              className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Forward 10 seconds"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Time Stamp */}
            <span className="font-mono text-[11px] text-zinc-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Volume Control */}
            <div className="flex items-center space-x-1.5 ml-1">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
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
                className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          {/* Right: Speed, PiP, Fullscreen, Download */}
          <div className="flex items-center space-x-1.5 relative">
            {/* Speed Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSpeedMenu((s) => !s)}
                className="px-2 py-1 rounded-lg hover:text-white hover:bg-white/10 font-mono text-[11px] transition-colors cursor-pointer"
                title="Playback Speed"
              >
                {playbackRate}x
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-9 right-0 bg-zinc-950 border border-zinc-800 rounded-xl p-1 shadow-xl z-30 flex flex-col space-y-0.5 w-24 text-[11px]">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => handleSpeedChange(rate)}
                      className={`px-2.5 py-1.5 text-left rounded-lg transition-colors cursor-pointer ${
                        playbackRate === rate
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-zinc-300 hover:bg-zinc-850'
                      }`}
                    >
                      {rate === 1 ? '1.0x Normal' : `${rate}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PiP Button */}
            <button
              type="button"
              onClick={togglePip}
              className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Picture in Picture"
            >
              <PictureInPicture2 className="w-4 h-4" />
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={onDownload}
              className="ml-2 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white flex items-center space-x-1.5 font-medium transition-all shadow-md shadow-blue-600/30 cursor-pointer"
              title="Download Video"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
