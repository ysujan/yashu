import React from 'react';
import { X, FileText } from 'lucide-react';

interface NewTextFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, content: string) => void;
}

export const NewTextFileModal: React.FC<NewTextFileModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [fileName, setFileName] = React.useState('Untitled Note.md');
  const [content, setContent] = React.useState('');
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setFileName('Untitled Note.md');
      setContent('');
      setTimeout(() => titleInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;
    onCreate(fileName.trim(), content);
    onClose();
  };

  return (
    <div
      id="new-text-file-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="new-text-file-modal-card"
        className="w-full max-w-lg bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-800 p-6 flex flex-col h-[70vh] text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-950/60 border border-blue-900/60 flex items-center justify-center text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">
              Create Text Document
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col pt-4 space-y-3 overflow-hidden">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              File Name (e.g. .md, .txt, .json)
            </label>
            <input
              ref={titleInputRef}
              type="text"
              required
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-zinc-800 bg-zinc-900 text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            />
          </div>

          <div className="flex-1 flex flex-col">
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Document Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write markdown, notes, or code here..."
              className="w-full flex-1 p-3 rounded-xl border border-zinc-800 bg-zinc-900 font-mono text-xs text-zinc-200 resize-none focus:outline-hidden focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 leading-relaxed"
            />
          </div>

          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
            <span>{content.length} characters</span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!fileName.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-medium disabled:opacity-50 transition-colors shadow-md shadow-blue-600/25 cursor-pointer"
              >
                Create Document
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
