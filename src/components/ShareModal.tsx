import React from 'react';
import { X, Link2, Copy, Check, Shield, Globe, Lock, Clock } from 'lucide-react';
import { FileItem, ShareSettings } from '../types';
import { formatBytes, formatDate } from '../lib/storage';
import { FileIcon } from './FileIcon';

interface ShareModalProps {
  item: FileItem | null;
  onClose: () => void;
  onSaveShareSettings: (itemId: string, settings: ShareSettings) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  item,
  onClose,
  onSaveShareSettings,
}) => {
  if (!item) return null;

  const existingSettings = item.shareSettings || {
    isShared: true,
    shareId: Math.random().toString(36).substring(2, 10),
    access: 'view',
    passwordProtected: false,
  };

  const [isShared, setIsShared] = React.useState(existingSettings.isShared ?? true);
  const [access, setAccess] = React.useState<'view' | 'edit'>(existingSettings.access || 'view');
  const [passwordProtected, setPasswordProtected] = React.useState(
    existingSettings.passwordProtected || false
  );
  const [password, setPassword] = React.useState(existingSettings.password || '');
  const [copied, setCopied] = React.useState(false);

  const shareUrl = `${window.location.origin}#share=${existingSettings.shareId || item.id}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleSave = () => {
    onSaveShareSettings(item.id, {
      isShared,
      shareId: existingSettings.shareId || Math.random().toString(36).substring(2, 10),
      access,
      passwordProtected,
      password: passwordProtected ? password : undefined,
    });
    onClose();
  };

  return (
    <div
      id="share-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="share-modal-card"
        className="w-full max-w-md bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-800 p-6 overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-950/60 border border-blue-900/60 flex items-center justify-center text-blue-400">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white truncate max-w-xs" title={item.name}>
                Share "{item.name}"
              </h3>
              <p className="text-xs text-zinc-400">
                {formatBytes(item.size)} • Uploaded {formatDate(item.createdAt)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 text-xs">
          {/* Share Link Field */}
          <div>
            <label className="block font-medium text-zinc-300 mb-1.5">
              Shareable Link
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full h-9 px-3 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-zinc-300 select-all focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`h-9 px-3.5 rounded-lg font-medium flex items-center space-x-1.5 shrink-0 transition-colors cursor-pointer ${
                  copied
                    ? 'bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-md shadow-blue-600/25'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Privacy Toggle */}
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Globe className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="font-medium text-white">
                    Link Access Status
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {isShared ? 'Anyone with link can access' : 'Link access is disabled'}
                  </div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
              />
            </div>

            {isShared && (
              <div className="pt-2 border-t border-zinc-800 space-y-3">
                {/* Password Protection */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <Lock className="w-4 h-4 text-amber-500" />
                    <div>
                      <div className="font-medium text-zinc-200">
                        Password Protect
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        Require a password to open this file
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={passwordProtected}
                    onChange={(e) => setPasswordProtected(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600 cursor-pointer"
                  />
                </div>

                {passwordProtected && (
                  <input
                    type="password"
                    placeholder="Set link password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-200 focus:outline-hidden focus:border-blue-500"
                  />
                )}
              </div>
            )}
          </div>
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
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-medium transition-colors shadow-md shadow-blue-600/25 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
