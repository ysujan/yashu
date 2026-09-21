import React from 'react';
import {
  initializeStorage,
  saveUploadedFile,
  createFolder,
  createTextFile,
  updateFileMeta,
  moveToTrash,
  restoreFromTrash,
  restoreAllFromTrash,
  permanentlyDelete,
  emptyTrash,
  triggerDownload,
  calculateStorage,
} from './lib/storage';
import { testConnection } from './lib/firebase';
import {
  FileItem,
  ActiveView,
  CategoryFilter,
  ViewMode,
  SortOption,
  BreadcrumbItem,
  ShareSettings,
} from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Breadcrumbs } from './components/Breadcrumbs';
import { FileGrid } from './components/FileGrid';
import { FileList } from './components/FileList';
import { FilePreviewModal } from './components/FilePreviewModal';
import { ShareModal } from './components/ShareModal';
import { CreateFolderModal } from './components/CreateFolderModal';
import { RenameModal } from './components/RenameModal';
import { MoveModal } from './components/MoveModal';
import { NewTextFileModal } from './components/NewTextFileModal';
import { FileDetailsSidebar } from './components/FileDetailsSidebar';
import { NotificationToast, ToastMessage } from './components/NotificationToast';
import { TrashConfirmModal } from './components/TrashConfirmModal';
import { LoginPage } from './components/LoginPage';
import { UploadCloud, Trash2, RotateCcw } from 'lucide-react';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = React.useState<string | null>(() => {
    const saved =
      localStorage.getItem('freecloud_auth_user') ||
      sessionStorage.getItem('freecloud_auth_user');
    if (saved) return saved;
    // If not explicitly logged out in this browser session, default to logged in as yashu22
    const hasLoggedOut = sessionStorage.getItem('freecloud_has_logged_out');
    if (hasLoggedOut) return null;
    return 'yashu22';
  });

  const [files, setFiles] = React.useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentFolderId, setCurrentFolderId] = React.useState<string | null>(null);
  const [activeView, setActiveView] = React.useState<ActiveView>('my-drive');
  const [categoryFilter, setCategoryFilter] = React.useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [sortOption, setSortOption] = React.useState<SortOption>({
    field: 'updatedAt',
    order: 'desc',
  });

  // Selection & Inspector
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [showDetailsPane, setShowDetailsPane] = React.useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  // Modals
  const [previewItem, setPreviewItem] = React.useState<FileItem | null>(null);
  const [shareItem, setShareItem] = React.useState<FileItem | null>(null);
  const [renameItem, setRenameItem] = React.useState<FileItem | null>(null);
  const [moveModalItems, setMoveModalItems] = React.useState<FileItem[] | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = React.useState(false);
  const [isNewTextFileOpen, setIsNewTextFileOpen] = React.useState(false);

  // Confirmations & Drag/Drop
  const [trashConfirm, setTrashConfirm] = React.useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [targetFolderIdForUpload, setTargetFolderIdForUpload] = React.useState<string | null>(null);

  // Helper to add toast
  const addToast = (type: 'success' | 'info' | 'error', title: string, description?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initialize DB and load files
  React.useEffect(() => {
    testConnection().catch(() => {});
  }, []);

  React.useEffect(() => {
    if (!currentUser) return;
    async function init() {
      setIsLoading(true);
      try {
        const loadedFiles = await initializeStorage(currentUser || 'yashu22');
        setFiles(loadedFiles);

        // Check if opened via share URL hash
        const hash = window.location.hash;
        if (hash.startsWith('#share=')) {
          const shareParam = hash.replace('#share=', '');
          const matched = loadedFiles.find(
            (f) => f.id === shareParam || f.shareSettings?.shareId === shareParam
          );
          if (matched && !matched.inTrash) {
            setPreviewItem(matched);
          }
        }
      } catch (err) {
        console.error('Failed to initialize storage', err);
        addToast('error', 'Storage error', 'Could not initialize cloud database storage.');
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [currentUser]);

  // Compute breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = React.useMemo(() => {
    if (!currentFolderId) return [];

    const crumbs: BreadcrumbItem[] = [];
    let currId: string | null = currentFolderId;

    while (currId) {
      const folder = files.find((f) => f.id === currId);
      if (folder) {
        crumbs.unshift({ id: folder.id, name: folder.name });
        currId = folder.parentId;
      } else {
        break;
      }
    }

    return crumbs;
  }, [currentFolderId, files]);

  // Compute folder children counts
  const folderChildrenCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    files.forEach((file) => {
      if (file.parentId && !file.inTrash) {
        counts[file.parentId] = (counts[file.parentId] || 0) + 1;
      }
    });
    return counts;
  }, [files]);

  // Storage stats
  const storageStats = React.useMemo(() => calculateStorage(files), [files]);

  // Current folder details
  const currentFolder = React.useMemo(() => {
    return currentFolderId ? files.find((f) => f.id === currentFolderId) || null : null;
  }, [currentFolderId, files]);
  const currentFolderName = currentFolder ? currentFolder.name : null;

  // Filter and sort items for display
  const displayedItems = React.useMemo(() => {
    let result: FileItem[] = [];

    if (activeView === 'trash') {
      result = files.filter((f) => f.inTrash);
    } else {
      const activeFiles = files.filter((f) => !f.inTrash);

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        result = activeFiles.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.type.toLowerCase().includes(q) ||
            (f.tags && f.tags.some((t) => t.toLowerCase().includes(q)))
        );
      } else if (activeView === 'recent') {
        result = activeFiles.filter((f) => f.type !== 'folder');
      } else if (activeView === 'starred') {
        result = activeFiles.filter((f) => f.starred);
      } else if (activeView === 'shared') {
        result = activeFiles.filter((f) => f.shareSettings?.isShared);
      } else if (activeView === 'category') {
        if (categoryFilter === 'all') {
          result = activeFiles;
        } else if (categoryFilter === 'document') {
          result = activeFiles.filter(
            (f) => f.type === 'document' || f.type === 'spreadsheet' || f.type === 'pdf'
          );
        } else {
          result = activeFiles.filter((f) => f.type === categoryFilter);
        }
      } else {
        // My Drive
        result = activeFiles.filter((f) => f.parentId === currentFolderId);
      }
    }

    // Sort items (folders always first unless sorting by size/updatedAt)
    return result.sort((a, b) => {
      // Keep folders on top in Drive view
      if (activeView === 'my-drive' && !searchQuery) {
        if (a.type === 'folder' && b.type !== 'folder') return -1;
        if (a.type !== 'folder' && b.type === 'folder') return 1;
      }

      let cmp = 0;
      if (sortOption.field === 'name') {
        cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      } else if (sortOption.field === 'size') {
        cmp = a.size - b.size;
      } else if (sortOption.field === 'type') {
        cmp = a.type.localeCompare(b.type);
      } else if (sortOption.field === 'createdAt') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        // updatedAt
        cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }

      return sortOption.order === 'asc' ? cmp : -cmp;
    });
  }, [files, activeView, categoryFilter, searchQuery, currentFolderId, sortOption]);

  // Selected item for details pane
  const lastSelectedItem = React.useMemo(() => {
    if (selectedIds.size === 1) {
      const [id] = Array.from(selectedIds);
      return files.find((f) => f.id === id) || null;
    }
    return null;
  }, [selectedIds, files]);

  // Handlers for File Selection
  const handleToggleSelect = (id: string, shiftKey: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (displayedItems.every((i) => selectedIds.has(i.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedItems.map((i) => i.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Trigger upload dialog optionally targeting a specific folder
  const triggerUpload = (targetFolderId?: string | null) => {
    const dest = targetFolderId !== undefined ? targetFolderId : currentFolderId;
    setTargetFolderIdForUpload(dest);
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 20);
  };

  // Upload handler with folder target resolution
  const handleFileUpload = async (
    fileList: FileList | null,
    overrideTargetId?: string | null
  ) => {
    if (!fileList || fileList.length === 0) return;

    const finalTargetId =
      overrideTargetId !== undefined
        ? overrideTargetId
        : targetFolderIdForUpload !== null
        ? targetFolderIdForUpload
        : currentFolderId;

    // Clear pending target
    setTargetFolderIdForUpload(null);

    const destFolder = files.find((f) => f.id === finalTargetId);
    const destName = destFolder ? destFolder.name : finalTargetId ? 'Folder' : 'My Drive';

    const filesToUpload = Array.from(fileList);
    addToast('info', 'Uploading...', `Saving ${filesToUpload.length} file(s) into "${destName}"`);

    let uploadedCount = 0;
    for (const file of filesToUpload) {
      try {
        const saved = await saveUploadedFile(file, finalTargetId, currentUser || 'yashu22');
        setFiles((prev) => [saved, ...prev]);
        uploadedCount++;
      } catch (err) {
        console.error('Error uploading file', file.name, err);
        addToast('error', 'Upload failed', `Could not save ${file.name}`);
      }
    }

    if (uploadedCount > 0) {
      addToast(
        'success',
        'Upload complete',
        `Successfully saved ${uploadedCount} file(s) into "${destName}".`
      );

      // If user uploaded to a specific folder that isn't currently open, navigate into it so they can see the files immediately
      if (finalTargetId && finalTargetId !== currentFolderId) {
        setCurrentFolderId(finalTargetId);
        setActiveView('my-drive');
        setSelectedIds(new Set());
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and Drop files over window
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingOver) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files, currentFolderId);
    }
  };

  // Folder creation
  const handleCreateFolder = async (name: string, color: string) => {
    try {
      const folder = await createFolder(name, currentFolderId, color, currentUser || 'yashu22');
      setFiles((prev) => [folder, ...prev]);
      addToast(
        'success',
        'Folder created',
        `Folder "${name}" ready! Open it or drop files onto it to upload.`
      );
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to create folder');
    }
  };

  // New text file creation
  const handleCreateTextFile = async (name: string, content: string) => {
    try {
      const newFile = await createTextFile(name, content, currentFolderId, currentUser || 'yashu22');
      setFiles((prev) => [newFile, ...prev]);
      addToast('success', 'Note created', `Document "${name}" saved to cloud database.`);
      setPreviewItem(newFile);
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to create document');
    }
  };

  // Star toggle
  const handleToggleStar = async (item: FileItem) => {
    try {
      const updated = await updateFileMeta(item.id, { starred: !item.starred });
      setFiles((prev) => prev.map((f) => (f.id === item.id ? updated : f)));
      if (previewItem?.id === item.id) {
        setPreviewItem(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Rename
  const handleRename = async (id: string, newName: string) => {
    try {
      const updated = await updateFileMeta(id, { name: newName });
      setFiles((prev) => prev.map((f) => (f.id === id ? updated : f)));
      if (previewItem?.id === id) {
        setPreviewItem(updated);
      }
      addToast('success', 'Renamed', `Item renamed to "${newName}"`);
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to rename');
    }
  };

  // Move
  const handleMove = async (targetParentId: string | null) => {
    if (!moveModalItems || moveModalItems.length === 0) return;

    try {
      const updatedList = await Promise.all(
        moveModalItems.map((item) => updateFileMeta(item.id, { parentId: targetParentId }))
      );

      setFiles((prev) => {
        const updateMap = new Map(updatedList.map((u) => [u.id, u]));
        return prev.map((f) => updateMap.get(f.id) || f);
      });

      addToast(
        'success',
        'Moved',
        `Moved ${moveModalItems.length} item(s) to selected destination.`
      );
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to move item(s)');
    }
  };

  // Trash
  const handleTrash = async (item: FileItem) => {
    try {
      const trashedIds = await moveToTrash(item.id, files);
      const trashedSet = new Set(trashedIds);
      setFiles((prev) =>
        prev.map((f) =>
          trashedSet.has(f.id) ? { ...f, inTrash: true, trashedAt: new Date().toISOString() } : f
        )
      );
      setSelectedIds((prev) => {
        const next = new Set(prev);
        trashedIds.forEach((id) => next.delete(id));
        return next;
      });
      addToast('info', 'Moved to Trash', `"${item.name}" was moved to the trash.`);
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to move to trash');
    }
  };

  // Restore from trash
  const handleRestore = async (item: FileItem) => {
    try {
      const restoredIds = await restoreFromTrash(item.id, files);
      const restoredSet = new Set(restoredIds);
      setFiles((prev) =>
        prev.map((f) =>
          restoredSet.has(f.id) ? { ...f, inTrash: false, trashedAt: null } : f
        )
      );
      addToast('success', 'Restored', `"${item.name}" was restored from trash.`);
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to restore item');
    }
  };

  // Permanent delete
  const handlePermanentDelete = (item: FileItem) => {
    setTrashConfirm({
      isOpen: true,
      title: 'Delete Permanently?',
      message: `Are you sure you want to delete "${item.name}" forever? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const deletedIds = await permanentlyDelete(item.id, files);
          const deletedSet = new Set(deletedIds);
          setFiles((prev) => prev.filter((f) => !deletedSet.has(f.id)));
          addToast('info', 'Deleted forever', `"${item.name}" was permanently removed.`);
        } catch (err) {
          console.error(err);
          addToast('error', 'Failed to delete');
        }
      },
    });
  };

  // Empty trash
  const handleEmptyTrash = () => {
    const trashedCount = files.filter((f) => f.inTrash).length;
    if (trashedCount === 0) return;

    setTrashConfirm({
      isOpen: true,
      title: 'Empty Trash?',
      message: `Are you sure you want to permanently delete all ${trashedCount} items in the trash? This cannot be undone.`,
      onConfirm: async () => {
        try {
          const deletedIds = await emptyTrash(files);
          const deletedSet = new Set(deletedIds);
          setFiles((prev) => prev.filter((f) => !deletedSet.has(f.id)));
          addToast('info', 'Trash emptied', 'All trashed files permanently deleted.');
        } catch (err) {
          console.error(err);
          addToast('error', 'Failed to empty trash');
        }
      },
    });
  };

  // Batch restore selected items from trash
  const handleBatchRestore = async () => {
    const itemsToRestore = files.filter((f) => selectedIds.has(f.id) && f.inTrash);
    if (itemsToRestore.length === 0) return;

    try {
      const allRestoredIds: string[] = [];
      for (const item of itemsToRestore) {
        const restored = await restoreFromTrash(item.id, files);
        allRestoredIds.push(...restored);
      }
      const restoredSet = new Set(allRestoredIds);
      setFiles((prev) =>
        prev.map((f) =>
          restoredSet.has(f.id) ? { ...f, inTrash: false, trashedAt: null } : f
        )
      );
      setSelectedIds(new Set());
      addToast('success', 'Restored to Drive', `Recovered ${itemsToRestore.length} item(s) from trash.`);
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to restore selected items');
    }
  };

  // Restore all items from trash
  const handleRestoreAll = async () => {
    const trashedItems = files.filter((f) => f.inTrash);
    if (trashedItems.length === 0) return;

    try {
      const restoredIds = await restoreAllFromTrash(files);
      const restoredSet = new Set(restoredIds);
      setFiles((prev) =>
        prev.map((f) =>
          restoredSet.has(f.id) ? { ...f, inTrash: false, trashedAt: null } : f
        )
      );
      setSelectedIds(new Set());
      addToast('success', 'Trash Recovered', `Recovered all ${trashedItems.length} item(s) back to your drive.`);
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to recover files from trash');
    }
  };

  // Batch permanently delete selected items in trash
  const handleBatchPermanentDelete = () => {
    const selectedItems = files.filter((f) => selectedIds.has(f.id) && f.inTrash);
    if (selectedItems.length === 0) return;

    setTrashConfirm({
      isOpen: true,
      title: `Permanently delete ${selectedItems.length} item(s)?`,
      message: `Are you sure you want to permanently delete these ${selectedItems.length} item(s)? This cannot be undone.`,
      onConfirm: async () => {
        try {
          const allDeletedIds: string[] = [];
          for (const item of selectedItems) {
            const deleted = await permanentlyDelete(item.id, files);
            allDeletedIds.push(...deleted);
          }
          const deletedSet = new Set(allDeletedIds);
          setFiles((prev) => prev.filter((f) => !deletedSet.has(f.id)));
          setSelectedIds(new Set());
          addToast('info', 'Deleted forever', `Permanently deleted ${selectedItems.length} item(s).`);
        } catch (err) {
          console.error(err);
          addToast('error', 'Failed to delete items permanently');
        }
      },
    });
  };

  // Share Settings save
  const handleSaveShareSettings = async (itemId: string, settings: ShareSettings) => {
    try {
      const updated = await updateFileMeta(itemId, { shareSettings: settings });
      setFiles((prev) => prev.map((f) => (f.id === itemId ? updated : f)));
      if (previewItem?.id === itemId) {
        setPreviewItem(updated);
      }
      addToast('success', 'Link updated', 'Share link configuration saved.');
    } catch (err) {
      console.error(err);
    }
  };

  // Batch actions
  const handleBatchDownload = async () => {
    const items = files.filter((f) => selectedIds.has(f.id) && f.type !== 'folder');
    if (items.length === 0) return;
    for (const item of items) {
      try {
        await triggerDownload(item);
      } catch (err) {
        console.error(err);
      }
    }
    addToast('success', 'Downloading', `Downloaded ${items.length} file(s).`);
  };

  const handleBatchStar = async () => {
    const items = files.filter((f) => selectedIds.has(f.id));
    const allStarred = items.every((i) => i.starred);
    const targetState = !allStarred;

    const updatedList = await Promise.all(
      items.map((i) => updateFileMeta(i.id, { starred: targetState }))
    );

    setFiles((prev) => {
      const updateMap = new Map(updatedList.map((u) => [u.id, u]));
      return prev.map((f) => updateMap.get(f.id) || f);
    });

    addToast(
      'success',
      targetState ? 'Starred' : 'Unstarred',
      `${items.length} item(s) updated.`
    );
  };

  const handleBatchTrash = async () => {
    const items = files.filter((f) => selectedIds.has(f.id));
    if (items.length === 0) return;

    for (const item of items) {
      await moveToTrash(item.id, files);
    }

    setFiles((prev) =>
      prev.map((f) =>
        selectedIds.has(f.id)
          ? { ...f, inTrash: true, trashedAt: new Date().toISOString() }
          : f
      )
    );
    setSelectedIds(new Set());
    addToast('info', 'Moved to Trash', `Moved ${items.length} item(s) to trash.`);
  };

  // Keyboard shortcut: Delete or Backspace to delete selected files
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toUpperCase();
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0) {
        e.preventDefault();
        if (activeView === 'trash') {
          const selectedItems = files.filter((f) => selectedIds.has(f.id));
          if (selectedItems.length > 0) {
            setTrashConfirm({
              isOpen: true,
              title: `Delete ${selectedItems.length} item(s) permanently?`,
              message: 'These items will be permanently erased. This action cannot be undone.',
              onConfirm: async () => {
                for (const item of selectedItems) {
                  await permanentlyDelete(item.id, files);
                }
                setFiles((prev) => prev.filter((f) => !selectedIds.has(f.id)));
                setSelectedIds(new Set());
                addToast('info', 'Deleted forever', `Removed ${selectedItems.length} item(s).`);
              },
            });
          }
        } else {
          handleBatchTrash();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, files, activeView]);

  const handleBatchMove = () => {
    const items = files.filter((f) => selectedIds.has(f.id));
    if (items.length > 0) {
      setMoveModalItems(items);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('freecloud_auth_user');
    sessionStorage.removeItem('freecloud_auth_user');
    sessionStorage.setItem('freecloud_has_logged_out', 'true');
    setCurrentUser(null);
    addToast('info', 'Signed Out', 'You have been logged out of FreeCloud.');
  };

  // Trashed & Starred counters
  const trashedCount = files.filter((f) => f.inTrash).length;
  const starredCount = files.filter((f) => f.starred && !f.inTrash).length;

  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          sessionStorage.removeItem('freecloud_has_logged_out');
          setCurrentUser(user);
        }}
      />
    );
  }

  return (
    <div
      id="freecloud-root"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex h-screen w-screen overflow-hidden bg-black text-zinc-100 font-sans selection:bg-blue-600 selection:text-white"
    >
      {/* Hidden File Input for Native Uploads */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* Drag & Drop Overlay */}
      {isDraggingOver && (
        <div
          id="drag-drop-overlay"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-white border-4 border-dashed border-blue-500 p-8 animate-in fade-in duration-150"
        >
          <div className="w-20 h-20 rounded-3xl bg-blue-600/20 border border-blue-500/50 flex items-center justify-center mb-6 animate-bounce text-blue-400">
            <UploadCloud className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {currentFolderName ? `Upload to "${currentFolderName}"` : 'Drop files to upload'}
          </h2>
          <p className="text-sm text-blue-300 mt-2 max-w-md text-center">
            {currentFolderName
              ? `Files will be stored directly inside the "${currentFolderName}" folder.`
              : 'Files will be stored securely in your 10 TB Free Cloud Storage.'}
          </p>
        </div>
      )}

      {/* Left Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={(v) => {
          setActiveView(v);
          setSelectedIds(new Set());
          if (v === 'my-drive') {
            setCurrentFolderId(null);
          }
        }}
        categoryFilter={categoryFilter}
        setCategoryFilter={(c) => {
          setCategoryFilter(c);
          setSelectedIds(new Set());
        }}
        storageStats={storageStats}
        onNewFolder={() => setIsCreateFolderOpen(true)}
        onNewTextFile={() => setIsNewTextFileOpen(true)}
        onUploadClick={() => triggerUpload(currentFolderId)}
        currentFolderName={currentFolderName}
        trashedCount={trashedCount}
        starredCount={starredCount}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortOption={sortOption}
          setSortOption={setSortOption}
          showDetailsPane={showDetailsPane}
          setShowDetailsPane={setShowDetailsPane}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          selectedCount={selectedIds.size}
          onBatchDownload={handleBatchDownload}
          onBatchStar={handleBatchStar}
          onBatchTrash={handleBatchTrash}
          onBatchMove={handleBatchMove}
          onClearSelection={handleClearSelection}
          totalFilteredCount={displayedItems.length}
          currentUser={currentUser}
          onLogout={handleLogout}
          onUploadClick={() => triggerUpload(currentFolderId)}
          currentFolderName={currentFolderName}
          isTrashView={activeView === 'trash'}
          onBatchRestore={handleBatchRestore}
          onBatchPermanentDelete={handleBatchPermanentDelete}
        />

        {/* Workspace Body */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-4">
            {/* Trash Toolbar Bar (if in trash view) */}
            {activeView === 'trash' && (
              <div className="mb-4 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-950/70 border border-blue-800/80 flex items-center justify-center text-blue-400 shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-zinc-200 font-medium block">
                      Trash Bin & File Recovery
                    </span>
                    <span className="text-zinc-400 text-[11px]">
                      {trashedCount === 0
                        ? 'Trash is empty. Trashed files can be restored to your drive anytime.'
                        : `${trashedCount} item(s) in trash. You can recover individual items or restore all back to your drive.`}
                    </span>
                  </div>
                </div>

                {trashedCount > 0 && (
                  <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                    {/* If items are selected, offer direct batch restore */}
                    {selectedIds.size > 0 && (
                      <button
                        id="trash-banner-restore-selected-btn"
                        type="button"
                        onClick={handleBatchRestore}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-blue-600/25 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore Selected ({selectedIds.size})</span>
                      </button>
                    )}

                    {/* Restore all files button */}
                    <button
                      id="trash-banner-restore-all-btn"
                      type="button"
                      onClick={handleRestoreAll}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold flex items-center space-x-1.5 transition-all shadow-md shadow-blue-600/25 cursor-pointer"
                      title="Restore all files and folders back to your drive"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Recover All Files</span>
                    </button>

                    {/* Empty Trash button */}
                    <button
                      id="trash-banner-empty-trash-btn"
                      type="button"
                      onClick={handleEmptyTrash}
                      className="px-3 py-1.5 rounded-lg bg-zinc-850 hover:bg-rose-950/60 text-zinc-300 hover:text-rose-300 border border-zinc-750 hover:border-rose-800/60 font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                      title="Permanently delete all trash items"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Empty Trash</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Breadcrumb Navigation & View Header */}
            <Breadcrumbs
              breadcrumbs={breadcrumbs}
              onNavigate={(folderId) => {
                setCurrentFolderId(folderId);
                setSelectedIds(new Set());
              }}
              activeView={activeView}
              categoryFilter={categoryFilter}
              itemCount={displayedItems.length}
              onUploadClick={() => triggerUpload(currentFolderId)}
              currentFolderId={currentFolderId}
              currentFolderName={currentFolderName}
            />

            {/* Files & Folders Presentation: Grid vs List */}
            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center text-zinc-400">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs">Loading your cloud drive...</p>
              </div>
            ) : viewMode === 'grid' ? (
              <FileGrid
                items={displayedItems}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onOpenItem={(item) => {
                  if (item.type === 'folder') {
                    setCurrentFolderId(item.id);
                    setSelectedIds(new Set());
                  } else {
                    setPreviewItem(item);
                  }
                }}
                onDownload={triggerDownload}
                onShare={(item) => setShareItem(item)}
                onRename={(item) => setRenameItem(item)}
                onMove={(item) => setMoveModalItems([item])}
                onToggleStar={handleToggleStar}
                onTrash={handleTrash}
                onRestore={handleRestore}
                onPermanentDelete={handlePermanentDelete}
                isTrashView={activeView === 'trash'}
                onSelectFolder={(folderId) => {
                  setCurrentFolderId(folderId);
                  setSelectedIds(new Set());
                }}
                folderChildrenCounts={folderChildrenCounts}
                onUploadToFolder={(folderId) => triggerUpload(folderId)}
                onDropFilesOnFolder={(fl, folderId) => handleFileUpload(fl, folderId)}
                onUploadClick={() => triggerUpload(currentFolderId)}
                onNewTextFile={() => setIsNewTextFileOpen(true)}
                currentFolderName={currentFolderName}
              />
            ) : (
              <FileList
                items={displayedItems}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
                onSelectAll={handleSelectAll}
                onOpenItem={(item) => {
                  if (item.type === 'folder') {
                    setCurrentFolderId(item.id);
                    setSelectedIds(new Set());
                  } else {
                    setPreviewItem(item);
                  }
                }}
                onDownload={triggerDownload}
                onShare={(item) => setShareItem(item)}
                onRename={(item) => setRenameItem(item)}
                onMove={(item) => setMoveModalItems([item])}
                onToggleStar={handleToggleStar}
                onTrash={handleTrash}
                onRestore={handleRestore}
                onPermanentDelete={handlePermanentDelete}
                isTrashView={activeView === 'trash'}
                onSelectFolder={(folderId) => {
                  setCurrentFolderId(folderId);
                  setSelectedIds(new Set());
                }}
                folderChildrenCounts={folderChildrenCounts}
                sortOption={sortOption}
                onSortChange={(field) => {
                  setSortOption((prev) => ({
                    field,
                    order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
                  }));
                }}
                onUploadToFolder={(folderId) => triggerUpload(folderId)}
                onDropFilesOnFolder={(fl, folderId) => handleFileUpload(fl, folderId)}
                onUploadClick={() => triggerUpload(currentFolderId)}
                onNewTextFile={() => setIsNewTextFileOpen(true)}
                currentFolderName={currentFolderName}
              />
            )}
          </main>

          {/* Details & Inspector Sidebar */}
          {showDetailsPane && (
            <FileDetailsSidebar
              item={lastSelectedItem}
              onClose={() => setShowDetailsPane(false)}
              onDownload={triggerDownload}
              onShare={(item) => setShareItem(item)}
              onRename={(item) => setRenameItem(item)}
              onToggleStar={handleToggleStar}
              onTrash={handleTrash}
              onRestore={handleRestore}
              onPermanentDelete={handlePermanentDelete}
              currentFolderName={
                breadcrumbs.length > 0
                  ? breadcrumbs[breadcrumbs.length - 1].name
                  : 'My Drive'
              }
            />
          )}
        </div>

      </div>

      {/* Modals & Dialogs */}
      <FilePreviewModal
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onShare={(item) => setShareItem(item)}
        onToggleStar={handleToggleStar}
        onItemUpdated={(updated) => {
          setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
          setPreviewItem(updated);
        }}
        onDownload={async (item) => {
          try {
            await triggerDownload(item);
            addToast('success', 'Download Complete', `Saved ${item.name}`);
          } catch (err: any) {
            addToast('error', 'Download Failed', err?.message || 'Could not download file');
          }
        }}
        onDelete={(item) => {
          setPreviewItem(null);
          handleTrash(item);
        }}
        onRestore={handleRestore}
      />

      <ShareModal
        item={shareItem}
        onClose={() => setShareItem(null)}
        onSaveShareSettings={handleSaveShareSettings}
      />

      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onCreate={handleCreateFolder}
      />

      <RenameModal
        item={renameItem}
        onClose={() => setRenameItem(null)}
        onRename={handleRename}
      />

      {moveModalItems && (
        <MoveModal
          itemsToMove={moveModalItems}
          allFolders={files.filter((f) => f.type === 'folder')}
          currentParentId={currentFolderId}
          onClose={() => setMoveModalItems(null)}
          onMove={handleMove}
        />
      )}

      <NewTextFileModal
        isOpen={isNewTextFileOpen}
        onClose={() => setIsNewTextFileOpen(false)}
        onCreate={handleCreateTextFile}
      />

      <TrashConfirmModal
        isOpen={trashConfirm.isOpen}
        title={trashConfirm.title}
        message={trashConfirm.message}
        onClose={() => setTrashConfirm((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={trashConfirm.onConfirm}
      />

      {/* Toast Notifications */}
      <NotificationToast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
