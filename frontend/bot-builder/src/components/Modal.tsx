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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.3)] max-w-md w-full mx-4 overflow-hidden animate-[fadeInUp_0.3s_ease-out]">
        {/* Gradient accent in top left */}
        <div
          className="absolute top-0 left-0 w-48 h-48 opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at top left, rgba(255, 120, 40, 0.4) 0%, transparent 70%)',
          }}
        />

        {/* Close button with gradient */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[100] transition-all duration-200 hover:scale-110 cursor-pointer"
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ pointerEvents: 'none' }}>
            <defs>
              <linearGradient id="closeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff5a1e" />
                <stop offset="100%" stopColor="#ff7828" />
              </linearGradient>
            </defs>
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="url(#closeGradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="p-8 text-center relative z-10">
          <h2 className="text-2xl font-semibold mb-3 modal-title">
            {title}
          </h2>
          {message && (
            <p className="text-sm leading-relaxed mb-6 modal-message">
              {message}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleConfirm}
              className="w-full px-6 py-3.5 rounded-full font-medium transition-all duration-200 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 90, 30, 0.8) 0%, rgba(255, 120, 40, 0.8) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              <span
                className="font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #ff5a1e 0%, #ff7828 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {confirmText}
              </span>
            </button>
            {type === 'confirm' && (
              <button
                onClick={onClose}
                className="w-full px-6 py-2.5 text-sm transition-all duration-200 hover:scale-[1.02]"
              >
                <span
                  style={{
                    background: 'linear-gradient(135deg, #ff5a1e 0%, #ff7828 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {cancelText}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
