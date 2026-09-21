export type FileType =
  | 'folder'
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'document'
  | 'spreadsheet'
  | 'code'
  | 'archive'
  | 'other';

export interface ShareSettings {
  isShared: boolean;
  shareId: string;
  access: 'view' | 'edit';
  passwordProtected: boolean;
  password?: string;
  expiresAt?: string | null;
}

export interface FileItem {
  id: string;
  name: string;
  type: FileType;
  mimeType: string;
  size: number; // in bytes (folders: cumulative or 0)
  parentId: string | null; // null for root level
  createdAt: string;
  updatedAt: string;
  starred: boolean;
  inTrash: boolean;
  trashedAt?: string | null;
  textData?: string | null;
  previewUrl?: string | null;
  dataUrl?: string | null;
  color?: string; // for folders (e.g. 'indigo', 'emerald', 'amber', 'rose', 'sky')
  tags?: string[];
  shareSettings?: ShareSettings;
  ownerId?: string;
}

export type ViewMode = 'grid' | 'list';

export type ActiveView =
  | 'my-drive'
  | 'recent'
  | 'starred'
  | 'trash'
  | 'shared'
  | 'category';

export type CategoryFilter =
  | 'all'
  | 'image'
  | 'document'
  | 'video'
  | 'audio'
  | 'archive'
  | 'code';

export type SortField = 'name' | 'updatedAt' | 'createdAt' | 'size' | 'type';
export type SortOrder = 'asc' | 'desc';

export interface SortOption {
  field: SortField;
  order: SortOrder;
}

export interface StorageStats {
  usedBytes: number;
  totalBytes: number; // default 10 TB (10 * 1024 * 1024 * 1024 * 1024)
  byType: {
    images: number;
    documents: number;
    media: number; // video + audio
    archives: number;
    other: number;
  };
}

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}
