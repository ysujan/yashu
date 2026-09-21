import React from 'react';
import { Trash2, X } from 'lucide-react';

interface TrashConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
}

export const TrashConfirmModal: React.FC<TrashConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete Forever',
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="trash-confirm-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="trash-confirm-modal-card"
        className="w-full max-w-sm bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-800 p-6 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-950/60 border border-red-900/60 flex items-center justify-center text-red-400">
              <Trash2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="py-4 text-xs text-zinc-300 leading-relaxed">
          {message}
        </p>

        <div className="pt-2 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-zinc-300 hover:bg-zinc-800 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs font-medium transition-colors shadow-md shadow-red-600/25 cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
