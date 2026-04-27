'use client';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'primary';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Ya, Hapus',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  variant = 'primary',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl flex flex-col items-center text-center animate-zoom-in border border-slate-50">
        
        {/* Icon Circle */}
        <div className={`w-20 h-20 mb-6 rounded-full flex items-center justify-center shadow-lg ${
          variant === 'danger' 
            ? 'bg-red-50 text-red-500 shadow-red-500/10' 
            : 'bg-emerald-50 text-emerald-500 shadow-emerald-500/10'
        }`}>
          {variant === 'danger' ? (
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          ) : (
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{title}</h3>
        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 px-4">
          {message}
        </p>

        <div className="w-full flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className={`w-full py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all ${
              variant === 'danger'
                ? 'bg-red-500 text-white shadow-red-500/20'
                : 'bg-emerald-500 text-white shadow-emerald-500/20'
            }`}
          >
            {confirmText}
          </button>
          
          <button
            onClick={onCancel}
            className="w-full py-4 rounded-2xl font-bold text-sm text-slate-400 hover:text-slate-600 transition-colors active:scale-95"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
