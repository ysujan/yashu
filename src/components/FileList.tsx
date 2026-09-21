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
  ArrowUp,
  ArrowDown,
  Clock,
  FolderOpen,
  Upload,
  FileText,
} from 'lucide-react';
import { FileItem, SortOption, SortField } from '../types';
import { formatBytes, formatDate } from '../lib/storage';
import { FileIcon } from './FileIcon';

interface FileListProps {
  items: FileItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string, shiftKey: boolean) => void;
  onSelectAll: () => void;
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
  sortOption: SortOption;
  onSortChange: (field: SortField) => void;
  onUploadToFolder?: (folderId: string) => void;
  onDropFilesOnFolder?: (files: FileList, folderId: string) => void;
  onUploadClick?: () => void;
  onNewTextFile?: () => void;
  currentFolderName?: string | null;
}

export const FileList: React.FC<FileListProps> = ({
  items,
  selectedIds,
  onToggleSelect,
  onSelectAll,
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
  sortOption,
  onSortChange,
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

  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));

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
                id="empty-folder-upload-btn-list"
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
                id="empty-folder-note-btn-list"
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
            id="empty-root-upload-btn-list"
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

  const renderSortIndicator = (field: SortField) => {
    if (sortOption.field !== field) return null;
    return sortOption.order === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 ml-1 text-blue-500 inline" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 ml-1 text-blue-500 inline" />
    );
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/70 text-zinc-400 font-semibold select-none">
              <th className="w-10 px-4 py-3">
                <button
                  type="button"
                  onClick={onSelectAll}
                  className={`w-4 h-4 rounded flex items-center justify-center transition-all cursor-pointer ${
                    allSelected
                      ? 'bg-blue-600 text-white'
                      : 'border border-zinc-700 hover:border-blue-500'
                  }`}
                  aria-label="Select all"
                >
                  {allSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
              </th>
              <th className="w-10 px-1 py-3" />
              <th
                onClick={() => onSortChange('name')}
                className="px-4 py-3 cursor-pointer hover:text-white transition-colors"
              >
                <span>Name</span>
                {renderSortIndicator('name')}
              </th>
              <th
                onClick={() => onSortChange('type')}
                className="hidden md:table-cell px-4 py-3 cursor-pointer hover:text-white transition-colors"
              >
                <span>Kind</span>
                {renderSortIndicator('type')}
              </th>
              <th
                onClick={() => onSortChange('size')}
                className="hidden sm:table-cell px-4 py-3 cursor-pointer hover:text-white transition-colors text-right sm:text-left"
              >
                <span>Size</span>
                {renderSortIndicator('size')}
              </th>
              <th
                onClick={() => onSortChange('createdAt')}
                className="hidden md:table-cell px-4 py-3 cursor-pointer hover:text-white transition-colors"
              >
                <span>Uploaded</span>
                {renderSortIndicator('createdAt')}
              </th>
              <th
                onClick={() => onSortChange('updatedAt')}
                className="hidden xl:table-cell px-4 py-3 cursor-pointer hover:text-white transition-colors"
              >
                <span>Modified</span>
                {renderSortIndicator('updatedAt')}
              </th>
              <th className="w-24 px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850">
            {items.map((item) => {
              const isSelected = selectedIds.has(item.id);
              const isFolder = item.type === 'folder';
              const folderCount = folderChildrenCounts[item.id] || 0;
              const isDragOver = isFolder && dragOverFolderId === item.id;

              return (
                <tr
                  key={item.id}
                  id={`list-row-${item.id}`}
                  onDragOver={(e) => {
                    if (isFolder) {
                      e.preventDefault();
                      e.stopPropagation();
                      if (dragOverFolderId !== item.id) {
                        setDragOverFolderId(item.id);
                      }
                    }
                  }}
                  onDragLeave={(e) => {
                    if (isFolder) {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                      setDragOverFolderId(null);
                    }
                  }}
                  onDrop={(e) => {
                    if (isFolder) {
                      e.preventDefault();
                      e.stopPropagation();
                      setDragOverFolderId(null);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && onDropFilesOnFolder) {
                        onDropFilesOnFolder(e.dataTransfer.files, item.id);
                      }
                    }
                  }}
                  onClick={(e) => {
                    if (e.shiftKey) {
                      onToggleSelect(item.id, true);
                    } else if (isFolder) {
                      onSelectFolder(item.id);
                    } else {
                      onOpenItem(item);
                    }
                  }}
                  className={`group cursor-pointer select-none transition-colors ${
                    isDragOver
                      ? 'bg-blue-950/70 text-white ring-2 ring-blue-500'
                      : isSelected
                      ? 'bg-blue-950/40 text-white'
                      : 'hover:bg-zinc-900/50 text-zinc-300'
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSelect(item.id, e.shiftKey);
                      }}
                      className={`w-4 h-4 rounded flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'border border-zinc-700 opacity-0 group-hover:opacity-100 hover:border-blue-500'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>
                  </td>

                  {/* Star Toggle */}
                  <td className="px-1 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onToggleStar(item)}
                      className={`p-1 rounded-md transition-opacity cursor-pointer ${
                        item.starred
                          ? 'text-amber-500'
                          : 'text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-amber-500'
                      }`}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${item.starred ? 'fill-amber-400' : ''}`}
                      />
                    </button>
                  </td>

                  {/* Name + Icon */}
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <FileIcon
                        type={item.type}
                        color={item.color}
                        className="w-5 h-5 shrink-0"
                      />
                      <div className="truncate max-w-xs md:max-w-md">
                        <span className="font-medium text-white truncate block">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 md:hidden flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          <span>Uploaded {formatDate(item.createdAt)}</span>
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Kind */}
                  <td className="hidden md:table-cell px-4 py-3 text-zinc-400 capitalize">
                    {isFolder ? 'Folder' : item.type}
                  </td>

                  {/* Size */}
                  <td className="hidden sm:table-cell px-4 py-3 text-zinc-400 font-mono">
                    {isFolder
                      ? `${folderCount} ${folderCount === 1 ? 'item' : 'items'}`
                      : formatBytes(item.size)}
                  </td>

                  {/* Date Uploaded */}
                  <td className="hidden md:table-cell px-4 py-3 text-zinc-300 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </td>

                  {/* Date Modified */}
                  <td className="hidden xl:table-cell px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                    {formatDate(item.updatedAt)}
                  </td>

                  {/* Actions */}
                  <td
                    className="px-4 py-3 text-right whitespace-nowrap relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      {!isTrashView ? (
                        <>
                          {!isFolder && (
                            <button
                              type="button"
                              onClick={() => onDownload(item)}
                              title="Download"
                              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onShare(item)}
                            title="Share"
                            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onTrash(item)}
                            title="Move to trash"
                            className="p-1 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          {onRestore && (
                            <button
                              type="button"
                              onClick={() => onRestore(item)}
                              title="Restore"
                              className="p-1 rounded-md text-zinc-400 hover:text-blue-400 hover:bg-blue-950/40 transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          {onPermanentDelete && (
                            <button
                              type="button"
                              onClick={() => onPermanentDelete(item)}
                              title="Delete permanently"
                              className="p-1 rounded-md text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuId(activeMenuId === item.id ? null : item.id)
                        }
                        className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Context Menu Dropdown */}
                    {activeMenuId === item.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-4 top-10 w-44 bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 py-1.5 z-40 text-xs text-left animate-in fade-in zoom-in-95 duration-100 text-zinc-200"
                      >
                        {!isTrashView ? (
                          <>
                            {isFolder && onUploadToFolder && (
                              <button
                                type="button"
                                id={`list-menu-upload-folder-${item.id}`}
                                onClick={() => {
                                   setActiveMenuId(null);
                                   onUploadToFolder(item.id);
                                }}
                                className="w-full px-3 py-2 text-white font-medium hover:bg-zinc-800 flex items-center space-x-2.5 cursor-pointer bg-blue-950/25"
                              >
                                <Upload className="w-3.5 h-3.5 text-blue-400" />
                                <span>Upload files here</span>
                              </button>
                            )}

                            {isFolder && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onSelectFolder(item.id);
                                }}
                                className="w-full px-3 py-2 text-zinc-200 hover:bg-zinc-800 flex items-center space-x-2.5 cursor-pointer"
                              >
                                <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                                <span>Open folder</span>
                              </button>
                            )}

                            {!isFolder && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onOpenItem(item);
                                }}
                                className="w-full px-3 py-2 text-zinc-200 hover:bg-zinc-800 flex items-center space-x-2.5 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-400" />
                                <span>Preview</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onMove(item);
                              }}
                              className="w-full px-3 py-2 text-zinc-200 hover:bg-zinc-800 flex items-center space-x-2.5 cursor-pointer"
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
                              className="w-full px-3 py-2 text-zinc-200 hover:bg-zinc-800 flex items-center space-x-2.5 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Rename</span>
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
                                className="w-full text-left px-3 py-2 text-blue-400 hover:bg-blue-950/40 flex items-center space-x-2.5 cursor-pointer font-medium"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                                <span>Restore to Drive</span>
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
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
