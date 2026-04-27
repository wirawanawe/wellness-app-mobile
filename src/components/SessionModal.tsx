'use client';
import { useRouter } from 'next/navigation';

interface SessionModalProps {
  isOpen: boolean;
}

export default function SessionModal({ isOpen }: SessionModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 shadow-2xl border border-red-50 flex flex-col items-center text-center animate-zoom-in">
        
        {/* Warning Icon */}
        <div className="relative w-24 h-24 mb-6">
          <div className="absolute inset-0 bg-red-500/10 rounded-full animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/20">
            <svg 
              className="w-12 h-12 text-white fill-none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Sesi Berakhir</h3>
        <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 px-4">
          Session telah habis, silahkan lakukan login jika ingin melanjutkan program.
        </p>

        <div className="w-full">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-slate-900/20 active:scale-95 transition-transform uppercase"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
