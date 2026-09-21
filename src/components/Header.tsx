import React from 'react';
import {
  Search,
  X,
  LayoutGrid,
  List,
  ArrowUpDown,
  Info,
  Menu,
  Download,
  Trash2,
  Star,
  FolderInput,
  CheckSquare,
  LogOut,
  User,
  Upload,
  RotateCcw,
} from 'lucide-react';
import { ViewMode, SortOption, SortField } from '../types';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  sortOption: SortOption;
  setSortOption: (option: SortOption) => void;
  showDetailsPane: boolean;
  setShowDetailsPane: (show: boolean) => void;
  onOpenMobileMenu: () => void;
  selectedCount: number;
  onBatchDownload: () => void;
  onBatchStar: () => void;
  onBatchTrash: () => void;
  onBatchMove: () => void;
  onClearSelection: () => void;
  totalFilteredCount: number;
  currentUser?: string | null;
  onLogout?: () => void;
  onUploadClick?: () => void;
  currentFolderName?: string | null;
  isTrashView?: boolean;
  onBatchRestore?: () => void;
  onBatchPermanentDelete?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  sortOption,
  setSortOption,
  showDetailsPane,
  setShowDetailsPane,
  onOpenMobileMenu,
  selectedCount,
  onBatchDownload,
  onBatchStar,
  onBatchTrash,
  onBatchMove,
  onClearSelection,
  totalFilteredCount,
  currentUser,
  onLogout,
  onUploadClick,
  currentFolderName,
  isTrashView,
  onBatchRestore,
  onBatchPermanentDelete,
}) => {
  const [showSortMenu, setShowSortMenu] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const sortMenuRef = React.useRef<HTMLDivElement>(null);
  const userMenuRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Global hotkey '/' to focus search
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortLabels: Record<string, string> = {
    'createdAt-desc': 'Uploaded (Newest first)',
    'createdAt-asc': 'Uploaded (Oldest first)',
    'name-asc': 'Name (A to Z)',
    'name-desc': 'Name (Z to A)',
    'updatedAt-desc': 'Modified (Newest first)',
    'updatedAt-asc': 'Modified (Oldest first)',
    'size-desc': 'Size (Largest first)',
    'size-asc': 'Size (Smallest first)',
  };

  const currentSortKey = `${sortOption.field}-${sortOption.order}`;

  return (
    <header
      id="app-header"
      className="h-16 bg-zinc-950 border-b border-zinc-800 px-4 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-30 text-zinc-100"
    >
      {/* Left: Mobile hamburger & Search bar */}
      <div className="flex items-center space-x-3 flex-1 max-w-2xl">
        <button
          id="btn-mobile-menu"
          type="button"
          onClick={onOpenMobileMenu}
          className="p-2 -ml-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-850 lg:hidden cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="search-files-input"
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in FreeCloud files, folders, or notes... (Press '/' to focus)"
            className="w-full h-10 pl-10 pr-10 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/60 transition-all"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block absolute right-3 top-2.5 px-1.5 py-0.5 text-[10px] font-mono text-zinc-500 bg-zinc-800 border border-zinc-700 rounded">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Center/Right: Multi-Select Batch Bar (shows conditionally) or Standard Controls */}
      {selectedCount > 0 ? (
        <div className="flex items-center space-x-2 bg-blue-950/70 border border-blue-800/80 px-3 py-1.5 rounded-xl animate-in fade-in duration-150">
          <span className="text-xs font-semibold text-blue-200 flex items-center space-x-1.5">
            <CheckSquare className="w-4 h-4 text-blue-400" />
            <span>{selectedCount} selected</span>
          </span>

          <div className="h-4 w-px bg-blue-800/80 mx-1" />

          {isTrashView ? (
            <>
              {onBatchRestore && (
                <button
                  id="batch-restore-btn"
                  type="button"
                  onClick={onBatchRestore}
                  title="Restore selected back to drive"
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Selected</span>
                </button>
              )}

              {onBatchPermanentDelete && (
                <button
                  id="batch-permanent-delete-btn"
                  type="button"
                  onClick={onBatchPermanentDelete}
                  title="Permanently delete selected forever"
                  className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/60 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <>
              <button
                id="batch-download-btn"
                type="button"
                onClick={onBatchDownload}
                title="Download selected"
                className="p-1.5 rounded-lg text-zinc-200 hover:bg-blue-900/50 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                id="batch-star-btn"
                type="button"
                onClick={onBatchStar}
                title="Star/Unstar selected"
                className="p-1.5 rounded-lg text-zinc-200 hover:bg-blue-900/50 transition-colors cursor-pointer"
              >
                <Star className="w-4 h-4" />
              </button>

              <button
                id="batch-move-btn"
                type="button"
                onClick={onBatchMove}
                title="Move selected"
                className="p-1.5 rounded-lg text-zinc-200 hover:bg-blue-900/50 transition-colors cursor-pointer"
              >
                <FolderInput className="w-4 h-4" />
              </button>

              <button
                id="batch-trash-btn"
                type="button"
                onClick={onBatchTrash}
                title="Move to trash"
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/60 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            id="batch-clear-btn"
            type="button"
            onClick={onClearSelection}
            title="Deselect all"
            className="p-1.5 rounded-lg text-zinc-400 hover:bg-blue-900/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          {/* Quick Upload Button */}
          {onUploadClick && (
            <button
              id="header-upload-btn"
              type="button"
              onClick={onUploadClick}
              className="h-9 px-3 sm:px-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm shadow-blue-600/30 cursor-pointer whitespace-nowrap"
              title={currentFolderName ? `Upload data into folder "${currentFolderName}"` : 'Upload data to My Drive'}
            >
              <Upload className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">
                {currentFolderName ? `Upload to ${currentFolderName}` : 'Upload'}
              </span>
              <span className="sm:hidden">Upload</span>
            </button>
          )}

          {/* Sort Selector Dropdown */}
          <div className="relative" ref={sortMenuRef}>
            <button
              id="btn-sort-menu"
              type="button"
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="h-9 px-3 rounded-lg border border-zinc-800 text-xs font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">{sortLabels[currentSortKey] || 'Sort'}</span>
            </button>

            {showSortMenu && (
              <div className="absolute right-0 mt-1 w-52 bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 font-semibold text-zinc-500 uppercase tracking-wider text-[10px]">
                  Sort By
                </div>
                {[
                  { field: 'createdAt', order: 'desc', label: 'Uploaded (Newest first)' },
                  { field: 'createdAt', order: 'asc', label: 'Uploaded (Oldest first)' },
                  { field: 'name', order: 'asc', label: 'Name (A to Z)' },
                  { field: 'name', order: 'desc', label: 'Name (Z to A)' },
                  { field: 'updatedAt', order: 'desc', label: 'Modified (Newest first)' },
                  { field: 'updatedAt', order: 'asc', label: 'Modified (Oldest first)' },
                  { field: 'size', order: 'desc', label: 'Size (Largest first)' },
                  { field: 'size', order: 'asc', label: 'Size (Smallest first)' },
                ].map((opt) => {
                  const isSelected =
                    sortOption.field === opt.field && sortOption.order === opt.order;
                  return (
                    <button
                      key={`${opt.field}-${opt.order}`}
                      type="button"
                      onClick={() => {
                        setSortOption({
                          field: opt.field as SortField,
                          order: opt.order as 'asc' | 'desc',
                        });
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-blue-950/60 text-blue-400 font-medium'
                          : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* View Mode Toggle: Grid vs List */}
          <div className="flex items-center p-0.5 rounded-lg border border-zinc-800 bg-zinc-900">
            <button
              id="view-mode-grid"
              type="button"
              onClick={() => setViewMode('grid')}
              title="Grid view"
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              id="view-mode-list"
              type="button"
              onClick={() => setViewMode('list')}
              title="List view"
              className={`p-1.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle Details Panel */}
          <button
            id="btn-toggle-details"
            type="button"
            onClick={() => setShowDetailsPane(!showDetailsPane)}
            title="File details inspector"
            className={`p-2 rounded-lg border border-zinc-800 transition-colors cursor-pointer ${
              showDetailsPane
                ? 'bg-blue-950/60 text-blue-400 border-blue-900/80'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
            }`}
          >
            <Info className="w-4 h-4" />
          </button>

          {/* User Profile Badge & Dropdown */}
          <div className="relative pl-2 border-l border-zinc-800" ref={userMenuRef}>
            <button
              id="user-profile-menu-button"
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-1 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
              title={currentUser ? `Logged in as ${currentUser}` : 'Account settings'}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white font-semibold text-xs shadow-md shadow-blue-600/25 border border-blue-500/30 uppercase">
                {currentUser ? currentUser.charAt(0) : 'U'}
              </div>
              <span className="hidden sm:inline text-xs font-medium text-zinc-200 max-w-[100px] truncate">
                {currentUser || 'Account'}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-1 w-56 bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-2 border-b border-zinc-800">
                  <p className="text-[11px] text-zinc-500">Signed in as</p>
                  <p className="font-semibold text-white truncate">
                    {currentUser || 'User'}
                  </p>
                  <div className="mt-1 flex items-center space-x-1.5 text-[10px] text-blue-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block animate-pulse" />
                    <span>10 TB Cloud Storage Active</span>
                  </div>
                </div>

                <div className="pt-1">
                  {onLogout && (
                    <button
                      id="btn-header-logout"
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3.5 py-2 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 flex items-center space-x-2 transition-colors font-medium cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
