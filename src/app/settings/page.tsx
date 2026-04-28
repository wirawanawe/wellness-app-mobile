'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [pinEnabled, setPinEnabled] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const email = session?.user?.email;

  useEffect(() => {
    if (!email) return;
    fetch(`/api/pin/check?email=${email}`)
      .then(r => r.json())
      .then(d => setPinEnabled(d.enabled))
      .catch(console.error);
  }, [email]);

  const handlePinSetup = async () => {
    if (pinValue.length !== 6) {
      setMsg('PIN harus 6 digit angka.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/pin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinValue }),
      });
      if (res.ok) {
        setPinEnabled(true);
        setShowPinModal(false);
        setPinValue('');
        setMsg('PIN Berhasil diaktifkan!');
        localStorage.setItem('pin_enabled', 'true');
        sessionStorage.setItem('app_unlocked', 'true');

      } else {
        setMsg('Gagal mengatur PIN.');
      }
    } catch (error) {
      setMsg('Terjadi kesalahan.');
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const handleDisablePin = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pin/disable', { method: 'POST' });
      if (res.ok) {
        setPinEnabled(false);
        setMsg('PIN dinonaktifkan.');
        localStorage.removeItem('pin_enabled');
      }
    } catch {
      setMsg('Gagal menonaktifkan PIN.');
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col pb-safe bg-[#f8fafc]">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="relative px-5 pt-14 pb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent" />
        <div className="relative flex items-center gap-3">
          <Link href="/dashboard" className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">Pengaturan</h1>
            <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Aplikasi & Keamanan</p>
          </div>
        </div>
      </div>

      {/* ── CONTENT ────────────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 space-y-4 animate-slide-up">
        
        {msg && (
          <div className={`p-4 rounded-2xl text-sm font-bold text-center ${msg.includes('Berhasil') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
            {msg}
          </div>
        )}

        {/* Keamanan Section */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
          <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Keamanan & Akses
          </p>
          
          <div className="space-y-1">
            {/* PIN Toggle */}
            <div className="flex items-center justify-between py-4 border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl">
                  🔢
                </div>
                <div>
                  <p className="text-slate-900 text-sm font-bold leading-tight">Otentikasi PIN</p>
                  <p className="text-slate-400 text-[10px] font-medium">Gunakan 6 digit angka untuk masuk</p>
                </div>
              </div>
              <button 
                onClick={() => pinEnabled ? handleDisablePin() : setShowPinModal(true)}
                disabled={loading}
                className={`w-12 h-6 rounded-full transition-all relative ${pinEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${pinEnabled ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            {/* Change Password Link */}
            <Link href="/profile/change-password" title="Ganti Password">
              <div className="flex items-center justify-between py-4 group active:bg-slate-50 transition-colors rounded-xl -mx-2 px-2">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl group-hover:bg-emerald-50 transition-colors">
                    🔑
                  </div>
                  <div>
                    <p className="text-slate-900 text-sm font-bold leading-tight">Ganti Password</p>
                    <p className="text-slate-400 text-[10px] font-medium">Perbarui kata sandi akun Anda</p>
                  </div>
                </div>
                <svg className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
          <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Lainnya
          </p>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Versi Aplikasi</span>
              <span className="text-slate-900 font-bold">v1.2.0-phc</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Pembaruan Terakhir</span>
              <span className="text-slate-900 font-bold">24 Apr 2026</span>
            </div>
          </div>
        </div>

      </div>

      {/* PIN Setup Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-xs rounded-[2rem] p-8 shadow-2xl animate-scale-up">
            <h3 className="text-center font-bold text-slate-900 mb-2">Atur PIN Keamanan</h3>
            <p className="text-center text-slate-500 text-[11px] mb-8">Masukkan 6 digit angka untuk keamanan tambahan</p>
            
            <input
              type="tel"
              maxLength={6}
              autoFocus
              value={pinValue}
              onChange={e => setPinValue(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 bg-slate-50 border border-slate-200 rounded-2xl mb-8 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
            />
            
            <div className="flex gap-4">
              <button 
                onClick={() => { setShowPinModal(false); setPinValue(''); }}
                className="flex-1 py-3 text-sm font-bold text-slate-400"
              >
                Batal
              </button>
              <button 
                onClick={handlePinSetup}
                disabled={pinValue.length !== 6 || loading}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {loading ? '...' : 'Aktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="profile" />
    </div>
  );
}
