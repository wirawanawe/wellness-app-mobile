'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PinGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isLocked, setIsLocked] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);

  // Pages that don't require PIN lock
  const publicPages = ['/login', '/register', '/forgot-password'];
  const isPublicPage = publicPages.includes(pathname);

  useEffect(() => {
    if (status === 'authenticated' && !isPublicPage) {
      const isEnabled = localStorage.getItem('pin_enabled') === 'true';
      const isUnlocked = sessionStorage.getItem('app_unlocked') === 'true';
      
      setPinEnabled(isEnabled);
      if (isEnabled && !isUnlocked) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    } else {
      setIsLocked(false);
    }
  }, [status, pathname, isPublicPage]);

  async function handleUnlock() {
    if (pinValue.length !== 6) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: session?.user?.email, 
          pin: pinValue 
        }),
      });

      if (res.ok) {
        sessionStorage.setItem('app_unlocked', 'true');
        setIsLocked(false);
        setPinValue('');
      } else {
        const data = await res.json();
        setError(data.error || 'PIN salah.');
        setPinValue('');
      }
    } catch (err) {
      setError('Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }

  if (isLocked) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-8 animate-fade-in">
        <div className="w-full max-w-xs text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-sm border border-emerald-100">
            🔒
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Aplikasi Terkunci</h2>
          <p className="text-sm text-slate-500 mb-10">Masukkan PIN Anda untuk melanjutkan</p>
          
          <div className="space-y-6">
            <input
              type="tel"
              maxLength={6}
              autoFocus
              value={pinValue}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                setPinValue(val);
                if (val.length === 6) {
                  // Small delay before auto-submit for better UX
                  setTimeout(() => {}, 100);
                }
              }}
              placeholder="••••••"
              className="w-full text-center text-4xl font-bold tracking-[0.5em] py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-emerald-500 focus:ring-0 transition-all outline-none"
            />

            {error && (
              <p className="text-red-500 text-sm font-medium animate-shake">{error}</p>
            )}

            <button
              onClick={handleUnlock}
              disabled={pinValue.length !== 6 || loading}
              className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/30 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Memverifikasi...' : 'Buka Kunci'}
            </button>
            
            <button
              onClick={() => {
                sessionStorage.clear();
                window.location.href = '/login';
              }}
              className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-4"
            >
              Ganti Akun
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
