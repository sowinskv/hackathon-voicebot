import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'confirm' | 'success';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white/[0.05] backdrop-blur-2xl border border-white/[0.15] rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.4)] max-w-md w-full overflow-hidden animate-[fadeInUp_0.3s_ease-out]">
        {/* Subtle gradient overlay */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at top center, rgba(255, 255, 255, 0.1) 0%, transparent 70%)',
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-[100] text-white/60 hover:text-white transition-all duration-200 hover:scale-110 cursor-pointer"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-10 text-center relative z-10">
          <h2 className="text-3xl font-light text-white mb-4 tracking-tight">
            {title}
          </h2>
          {message && (
            <p className="text-base leading-relaxed text-white/60 font-light mb-8">
              {message}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleConfirm}
              className="w-full px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 text-white font-light transition-all duration-200"
            >
              {confirmText}
            </button>
            {type === 'confirm' && (
              <button
                onClick={onClose}
                className="w-full px-6 py-3 rounded-xl bg-transparent hover:bg-white/5 text-white/60 hover:text-white/80 font-light transition-all duration-200"
              >
                {cancelText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
