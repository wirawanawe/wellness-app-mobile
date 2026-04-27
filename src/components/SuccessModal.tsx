'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface SuccessModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  redirectPath?: string;
  autoRedirectSeconds?: number;
  autoRedirect?: boolean;
  onClose?: () => void;
}

export default function SuccessModal({
  isOpen,
  title,
  message,
  redirectPath = '/dashboard',
  autoRedirectSeconds = 3,
  autoRedirect = true,
  onClose,
}: SuccessModalProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(autoRedirectSeconds);

  useEffect(() => {
    if (!isOpen || !autoRedirect) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(redirectPath);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, autoRedirect, redirectPath, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl shadow-emerald-500/10 border border-emerald-50 flex flex-col items-center text-center animate-zoom-in">
        
        {/* Animated Checkmark Circle */}
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping" />
          <div className="relative w-full h-full bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg 
              className="w-12 h-12 text-white fill-none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{title}</h3>
        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 px-4">
          {message}
        </p>

        <div className="w-full space-y-3">
          <button
            onClick={() => {
              if (autoRedirect) {
                router.push(redirectPath);
              }
              if (onClose) onClose();
            }}
            className="btn-primary py-4 rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
          >
            {autoRedirect ? 'Kembali ke Dashboard' : 'Selesai'}
          </button>
          
          {autoRedirect && (
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              Otomatis kembali dalam <span className="text-emerald-600">{countdown}</span> detik
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
