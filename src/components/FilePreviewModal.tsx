import React from 'react';
import {
  X,
  Download,
  Share2,
  Star,
  Trash2,
  Copy,
  Check,
  Edit3,
  Save,
  FileText,
  ExternalLink,
  Loader2,
  Clock,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { FileItem } from '../types';
import {
  formatBytes,
  formatDate,
  getFileBlob,
  triggerDownload,
  updateTextFileContent,
} from '../lib/storage';
import { FileIcon } from './FileIcon';
import { ImageViewer } from './ImageViewer';
import { VideoPlayer } from './VideoPlayer';
import { AudioPlayer } from './AudioPlayer';

interface FilePreviewModalProps {
  item: FileItem | null;
  onClose: () => void;
  onShare: (item: FileItem) => void;
  onToggleStar: (item: FileItem) => void;
  onItemUpdated: (updated: FileItem) => void;
  onDownload?: (item: FileItem) => void;
  onDelete?: (item: FileItem) => void;
  onRestore?: (item: FileItem) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  item,
  onClose,
  onShare,
  onToggleStar,
  onItemUpdated,
  onDownload,
  onDelete,
  onRestore,
}) => {
  const [blobUrl, setBlobUrl] = React.useState<string | null>(null);
  const [isLoadingBlob, setIsLoadingBlob] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // In-browser text editing
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedText, setEditedText] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);

  const handleDownload = () => {
    if (!item) return;
    if (onDownload) {
      onDownload(item);
    } else {
      triggerDownload(item).catch((err) => console.error('Download failed', err));
    }
  };

  React.useEffect(() => {
    let currentUrl: string | null = null;
    let isCancelled = false;

    async function loadBlob() {
      if (!item) return;

      setIsEditing(false);
      setEditedText(item.textData || '');
      setIsLoadingBlob(true);
      setBlobUrl(null);

      // If item has previewUrl or dataUrl, set immediately for instant preview
      if (item.previewUrl && item.previewUrl.startsWith('data:')) {
        setBlobUrl(item.previewUrl);
      } else if (item.dataUrl) {
        setBlobUrl(item.dataUrl);
      }

      try {
        const blob = await getFileBlob(item.id, item);
        if (!isCancelled && blob) {
          currentUrl = URL.createObjectURL(blob);
          setBlobUrl(currentUrl);
        }
      } catch (err) {
        console.error('Failed to load blob for preview', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingBlob(false);
        }
      }
    }

    loadBlob();

    return () => {
      isCancelled = true;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [item]);

  // Handle escape key to close modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!item) return null;

  const handleCopyText = async () => {
    const textToCopy = isEditing ? editedText : item.textData || '';
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleSaveText = async () => {
    setIsSaving(true);
    try {
      const updated = await updateTextFileContent(item.id, editedText);
      onItemUpdated(updated);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save text changes', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Parse CSV if spreadsheet
  const renderCsvTable = () => {
    const raw = item.textData || editedText;
    if (!raw) return null;

    const rows = raw.trim().split('\n').map((row) => row.split(','));
    if (rows.length === 0) return null;

    const headers = rows[0];
    const bodyRows = rows.slice(1);

    return (
      <div className="overflow-x-auto border border-zinc-800 rounded-lg">
        <table className="w-full text-xs text-left">
          <thead className="bg-zinc-900 text-zinc-200 font-semibold border-b border-zinc-800">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-3.5 py-2.5 whitespace-nowrap">
                  {h.trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 font-mono">
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-zinc-900/50">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-2 whitespace-nowrap text-zinc-300">
                    {cell.trim()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div
      id="file-preview-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="file-preview-modal-card"
        className="w-full max-w-5xl h-[88vh] bg-zinc-950 rounded-3xl shadow-2xl border border-zinc-800 flex flex-col overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="h-16 px-4 sm:px-6 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-900/80 shrink-0">
          <div className="flex items-center space-x-3 truncate">
            <div className="w-9 h-9 rounded-xl bg-zinc-850 border border-zinc-750 flex items-center justify-center shrink-0">
              <FileIcon type={item.type} className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-semibold text-white truncate max-w-md" title={item.name}>
                  {item.name}
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-300 uppercase">
                  {item.type}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-400 mt-0.5">
                <span className="font-mono text-zinc-300 font-medium">{formatBytes(item.size)}</span>
                <span className="text-zinc-600">•</span>
                <span className="flex items-center space-x-1 text-zinc-300">
                  <Clock className="w-3 h-3 text-blue-400 shrink-0" />
                  <span>Uploaded <strong className="font-medium text-white">{formatDate(item.createdAt)}</strong></span>
                </span>
                {item.updatedAt !== item.createdAt && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <span className="text-zinc-400">Modified {formatDate(item.updatedAt)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onToggleStar(item)}
              title={item.starred ? 'Starred' : 'Add star'}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                item.starred
                  ? 'text-amber-400 bg-amber-950/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Star className={`w-4 h-4 ${item.starred ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => onShare(item)}
              title="Share file"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Restore from trash button if in trash */}
            {item.inTrash && onRestore && (
              <button
                type="button"
                onClick={() => {
                  onRestore(item);
                  onClose();
                }}
                title="Restore this file back to your drive"
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold transition-all shadow-md shadow-blue-600/30 cursor-pointer flex items-center space-x-1.5 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore to Drive</span>
              </button>
            )}

            {/* Direct Download button */}
            <button
              type="button"
              onClick={handleDownload}
              title={`Download "${item.name}"`}
              className="px-3 py-1.5 rounded-xl bg-zinc-850 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 transition-colors cursor-pointer flex items-center space-x-1.5 text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Delete button */}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(item)}
                title={`Delete "${item.name}"`}
                className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <div className="w-px h-5 bg-zinc-800 mx-1" />

            <button
              id="btn-close-preview"
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close Preview (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Trash Status Banner inside Modal if Trashed */}
        {item.inTrash && (
          <div className="w-full bg-red-950/70 border-b border-red-900/60 px-4 py-2.5 flex items-center justify-between text-xs text-red-200 shrink-0">
            <div className="flex items-center space-x-2">
              <RotateCcw className="w-4 h-4 text-red-300 shrink-0" />
              <span>This file is currently in the trash bin.</span>
            </div>
            {onRestore && (
              <button
                type="button"
                onClick={() => {
                  onRestore(item);
                  onClose();
                }}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recover File</span>
              </button>
            )}
          </div>
        )}

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 flex flex-col items-center justify-center bg-black/60 relative">
          {/* 1. Image Preview with Zoom, Pan, Rotate, Flip & Fullscreen */}
          {item.type === 'image' && (
            <ImageViewer
              item={item}
              blobUrl={blobUrl}
              isLoading={isLoadingBlob}
              onDownload={handleDownload}
            />
          )}

          {/* 2. Video Player with High-Performance Streaming, Scrubber, Volume & Speed */}
          {item.type === 'video' && (
            <VideoPlayer
              item={item}
              blobUrl={blobUrl}
              isLoading={isLoadingBlob}
              onDownload={handleDownload}
            />
          )}

          {/* 3. Audio Player with Animated Equalizer Waveform, Loops & Speeds */}
          {item.type === 'audio' && (
            <AudioPlayer
              item={item}
              blobUrl={blobUrl}
              isLoading={isLoadingBlob}
              onDownload={handleDownload}
            />
          )}

          {/* 4. PDF Direct Document Preview */}
          {item.type === 'pdf' && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 p-2">
              {blobUrl ? (
                <iframe
                  src={blobUrl}
                  title={item.name}
                  className="w-full h-full rounded-xl bg-zinc-900 border-0"
                />
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3 text-zinc-400">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-xs font-mono">Loading PDF document...</p>
                </div>
              )}
            </div>
          )}

          {/* 5. Spreadsheet Preview (CSV) */}
          {item.type === 'spreadsheet' && item.textData && (
            <div className="w-full h-full flex flex-col bg-zinc-950 rounded-2xl p-4 sm:p-6 shadow-xs border border-zinc-800">
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-800">
                <span className="text-xs font-semibold text-zinc-300">
                  Data Table View
                </span>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy CSV'}</span>
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                {renderCsvTable()}
              </div>
            </div>
          )}

          {/* 6. Text / Markdown / Code / Document Preview & Live Editor */}
          {(item.type === 'document' ||
            item.type === 'code' ||
            (item.type !== 'image' &&
              item.type !== 'video' &&
              item.type !== 'audio' &&
              item.type !== 'pdf' &&
              item.type !== 'spreadsheet' &&
              item.textData)) && (
            <div className="w-full h-full flex flex-col bg-zinc-950 rounded-2xl shadow-xs border border-zinc-800 overflow-hidden">
              {/* Toolbar */}
              <div className="h-11 px-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs">
                <span className="font-mono text-zinc-400">
                  {item.mimeType || 'text/plain'}
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center space-x-1.5 hover:bg-zinc-700 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  {isEditing ? (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleSaveText}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium flex items-center space-x-1.5 cursor-pointer shadow-md shadow-blue-600/25"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaving ? 'Saving...' : 'Save'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 flex items-center space-x-1.5 hover:bg-zinc-700 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Editor / Viewer Body */}
              <div className="flex-1 overflow-auto p-4 sm:p-6">
                {isEditing ? (
                  <textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="w-full h-full font-mono text-xs sm:text-sm bg-transparent border-0 focus:outline-hidden resize-none text-zinc-200 leading-relaxed"
                    placeholder="Write note or code content..."
                  />
                ) : (
                  <pre className="font-mono text-xs sm:text-sm whitespace-pre-wrap text-zinc-200 leading-relaxed select-text">
                    {item.textData || '(No textual content preview available)'}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* 7. Generic Binary / Archive / Unpreviewable File Fallback */}
          {item.type !== 'image' &&
            item.type !== 'video' &&
            item.type !== 'audio' &&
            item.type !== 'pdf' &&
            item.type !== 'spreadsheet' &&
            !item.textData && (
              <div className="text-center p-8 bg-zinc-950 rounded-3xl shadow-xl border border-zinc-800 max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4 text-zinc-400">
                  <FileIcon type={item.type} className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-white mb-1 truncate">{item.name}</h3>
                <p className="text-xs text-zinc-400 mb-6 space-y-1">
                  <span className="block font-mono text-zinc-300">{formatBytes(item.size)} • {item.mimeType}</span>
                  <span className="block text-[11px] text-zinc-400">Uploaded {formatDate(item.createdAt)}</span>
                </p>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-medium inline-flex items-center space-x-2 transition-all shadow-md shadow-blue-600/25 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File ({formatBytes(item.size)})</span>
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
