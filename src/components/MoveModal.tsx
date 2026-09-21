import React from 'react';
import { X, FolderInput, HardDrive, Check } from 'lucide-react';
import { FileItem } from '../types';
import { FileIcon } from './FileIcon';

interface MoveModalProps {
  itemsToMove: FileItem[];
  allFolders: FileItem[];
  currentParentId: string | null;
  onClose: () => void;
  onMove: (targetParentId: string | null) => void;
}

export const MoveModal: React.FC<MoveModalProps> = ({
  itemsToMove,
  allFolders,
  currentParentId,
  onClose,
  onMove,
}) => {
  const [selectedTarget, setSelectedTarget] = React.useState<string | null>(currentParentId);

  // Avoid circular moves (cannot move folder into itself or its own subfolders)
  const invalidFolderIds = new Set<string>();
  itemsToMove.forEach((item) => {
    if (item.type === 'folder') {
      invalidFolderIds.add(item.id);
      // find children recursively
      const queue = [item.id];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        allFolders
          .filter((f) => f.parentId === curr)
          .forEach((child) => {
            invalidFolderIds.add(child.id);
            queue.push(child.id);
          });
      }
    }
  });

  const availableFolders = allFolders.filter(
    (f) => !f.inTrash && !invalidFolderIds.has(f.id)
  );

  const handleConfirm = () => {
    onMove(selectedTarget);
    onClose();
  };

  return (
    <div
      id="move-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="move-modal-card"
        className="w-full max-w-md bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-800 p-6 flex flex-col max-h-[80vh] text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-900/60 flex items-center justify-center text-blue-400">
              <FolderInput className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Move {itemsToMove.length === 1 ? `"${itemsToMove[0].name}"` : `${itemsToMove.length} items`}
              </h3>
              <p className="text-[11px] text-zinc-400">Select destination location</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Folder List */}
        <div className="py-3 flex-1 overflow-y-auto space-y-1">
          {/* Root Destination */}
          <button
            type="button"
            onClick={() => setSelectedTarget(null)}
            className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer ${
              selectedTarget === null
                ? 'bg-blue-950/50 text-blue-300 border border-blue-800/60 font-medium'
                : 'hover:bg-zinc-900/80 text-zinc-300'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <HardDrive className="w-4 h-4 text-blue-500" />
              <span>My Drive (Root directory)</span>
            </div>
            {selectedTarget === null && <Check className="w-4 h-4 text-blue-500" />}
          </button>

          {/* Subfolders */}
          {availableFolders.map((folder) => {
            const isSelected = selectedTarget === folder.id;
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => setSelectedTarget(folder.id)}
                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-950/50 text-blue-300 border border-blue-800/60 font-medium'
                    : 'hover:bg-zinc-900/80 text-zinc-300'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <FileIcon type="folder" color={folder.color} className="w-4 h-4 shrink-0" />
                  <span className="truncate">{folder.name}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-blue-500 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-medium transition-colors shadow-md shadow-blue-600/25 cursor-pointer"
          >
            Move Here
          </button>
        </div>
      </div>
    </div>
  );
};
