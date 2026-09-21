import React from 'react';
import {
  Folder,
  Image as ImageIcon,
  Film,
  Music,
  FileText,
  FileSpreadsheet,
  FileCode,
  Archive,
  File as GenericFile,
} from 'lucide-react';
import { FileType } from '../types';

interface FileIconProps {
  type: FileType;
  color?: string;
  className?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ type, color, className = 'w-6 h-6' }) => {
  if (type === 'folder') {
    const colorClasses: Record<string, string> = {
      indigo: 'text-indigo-500 fill-indigo-100 dark:fill-indigo-950/40',
      amber: 'text-amber-500 fill-amber-100 dark:fill-amber-950/40',
      emerald: 'text-emerald-500 fill-emerald-100 dark:fill-emerald-950/40',
      rose: 'text-rose-500 fill-rose-100 dark:fill-rose-950/40',
      sky: 'text-sky-500 fill-sky-100 dark:fill-sky-950/40',
      purple: 'text-purple-500 fill-purple-100 dark:fill-purple-950/40',
    };
    const folderColor = (color && colorClasses[color]) || colorClasses.amber;
    return <Folder className={`${className} ${folderColor}`} />;
  }

  switch (type) {
    case 'image':
      return <ImageIcon className={`${className} text-rose-500`} />;
    case 'video':
      return <Film className={`${className} text-violet-500`} />;
    case 'audio':
      return <Music className={`${className} text-amber-500`} />;
    case 'pdf':
      return <FileText className={`${className} text-red-600`} />;
    case 'document':
      return <FileText className={`${className} text-blue-500`} />;
    case 'spreadsheet':
      return <FileSpreadsheet className={`${className} text-emerald-600`} />;
    case 'code':
      return <FileCode className={`${className} text-cyan-600`} />;
    case 'archive':
      return <Archive className={`${className} text-orange-500`} />;
    default:
      return <GenericFile className={`${className} text-slate-400`} />;
  }
};
