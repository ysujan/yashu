import React from 'react';
import { X, FolderPlus } from 'lucide-react';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, color: string) => void;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [folderName, setFolderName] = React.useState('');
  const [selectedColor, setSelectedColor] = React.useState('indigo');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setFolderName('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    onCreate(folderName.trim(), selectedColor);
    onClose();
  };

  const colors = [
    { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
    { id: 'amber', label: 'Amber', bg: 'bg-amber-500' },
    { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
    { id: 'rose', label: 'Rose', bg: 'bg-rose-500' },
    { id: 'sky', label: 'Sky', bg: 'bg-sky-500' },
    { id: 'purple', label: 'Purple', bg: 'bg-purple-500' },
  ];

  return (
    <div
      id="create-folder-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="create-folder-modal-card"
        className="w-full max-w-sm bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-800 p-6 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-900/60 flex items-center justify-center text-blue-400">
              <FolderPlus className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">New Folder</h3>
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
              Folder Name
            </label>
            <input
              ref={inputRef}
              type="text"
              required
              placeholder="e.g. Work Documents"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-zinc-800 bg-zinc-900 text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-2">
              Folder Color
            </label>
            <div className="flex items-center space-x-2.5">
              {colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.id)}
                  title={c.label}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-all cursor-pointer ${
                    selectedColor === c.id
                      ? 'ring-2 ring-offset-2 ring-blue-500 ring-offset-zinc-950 scale-110'
                      : 'opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
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
              disabled={!folderName.trim()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-medium disabled:opacity-50 transition-colors shadow-md shadow-blue-600/25 cursor-pointer"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
