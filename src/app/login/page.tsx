'use client';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import Link from 'next/link';
import Image from 'next/image';
import logo from '@/../public/logo.png';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [pinEnabled, setPinEnabled] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValue, setPinValue] = useState('');

  useEffect(() => {
    // Check if email was saved from last login to check PIN status
    const savedEmail = localStorage.getItem('last_login_email');
    if (savedEmail) {
      setEmail(savedEmail);
      checkPinStatus(savedEmail);
    }
  }, []);

  async function checkPinStatus(emailAddr: string) {
    try {
      const res = await fetch(`/api/pin/check?email=${emailAddr}`);
      const data = await res.json();
      setPinEnabled(data.enabled);
    } catch (error) {
      console.error('Error checking PIN:', error);
    }
  }

  // Check PIN status when email field loses focus
  function handleEmailBlur() {
    if (email && email.includes('@')) {
      checkPinStatus(email);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (res?.error) {
      setError('Email atau password salah. Silakan coba lagi.');
    } else {
      localStorage.setItem('last_login_email', email);
      sessionStorage.setItem('app_unlocked', 'true');
      router.push('/dashboard');

    }
  }

  async function handlePinLogin() {
    if (pinValue.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      const verifyRes = await fetch('/api/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin: pinValue }),
      });

      if (verifyRes.ok) {
        const { user } = await verifyRes.json();
        const res = await signIn('credentials', {
          isPin: 'true',
          userId: user.id,
          redirect: false,
        });

        if (res?.ok) {
          localStorage.setItem('last_login_email', email);
          sessionStorage.setItem('app_unlocked', 'true');
          router.push('/dashboard');
        } else {

          setError('Gagal masuk dengan PIN.');
        }
      } else {
        const data = await verifyRes.json();
        setError(data.error || 'PIN salah.');
      }
    } catch (err) {
      setError('Terjadi kesalahan.');
    } finally {
      setLoading(false);
      setShowPinModal(false);
      setPinValue('');
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden bg-white">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-sm relative animate-slide-up">
        <div className="flex flex-col items-center mb-10">
          <div className="mb-6">
            <Image src={logo} alt="Wellness Logo" className="h-24 w-auto object-contain" priority unoptimized />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Wellness App</h1>
          <p className="text-slate-500 text-sm mt-1">Platform Kesehatan Terpadu</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white border border-slate-100 shadow-2xl rounded-3xl p-8 space-y-6">
          <div>
            <label className="block text-sm text-slate-600 mb-2 font-semibold">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleEmailBlur}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-2 font-semibold">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none pr-12"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1"
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-500 text-sm">{error}</div>}

          <button type="submit" className="btn-primary w-full py-4 rounded-2xl font-bold" disabled={loading}>
            {loading ? 'Masuk...' : 'Masuk'}
          </button>

          {pinEnabled && (
            <button
              type="button"
              onClick={() => setShowPinModal(true)}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-100 transition-all"
            >
              🔢 Masuk dengan PIN
            </button>
          )}

          <p className="text-center text-sm text-slate-500">
            Belum punya akun? <Link href="/register" className="text-emerald-600 font-bold">Daftar</Link>
          </p>
        </form>
      </div>

      {/* PIN Login Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xs rounded-[2rem] p-8 shadow-2xl animate-scale-up">
            <h3 className="text-center font-bold text-slate-900 mb-2">Masuk dengan PIN</h3>
            <p className="text-center text-slate-500 text-[11px] mb-8">Masukkan 6 digit kode keamanan Anda</p>
            
            <input
              type="tel"
              maxLength={6}
              autoFocus
              value={pinValue}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                setPinValue(val);
                if (val.length === 6) {
                  // Auto-submit could go here but let's keep it manual for clarity first
                }
              }}
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
                onClick={handlePinLogin}
                disabled={pinValue.length !== 6 || loading}
                className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold disabled:opacity-50"
              >
                {loading ? '...' : 'Masuk'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
