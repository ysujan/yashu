import React from 'react';
import { Play, Music, FileText, Image as ImageIcon } from 'lucide-react';
import { FileItem } from '../types';
import { getFileBlob } from '../lib/storage';
import { FileIcon } from './FileIcon';

interface ThumbnailPreviewProps {
  item: FileItem;
  className?: string;
  showPlayOverlay?: boolean;
}

export const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({
  item,
  className = 'w-full h-full',
  showPlayOverlay = false,
}) => {
  const [imgUrl, setImgUrl] = React.useState<string | null>(
    item.previewUrl || item.dataUrl || null
  );
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    let isCancelled = false;
    let createdUrl: string | null = null;

    if (item.type === 'image' && !imgUrl) {
      getFileBlob(item.id, item)
        .then((blob) => {
          if (!isCancelled && blob) {
            createdUrl = URL.createObjectURL(blob);
            setImgUrl(createdUrl);
          }
        })
        .catch(() => {
          if (!isCancelled) setHasError(true);
        });
    }

    return () => {
      isCancelled = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [item.id, item.type, imgUrl, item]);

  // 1. SVG Vector Image with embedded textData
  if (item.type === 'image' && item.name.endsWith('.svg') && item.textData) {
    return (
      <div
        className={`flex items-center justify-center overflow-hidden pointer-events-none ${className}`}
        dangerouslySetInnerHTML={{ __html: item.textData }}
      />
    );
  }

  // 2. Standard Raster Image (JPG, PNG, WebP, GIF, etc.)
  if (item.type === 'image' && imgUrl && !hasError) {
    return (
      <div className={`relative overflow-hidden w-full h-full flex items-center justify-center ${className}`}>
        <img
          src={imgUrl}
          alt={item.name}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>
    );
  }

  // 3. Video File Card with Play icon
  if (item.type === 'video') {
    return (
      <div className={`relative w-full h-full bg-zinc-900/90 flex flex-col items-center justify-center group/video overflow-hidden ${className}`}>
        <div className="w-12 h-12 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover/video:scale-110 group-hover/video:bg-blue-500 transition-all duration-200">
          <Play className="w-5 h-5 fill-white ml-0.5" />
        </div>
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <span className="px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono text-zinc-300 font-medium">
            VIDEO
          </span>
          {item.size > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono text-zinc-400">
              {item.name.split('.').pop()?.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    );
  }

  // 4. Audio File Card with Soundwave Bars
  if (item.type === 'audio') {
    return (
      <div className={`relative w-full h-full bg-zinc-900/90 flex flex-col items-center justify-center overflow-hidden ${className}`}>
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-2 shadow-sm">
          <Music className="w-6 h-6" />
        </div>
        {/* Animated equalizer waves */}
        <div className="flex items-end space-x-1 h-4">
          <div className="w-1 bg-amber-500/60 rounded-full h-2 animate-pulse" />
          <div className="w-1 bg-amber-500/80 rounded-full h-4 animate-pulse [animation-delay:150ms]" />
          <div className="w-1 bg-amber-400 rounded-full h-3 animate-pulse [animation-delay:300ms]" />
          <div className="w-1 bg-amber-500/80 rounded-full h-4 animate-pulse [animation-delay:450ms]" />
          <div className="w-1 bg-amber-500/60 rounded-full h-2 animate-pulse [animation-delay:200ms]" />
        </div>
        <div className="absolute bottom-2 left-2 pointer-events-none">
          <span className="px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono text-amber-300 font-medium">
            AUDIO
          </span>
        </div>
      </div>
    );
  }

  // 5. Default File Icon Fallback
  return (
    <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-xs">
      <FileIcon type={item.type} className="w-8 h-8" />
    </div>
  );
};
