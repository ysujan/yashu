import React from 'react';
import { ChevronRight, HardDrive, Folder, Clock, Star, Trash2, Share2, Tag, Upload } from 'lucide-react';
import { ActiveView, BreadcrumbItem, CategoryFilter } from '../types';

interface BreadcrumbsProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigate: (folderId: string | null) => void;
  activeView: ActiveView;
  categoryFilter: CategoryFilter;
  itemCount: number;
  onUploadClick?: () => void;
  currentFolderId?: string | null;
  currentFolderName?: string | null;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  breadcrumbs,
  onNavigate,
  activeView,
  categoryFilter,
  itemCount,
  onUploadClick,
  currentFolderId,
  currentFolderName,
}) => {
  const getViewTitle = () => {
    if (activeView === 'recent') {
      return { icon: Clock, label: 'Recent Files' };
    }
    if (activeView === 'starred') {
      return { icon: Star, label: 'Starred Items' };
    }
    if (activeView === 'shared') {
      return { icon: Share2, label: 'Shared Links' };
    }
    if (activeView === 'trash') {
      return { icon: Trash2, label: 'Trash Bin' };
    }
    if (activeView === 'category') {
      const categoryNames: Record<CategoryFilter, string> = {
        all: 'All Files',
        image: 'Images & Photos',
        document: 'Documents & Spreadsheets',
        video: 'Videos',
        audio: 'Audio Tracks',
        archive: 'Compressed Archives',
        code: 'Code & Data Files',
      };
      return { icon: Tag, label: categoryNames[categoryFilter] || 'Files' };
    }
    return { icon: HardDrive, label: 'My Drive' };
  };

  const viewInfo = getViewTitle();
  const Icon = viewInfo.icon;

  if (activeView !== 'my-drive') {
    return (
      <div className="flex items-center justify-between py-3 mb-2">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-900/60 flex items-center justify-center text-blue-400">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight">
              {viewInfo.label}
            </h1>
          </div>
        </div>
        <span className="text-xs font-medium text-zinc-400">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-3 mb-2 overflow-x-auto scrollbar-none">
      <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-sm font-medium">
        <button
          type="button"
          onClick={() => onNavigate(null)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
            breadcrumbs.length === 0
              ? 'text-white font-semibold bg-zinc-900 border border-zinc-800 shadow-xs'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-900/70'
          }`}
        >
          <HardDrive className="w-4 h-4 text-blue-500" />
          <span>My Drive</span>
        </button>

        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={crumb.id || idx}>
              <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" />
              <button
                type="button"
                onClick={() => onNavigate(crumb.id)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition-colors truncate max-w-[180px] cursor-pointer ${
                  isLast
                    ? 'text-white font-semibold bg-zinc-900 border border-zinc-800 shadow-xs'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/70'
                }`}
                title={crumb.name}
              >
                <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">{crumb.name}</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      <div className="flex items-center space-x-3 pl-4 shrink-0">
        {currentFolderId && onUploadClick && (
          <button
            type="button"
            id="breadcrumb-upload-btn"
            onClick={onUploadClick}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-medium transition-all shadow-xs shadow-blue-600/25 cursor-pointer whitespace-nowrap"
            title={`Upload files directly into "${currentFolderName || 'this folder'}"`}
          >
            <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Upload here</span>
          </button>
        )}
        <span className="text-xs font-medium text-zinc-400 whitespace-nowrap">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
      </div>
    </div>
  );
};
