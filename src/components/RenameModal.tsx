import React from 'react';
import { X, Edit2 } from 'lucide-react';
import { FileItem } from '../types';

interface RenameModalProps {
  item: FileItem | null;
  onClose: () => void;
  onRename: (id: string, newName: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({ item, onClose, onRename }) => {
  const [name, setName] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (item) {
      setName(item.name);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const dotIndex = item.name.lastIndexOf('.');
          if (dotIndex > 0 && item.type !== 'folder') {
            inputRef.current.setSelectionRange(0, dotIndex);
          } else {
            inputRef.current.select();
          }
        }
      }, 50);
    }
  }, [item]);

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onRename(item.id, name.trim());
    onClose();
  };

  return (
    <div
      id="rename-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="rename-modal-card"
        className="w-full max-w-sm bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-800 p-6 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-900/60 flex items-center justify-center text-blue-400">
              <Edit2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Rename</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Name
            </label>
            <input
              ref={inputRef}
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-zinc-800 bg-zinc-900 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || name.trim() === item.name}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-medium disabled:opacity-50 transition-colors shadow-md shadow-blue-600/25 cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
