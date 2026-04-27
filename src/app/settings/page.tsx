'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('biometric_enabled');
    setBiometricEnabled(saved === 'true');
  }, []);

  const toggleBiometric = () => {
    const newValue = !biometricEnabled;
    setBiometricEnabled(newValue);
    localStorage.setItem('biometric_enabled', String(newValue));
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
        
        {/* Keamanan Section */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
          <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Keamanan & Akses
          </p>
          
          <div className="space-y-1">
            {/* Biometric Toggle */}
            <div className="flex items-center justify-between py-4 border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                  <img src="/fingerprint.png" alt="Fingerprint" className="w-6 h-6 object-contain" />
                </div>
                <div>
                  <p className="text-slate-900 text-sm font-bold leading-tight">Login Biometrik</p>
                  <p className="text-slate-400 text-[10px] font-medium">Gunakan FaceID / Fingerprint</p>
                </div>
              </div>
              <button 
                onClick={toggleBiometric}
                className={`w-12 h-6 rounded-full transition-all relative ${biometricEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${biometricEnabled ? 'right-1' : 'left-1'}`} />
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

      <BottomNav active="profile" />
    </div>
  );
}
