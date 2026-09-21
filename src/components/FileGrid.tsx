import React from 'react';
import {
  MoreVertical,
  Star,
  Download,
  Share2,
  Trash2,
  FolderInput,
  Edit2,
  Eye,
  Check,
  RotateCcw,
  Clock,
  FolderOpen,
  Upload,
  FileText,
} from 'lucide-react';
import { FileItem } from '../types';
import { formatBytes, formatDate } from '../lib/storage';
import { FileIcon } from './FileIcon';
import { ThumbnailPreview } from './ThumbnailPreview';

interface FileGridProps {
  items: FileItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string, shiftKey: boolean) => void;
  onOpenItem: (item: FileItem) => void;
  onDownload: (item: FileItem) => void;
  onShare: (item: FileItem) => void;
  onRename: (item: FileItem) => void;
  onMove: (item: FileItem) => void;
  onToggleStar: (item: FileItem) => void;
  onTrash: (item: FileItem) => void;
  onRestore?: (item: FileItem) => void;
  onPermanentDelete?: (item: FileItem) => void;
  isTrashView: boolean;
  onSelectFolder: (folderId: string) => void;
  folderChildrenCounts: Record<string, number>;
  onUploadToFolder?: (folderId: string) => void;
  onDropFilesOnFolder?: (files: FileList, folderId: string) => void;
  onUploadClick?: () => void;
  onNewTextFile?: () => void;
  currentFolderName?: string | null;
}

export const FileGrid: React.FC<FileGridProps> = ({
  items,
  selectedIds,
  onToggleSelect,
  onOpenItem,
  onDownload,
  onShare,
  onRename,
  onMove,
  onToggleStar,
  onTrash,
  onRestore,
  onPermanentDelete,
  isTrashView,
  onSelectFolder,
  folderChildrenCounts,
  onUploadToFolder,
  onDropFilesOnFolder,
  onUploadClick,
  onNewTextFile,
  currentFolderName,
}) => {
  const [activeMenuId, setActiveMenuId] = React.useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const folders = items.filter((i) => i.type === 'folder');
  const files = items.filter((i) => i.type !== 'folder');

  if (items.length === 0) {
    if (!isTrashView && currentFolderName) {
      return (
        <div className="py-16 px-4 text-center flex flex-col items-center justify-center max-w-md mx-auto animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-4 shadow-sm">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-white">
            Folder "{currentFolderName}" is empty
          </h3>
          <p className="text-xs text-zinc-400 mt-1.5 mb-6 leading-relaxed">
            Upload documents, images, or any data files directly into this folder. You can also drag and drop files anywhere on screen.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            {onUploadClick && (
              <button
                type="button"
                id="empty-folder-upload-btn"
                onClick={onUploadClick}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 stroke-[2.5]" />
                <span>Upload files to this folder</span>
              </button>
            )}
            {onNewTextFile && (
              <button
                type="button"
                id="empty-folder-note-btn"
                onClick={onNewTextFile}
                className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-medium transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Create note</span>
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="py-20 text-center flex flex-col items-center justify-center animate-in fade-in duration-150">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4">
          <FileIcon type="other" className="w-8 h-8" />
        </div>
        <h3 className="text-base font-semibold text-white">
          {isTrashView ? 'Trash is empty' : 'No items here'}
        </h3>
        <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-5">
          {isTrashView
            ? 'Items deleted will appear here before being permanently removed.'
            : 'Upload files by dragging and dropping them anywhere, or click below.'}
        </p>
        {!isTrashView && onUploadClick && (
          <button
            type="button"
            id="empty-root-upload-btn"
            onClick={onUploadClick}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-medium transition-all shadow-sm shadow-blue-600/30 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Upload files</span>
          </button>
        )}
      </div>
    );
  }

  const renderContextMenu = (item: FileItem) => {
    if (activeMenuId !== item.id) return null;

    return (
      <div
        ref={menuRef}
        className="absolute right-2 top-10 w-44 bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 py-1.5 z-40 text-xs animate-in fade-in zoom-in-95 duration-100 text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {!isTrashView ? (
          <>
            {item.type === 'folder' && onUploadToFolder && (
              <button
                type="button"
                id={`menu-upload-folder-${item.id}`}
                onClick={() => {
                  setActiveMenuId(null);
                  onUploadToFolder(item.id);
                }}
                className="w-full text-left px-3 py-2 text-white font-medium hover:bg-zinc-800 flex items-center space-x-2.5 cursor-pointer bg-blue-950/25"
              >
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Upload files here</span>
              </button>
            )}

            {item.type === 'folder' && (
              <button
                type="button"
                onClick={() => {
                  setActiveMenuId(null);
                  onSelectFolder(item.id);
                }}
                className="w-full text-left px-3 py-2 text-zinc-200 hover:bg-zinc-800 flex items-center space-x-2.5 cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                <span>Open folder</span>
              </button>
            )}

            {item.type !== 'folder' && (
              <button
                type="button"
                onClick={() => {
                  setActiveMenuId(null);
                  onOpenItem(item);
                }}
                className="w-full text-left px-3 py-2 text-zinc-200 hover:bg-zinc-800 flex items-center space-x-2.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>Preview</span>
              </button>
            )}

            {item.type !== 'folder' && (
              <button
                type="button"
                onClick={() => {
                  setActiveMenuId(null);
                  onDownload(item);
                }}
                className="w-full text-left px-3 py-2 text-zinc-200 hover:bg-zinc-800 flex items-center space-x-2.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                <span>Download</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setActiveMenuId(null);
                onShare(item);
              }}
              className="w-full text-left px-3 py-2 text-zinc-200 hover:bg-zinc-800 flex items-center space-x-2.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Share link</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMenuId(null);
                onToggleStar(item);
              }}
              className="w-full text-left px-3 py-2 text-zinc-200 hover:bg-zinc-800 flex items-center space-x-2.5 cursor-pointer"
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  item.starred ? 'text-amber-500 fill-amber-500' : 'text-zinc-400'
                }`}
              />
              <span>{item.starred ? 'Remove star' : 'Add to starred'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMenuId(null);
                onMove(item);
              }}
              className="w-full text-left px-3 py-2 text-zinc-200 hover:bg-zinc-800 flex items-center space-x-2.5 cursor-pointer"
            >
              <FolderInput className="w-3.5 h-3.5 text-zinc-400" />
              <span>Move to...</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveMenuId(null);
                onRename(item);
              }}
              className="w-full text-left px-3 py-2 text-zinc-200 hover:bg-zinc-800 flex items-center space-x-2.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Rename</span>
            </button>

            <div className="my-1 border-t border-zinc-800" />

            <button
              type="button"
              onClick={() => {
                setActiveMenuId(null);
                onTrash(item);
              }}
              className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center space-x-2.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Move to trash</span>
            </button>
          </>
        ) : (
          <>
            {onRestore && (
              <button
                type="button"
                onClick={() => {
                  setActiveMenuId(null);
                  onRestore(item);
                }}
                className="w-full text-left px-3 py-2 text-zinc-200 hover:bg-zinc-800 flex items-center space-x-2.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                <span>Restore</span>
              </button>
            )}

            {onPermanentDelete && (
              <button
                type="button"
                onClick={() => {
                  setActiveMenuId(null);
                  onPermanentDelete(item);
                }}
                className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center space-x-2.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Delete forever</span>
              </button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Folders Section */}
      {folders.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
            Folders
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {folders.map((folder) => {
              const isSelected = selectedIds.has(folder.id);
              const count = folderChildrenCounts[folder.id] || 0;

              const isDragOver = dragOverFolderId === folder.id;

              return (
                <div
                  key={folder.id}
                  id={`folder-card-${folder.id}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (dragOverFolderId !== folder.id) {
                      setDragOverFolderId(folder.id);
                    }
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                    setDragOverFolderId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverFolderId(null);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onDropFilesOnFolder) {
                      onDropFilesOnFolder(e.dataTransfer.files, folder.id);
                    }
                  }}
                  onClick={(e) => {
                    if (e.shiftKey) {
                      onToggleSelect(folder.id, true);
                    } else {
                      onSelectFolder(folder.id);
                    }
                  }}
                  className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between ${
                    isDragOver
                      ? 'bg-blue-950/70 border-blue-500 ring-2 ring-blue-500/80 shadow-lg scale-[1.02]'
                      : isSelected
                      ? 'bg-blue-950/40 border-blue-500/80 shadow-xs ring-1 ring-blue-500/40'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 hover:shadow-xs'
                  }`}
                >
                  {/* Left: Checkbox + Folder Icon + Info */}
                  <div className="flex items-center space-x-3 truncate">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(folder.id, e.shiftKey);
                      }}
                      className={`w-5 h-5 rounded flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'border border-zinc-700 opacity-0 group-hover:opacity-100 hover:border-blue-500'
                      }`}
                      aria-label="Select folder"
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <FileIcon type="folder" color={folder.color} className="w-6 h-6 shrink-0" />

                    <div className="truncate">
                      <div className="text-sm font-medium text-white truncate" title={folder.name}>
                        {folder.name}
                      </div>
                      {isDragOver ? (
                        <div className="text-[11px] font-semibold text-blue-300 animate-pulse flex items-center space-x-1">
                          <Upload className="w-3 h-3" />
                          <span>Drop files to upload here</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-[11px] text-zinc-400">
                          <span>{count} {count === 1 ? 'item' : 'items'}</span>
                          <span className="text-zinc-700">•</span>
                          <span className="text-[10px] text-zinc-500 truncate" title={`Created: ${formatDate(folder.createdAt)}`}>
                            {formatDate(folder.createdAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions menu */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(folder);
                      }}
                      className={`p-1.5 rounded-lg transition-opacity cursor-pointer ${
                        folder.starred
                          ? 'text-amber-500'
                          : 'text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-amber-400'
                      }`}
                      title={folder.starred ? 'Starred' : 'Add star'}
                    >
                      <Star
                        className={`w-4 h-4 ${folder.starred ? 'fill-amber-400' : ''}`}
                      />
                    </button>

                    {isTrashView ? (
                      <>
                        {onRestore && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRestore(folder);
                            }}
                            className="p-1.5 rounded-lg text-blue-400 opacity-0 group-hover:opacity-100 hover:bg-blue-950/60 transition-all cursor-pointer"
                            title="Restore folder to drive"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        {onPermanentDelete && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPermanentDelete(folder);
                            }}
                            className="p-1.5 rounded-lg text-rose-400 opacity-0 group-hover:opacity-100 hover:bg-rose-950/40 transition-all cursor-pointer"
                            title="Delete permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTrash(folder);
                        }}
                        className="p-1.5 rounded-lg text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer"
                        title="Move to trash"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === folder.id ? null : folder.id);
                      }}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {renderContextMenu(folder)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Files Section */}
      {files.length > 0 && (
        <div>
          {folders.length > 0 && (
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
              Files
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
            {files.map((file) => {
              const isSelected = selectedIds.has(file.id);

              return (
                <div
                  key={file.id}
                  id={`file-card-${file.id}`}
                  onClick={(e) => {
                    if (e.shiftKey) {
                      onToggleSelect(file.id, true);
                    } else {
                      onOpenItem(file);
                    }
                  }}
                  className={`group relative rounded-xl border transition-all cursor-pointer select-none flex flex-col overflow-hidden ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500/80 shadow-xs ring-1 ring-blue-500/40'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40 hover:shadow-sm'
                  }`}
                >
                  {/* Top Bar with Select & Star */}
                  <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(file.id, e.shiftKey);
                      }}
                      className={`pointer-events-auto w-5 h-5 rounded flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'border border-zinc-700 bg-zinc-900/90 opacity-0 group-hover:opacity-100 hover:border-blue-500'
                      }`}
                      aria-label="Select file"
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="flex items-center space-x-1 pointer-events-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStar(file);
                        }}
                        className={`p-1 rounded-md bg-zinc-900/90 backdrop-blur-xs transition-opacity cursor-pointer ${
                          file.starred
                            ? 'text-amber-500'
                            : 'text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-amber-500'
                        }`}
                        title={file.starred ? 'Starred' : 'Add star'}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${file.starred ? 'fill-amber-400' : ''}`}
                        />
                      </button>

                      {isTrashView ? (
                        <>
                          {onRestore && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRestore(file);
                              }}
                              className="p-1 rounded-md bg-zinc-900/90 backdrop-blur-xs text-blue-400 opacity-0 group-hover:opacity-100 hover:bg-blue-950/80 transition-all cursor-pointer"
                              title="Restore file to drive"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onPermanentDelete && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPermanentDelete(file);
                              }}
                              className="p-1 rounded-md bg-zinc-900/90 backdrop-blur-xs text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer"
                              title="Delete permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTrash(file);
                          }}
                          className="p-1 rounded-md bg-zinc-900/90 backdrop-blur-xs text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-rose-400 hover:bg-rose-950/40 transition-all cursor-pointer"
                          title="Move to trash"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === file.id ? null : file.id);
                        }}
                        className="p-1 rounded-md bg-zinc-900/90 backdrop-blur-xs text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail / Emblem Area */}
                  <div className="h-32 w-full bg-zinc-900/60 flex items-center justify-center p-0 relative overflow-hidden">
                    <ThumbnailPreview item={file} />
                  </div>

                  {/* File Metadata Footer */}
                  <div className="p-3 bg-zinc-950 border-t border-zinc-800/80">
                    <div className="flex items-center space-x-1.5">
                      <FileIcon type={file.type} className="w-3.5 h-3.5 shrink-0" />
                      <span
                        className="text-xs font-medium text-white truncate"
                        title={file.name}
                      >
                        {file.name}
                      </span>
                    </div>

                    <div className="mt-2 pt-2 border-t border-zinc-900/90 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span className="font-mono text-zinc-300 font-medium">{formatBytes(file.size)}</span>
                        <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500">
                          {file.type}
                        </span>
                      </div>

                      <div
                        className="flex items-center space-x-1.5 text-[10.5px] text-zinc-400 truncate"
                        title={`Uploaded: ${formatDate(file.createdAt)}`}
                      >
                        <Clock className="w-3 h-3 text-blue-400/80 shrink-0" />
                        <span className="truncate">
                          Uploaded <span className="text-zinc-200">{formatDate(file.createdAt)}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {renderContextMenu(file)}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
