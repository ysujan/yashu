import React from 'react';
import {
  HardDrive,
  Clock,
  Star,
  Trash2,
  Share2,
  Plus,
  FolderPlus,
  Upload,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Film,
  Music,
  Archive,
  Code,
  ShieldCheck,
  CheckCircle2,
  Cloud,
  Database,
  LogOut,
} from 'lucide-react';
import { ActiveView, CategoryFilter, StorageStats } from '../types';
import { formatBytes } from '../lib/storage';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  categoryFilter: CategoryFilter;
  setCategoryFilter: (category: CategoryFilter) => void;
  storageStats: StorageStats;
  onNewFolder: () => void;
  onNewTextFile: () => void;
  onUploadClick: () => void;
  trashedCount: number;
  starredCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  currentFolderName?: string | null;
  currentUser?: string | null;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  categoryFilter,
  setCategoryFilter,
  storageStats,
  onNewFolder,
  onNewTextFile,
  onUploadClick,
  trashedCount,
  starredCount,
  isOpenMobile,
  onCloseMobile,
  currentFolderName,
  currentUser,
  onLogout,
}) => {
  const [showNewMenu, setShowNewMenu] = React.useState(false);
  const newMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (newMenuRef.current && !newMenuRef.current.contains(event.target as Node)) {
        setShowNewMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const percentUsed = Math.min(
    100,
    Math.max(0.1, (storageStats.usedBytes / storageStats.totalBytes) * 100)
  );

  const navItems: Array<{
    id: ActiveView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }> = [
    { id: 'my-drive', label: 'My Drive', icon: HardDrive },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'starred', label: 'Starred', icon: Star, count: starredCount },
    { id: 'shared', label: 'Shared Links', icon: Share2 },
    { id: 'trash', label: 'Trash', icon: Trash2, count: trashedCount },
  ];

  const categories: Array<{
    id: CategoryFilter;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'image', label: 'Images', icon: ImageIcon },
    { id: 'document', label: 'Documents', icon: FileText },
    { id: 'video', label: 'Videos', icon: Film },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'archive', label: 'Archives', icon: Archive },
    { id: 'code', label: 'Code & Config', icon: Code },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out text-zinc-200 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo & Brand Header */}
        <div className="h-16 px-6 border-b border-zinc-800/90 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/25 border border-blue-500/30">
              <HardDrive className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-semibold text-white tracking-tight text-lg">
                  FreeCloud
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-900/80">
                  Free
                </span>
              </div>
              <p className="text-xs text-zinc-400">10 TB Cloud Storage</p>
            </div>
          </div>
        </div>

        {/* Action Button: + New */}
        <div className="p-4 relative" ref={newMenuRef}>
          <button
            id="btn-new-item"
            type="button"
            onClick={() => setShowNewMenu(!showNewMenu)}
            className="w-full h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium flex items-center justify-center space-x-2 transition-all shadow-md shadow-blue-600/30 cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>New</span>
          </button>

          {/* New Item Dropdown Menu */}
          {showNewMenu && (
            <div className="absolute top-16 left-4 right-4 z-50 bg-zinc-900 rounded-xl shadow-2xl border border-zinc-800 py-1.5 animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  setShowNewMenu(false);
                  onNewFolder();
                }}
                className="w-full px-3.5 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800 flex items-center space-x-3 transition-colors cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-amber-500" />
                <span className="font-medium">New folder</span>
              </button>

              <div className="my-1 border-t border-zinc-800" />

              <button
                type="button"
                id="sidebar-upload-option-btn"
                onClick={() => {
                  setShowNewMenu(false);
                  onUploadClick();
                }}
                className="w-full px-3.5 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800 flex items-center justify-between transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <Upload className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Upload files</span>
                </div>
                {currentFolderName ? (
                  <span className="text-[10px] text-zinc-400 max-w-[100px] truncate bg-zinc-800 px-2 py-0.5 rounded-md font-mono">
                    to {currentFolderName}
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500 bg-zinc-800/60 px-1.5 py-0.5 rounded font-mono">
                    My Drive
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowNewMenu(false);
                  onNewTextFile();
                }}
                className="w-full px-3.5 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-800 flex items-center space-x-3 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-emerald-500" />
                <span className="font-medium">New text note</span>
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-6">
          {/* Main Views */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id && categoryFilter === 'all';
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  type="button"
                  onClick={() => {
                    setActiveView(item.id);
                    setCategoryFilter('all');
                    onCloseMobile();
                  }}
                  className={`w-full h-10 px-3.5 rounded-lg flex items-center justify-between text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-950/60 text-blue-400 border border-blue-900/60 font-semibold'
                      : 'text-zinc-300 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-blue-400'
                          : 'text-zinc-500'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${isActive ? 'bg-blue-900/60 text-blue-200' : 'bg-zinc-800 text-zinc-300'}`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Categories Filter */}
          <div>
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Categories
            </div>
            <div className="space-y-1">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = categoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    id={`cat-filter-${cat.id}`}
                    type="button"
                    onClick={() => {
                      setCategoryFilter(cat.id);
                      setActiveView('category');
                      onCloseMobile();
                    }}
                    className={`w-full h-9 px-3.5 rounded-lg flex items-center space-x-3 text-xs font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-950/60 text-blue-400 border border-blue-900/60 font-semibold'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isSelected
                          ? 'text-blue-400'
                          : 'text-zinc-500'
                      }`}
                    />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Storage Bar & Free Tier Card */}
        <div className="p-3.5 border-t border-zinc-800/90 bg-black/40 space-y-2.5">
          <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-white">
                  Free Forever Storage
                </span>
              </div>
              <span className="text-[11px] font-medium text-zinc-400">
                10 TB Quota
              </span>
            </div>

            {/* Storage Progress Bar */}
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden my-2">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${percentUsed}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>{formatBytes(storageStats.usedBytes)} used</span>
              <span>10 TB Free</span>
            </div>

            <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px]">
              <span className="text-emerald-400 font-medium flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cloud DB Persistent</span>
              </span>
              <span className="text-zinc-500 font-mono text-[10px]" title="Files are auto-saved to Firestore database and will not be lost when reloading or clearing history">Auto-Synced</span>
            </div>
          </div>

          {/* Dedicated Bottom User Account & Logout Button */}
          {onLogout && (
            <div
              id="sidebar-bottom-user-section"
              className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between gap-2"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white font-semibold text-xs shadow-xs border border-blue-500/30 uppercase shrink-0">
                  {currentUser ? currentUser.charAt(0) : 'Y'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate max-w-[85px]">
                    {currentUser || 'yashu22'}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">
                    10 TB Session
                  </p>
                </div>
              </div>

              <button
                id="btn-sidebar-bottom-logout"
                type="button"
                onClick={onLogout}
                title="Log out of FreeCloud"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-850 hover:bg-rose-950/60 text-zinc-300 hover:text-rose-300 border border-zinc-750 hover:border-rose-900/60 transition-all text-xs font-medium cursor-pointer shadow-xs shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
