import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  title: string;
  description?: string;
}

interface NotificationToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      id="notification-toast-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full"
    >
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />,
          error: <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />,
          info: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
        };

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-zinc-950 border border-zinc-800 shadow-2xl rounded-xl p-3.5 flex items-start space-x-3 text-xs animate-in slide-in-from-bottom-3 duration-200 text-zinc-200"
          >
            {icons[toast.type]}
            <div className="flex-1 truncate">
              <div className="font-semibold text-white truncate">
                {toast.title}
              </div>
              {toast.description && (
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  {toast.description}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-zinc-400 hover:text-white p-0.5 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
