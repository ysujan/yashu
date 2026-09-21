import React from 'react';
import {
  X,
  Download,
  Share2,
  Trash2,
  Edit2,
  Star,
  HardDrive,
  Calendar,
  FileCode,
  Globe,
  Lock,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { FileItem } from '../types';
import { formatBytes, formatDate } from '../lib/storage';
import { FileIcon } from './FileIcon';
import { ThumbnailPreview } from './ThumbnailPreview';

interface FileDetailsSidebarProps {
  item: FileItem | null;
  onClose: () => void;
  onDownload: (item: FileItem) => void;
  onShare: (item: FileItem) => void;
  onRename: (item: FileItem) => void;
  onToggleStar: (item: FileItem) => void;
  onTrash: (item: FileItem) => void;
  onRestore?: (item: FileItem) => void;
  onPermanentDelete?: (item: FileItem) => void;
  currentFolderName?: string;
}

export const FileDetailsSidebar: React.FC<FileDetailsSidebarProps> = ({
  item,
  onClose,
  onDownload,
  onShare,
  onRename,
  onToggleStar,
  onTrash,
  onRestore,
  onPermanentDelete,
  currentFolderName = 'My Drive',
}) => {
  return (
    <aside
      id="file-details-inspector"
      className="w-80 bg-zinc-950 border-l border-zinc-800 flex flex-col h-full overflow-y-auto shrink-0 animate-in slide-in-from-right duration-200 text-zinc-200"
    >
      {/* Header */}
      <div className="h-16 px-5 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Details & Info</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {item ? (
        <div className="p-5 space-y-6 flex-1 text-xs">
          {/* Preview Box */}
          <div className="h-40 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center p-0 overflow-hidden relative shadow-inner">
            <ThumbnailPreview item={item} />
          </div>

          {/* Title & Type */}
          <div>
            <h4
              className="text-sm font-semibold text-white truncate"
              title={item.name}
            >
              {item.name}
            </h4>
            <p className="text-zinc-400 capitalize mt-0.5">
              {item.type === 'folder' ? 'Folder' : `${item.type} file`}
            </p>
          </div>

          {/* Action Buttons */}
          {item.inTrash ? (
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-900/40 text-xs text-red-300 flex items-center space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <span>This item is currently in the trash bin.</span>
              </div>
              <div className="flex items-center space-x-2">
                {onRestore && (
                  <button
                    id="sidebar-restore-item-btn"
                    type="button"
                    onClick={() => onRestore(item)}
                    className="flex-1 h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-600/30 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restore to Drive</span>
                  </button>
                )}
                {onPermanentDelete && (
                  <button
                    id="sidebar-permanent-delete-btn"
                    type="button"
                    onClick={() => onPermanentDelete(item)}
                    className="p-2 rounded-lg border border-rose-900/60 bg-rose-950/30 text-rose-400 hover:bg-rose-950/60 hover:text-rose-300 transition-colors cursor-pointer"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              {item.type !== 'folder' && (
                <button
                  type="button"
                  onClick={() => onDownload(item)}
                  className="flex-1 h-9 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium flex items-center justify-center space-x-1.5 transition-colors shadow-md shadow-blue-600/25 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onShare(item)}
                className="p-2 rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onToggleStar(item)}
                className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                  item.starred
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-400'
                    : 'border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white'
                }`}
                title="Star"
              >
                <Star className={`w-4 h-4 ${item.starred ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => onRename(item)}
                className="p-2 rounded-lg border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                title="Rename"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onTrash(item)}
                className="p-2 rounded-lg border border-zinc-800 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors cursor-pointer"
                title="Delete (Move to trash)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Properties List */}
          <div className="space-y-3 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Size</span>
              <span className="font-mono text-zinc-200 font-medium">
                {item.type === 'folder' ? '--' : formatBytes(item.size)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Type</span>
              <span className="font-mono text-zinc-200 truncate max-w-[150px]">
                {item.mimeType || 'unknown'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Location</span>
              <span className="text-zinc-200 truncate max-w-[150px]">
                {currentFolderName}
              </span>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-zinc-400 flex items-center space-x-1.5 pt-0.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>Uploaded</span>
              </span>
              <div className="text-right">
                <span className="text-zinc-200 block font-medium">
                  {formatDate(item.createdAt)}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                  {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-zinc-400 flex items-center space-x-1.5 pt-0.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>Modified</span>
              </span>
              <div className="text-right">
                <span className="text-zinc-200 block font-medium">
                  {formatDate(item.updatedAt)}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
                  {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>

            {item.shareSettings?.isShared && (
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-blue-400">
                <span className="flex items-center space-x-1">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Public Link Active</span>
                </span>
                {item.shareSettings.passwordProtected && (
                  <span title="Password protected">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center flex flex-col items-center justify-center flex-1">
          <HardDrive className="w-10 h-10 text-zinc-600 mb-3" />
          <p className="text-xs text-zinc-400">
            Select a file or folder to view its properties and detailed metadata.
          </p>
        </div>
      )}
    </aside>
  );
};
