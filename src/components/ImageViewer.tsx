import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  Maximize,
  Minimize,
  Download,
  RotateCcw as ResetIcon,
  Eye,
  Loader2,
} from 'lucide-react';
import { FileItem } from '../types';
import { formatBytes } from '../lib/storage';

interface ImageViewerProps {
  item: FileItem;
  blobUrl: string | null;
  isLoading: boolean;
  onDownload: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  item,
  blobUrl,
  isLoading,
  onDownload,
}) => {
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [dimensions, setDimensions] = React.useState<{ width: number; height: number } | null>(null);
  const [isPanning, setIsPanning] = React.useState(false);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = React.useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Reset zoom & pan when item changes
  React.useEffect(() => {
    setZoom(1);
    setRotation(0);
    setFlipped(false);
    setPan({ x: 0, y: 0 });
    setDimensions(null);
  }, [item.id]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    setStartPos({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || zoom <= 1) return;
    setPan({
      x: e.clientX - startPos.x,
      y: e.clientY - startPos.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setFlipped(false);
    setPan({ x: 0, y: 0 });
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
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const isSvg = item.name.toLowerCase().endsWith('.svg');
  const imageSource = blobUrl || item.previewUrl || item.dataUrl || null;

  return (
    <div
      ref={containerRef}
      id="image-viewer-container"
      className="w-full h-full flex flex-col items-center justify-center relative select-none overflow-hidden bg-black/70 rounded-xl"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
    >
      {/* Loading state */}
      {isLoading && !imageSource && (
        <div className="flex flex-col items-center justify-center space-y-3 text-zinc-400">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs font-mono">Loading high-resolution image...</p>
        </div>
      )}

      {/* Main Image Surface */}
      {imageSource && !isLoading && (
        <div
          className="transition-transform duration-100 ease-out flex items-center justify-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg) scaleX(${
              flipped ? -1 : 1
            })`,
          }}
        >
          {isSvg && item.textData ? (
            <div
              className="max-h-[72vh] max-w-[85vw] object-contain pointer-events-none"
              dangerouslySetInnerHTML={{ __html: item.textData }}
            />
          ) : (
            <img
              src={imageSource}
              alt={item.name}
              onLoad={(e) => {
                const target = e.currentTarget;
                setDimensions({ width: target.naturalWidth, height: target.naturalHeight });
              }}
              className="max-h-[72vh] max-w-[85vw] object-contain rounded-sm pointer-events-none shadow-2xl"
              draggable={false}
            />
          )}
        </div>
      )}

      {/* Top Floating Badge: Dimensions & File Size */}
      <div className="absolute top-3 left-3 z-20 flex items-center space-x-2 pointer-events-none">
        {dimensions && (
          <span className="px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-[11px] font-mono text-zinc-300">
            {dimensions.width} × {dimensions.height} px
          </span>
        )}
        <span className="px-2.5 py-1 rounded-lg bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-[11px] font-mono text-zinc-400">
          {formatBytes(item.size)}
        </span>
      </div>

      {/* Bottom Floating Glassmorphism Toolbar */}
      <div
        id="image-viewer-toolbar"
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-zinc-950/90 backdrop-blur-md text-white px-3.5 py-2 rounded-2xl flex items-center space-x-2 sm:space-x-3 shadow-2xl border border-zinc-800 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.25, Math.round((z - 0.25) * 100) / 100))}
          className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Zoom Out (-25%)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="px-2 py-1 rounded-md bg-zinc-850 hover:bg-zinc-800 text-[11px] font-mono font-medium text-zinc-200 transition-colors cursor-pointer"
          title="Click to reset zoom to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(5, Math.round((z + 0.25) * 100) / 100))}
          className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Zoom In (+25%)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-zinc-800" />

        <button
          type="button"
          onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
          className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Rotate 90° Counter-Clockwise"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setRotation((r) => (r + 90) % 360)}
          className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Rotate 90° Clockwise"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            flipped ? 'text-blue-400 bg-blue-950/50' : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
          }`}
          title="Flip Horizontal"
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-zinc-800" />

        <button
          type="button"
          onClick={handleReset}
          className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          title="Fit to Screen & Reset View"
        >
          <ResetIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        <div className="w-px h-4 bg-zinc-800" />

        <button
          type="button"
          onClick={onDownload}
          className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white flex items-center space-x-1 font-medium transition-all shadow-md shadow-blue-600/30 cursor-pointer text-[11px]"
          title="Download full resolution image"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download</span>
        </button>
      </div>
    </div>
  );
};
