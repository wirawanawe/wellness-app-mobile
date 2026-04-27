'use client';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import logo from '@/../public/logo.png';
import fingerprint from '@/../public/fingerprint.png';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    const enabled = localStorage.getItem('biometric_enabled') === 'true';
    setBiometricEnabled(enabled);
  }, []);

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
      router.push('/dashboard');
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden bg-white">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-sm relative animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="mb-6">
            <Image
              src={logo}
              alt="Wellness Logo"
              className="h-30 w-auto object-contain"
              priority
              unoptimized
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Wellness App</h1>
          <p className="text-slate-500 text-sm mt-1">Platform Kesehatan Terpadu</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-white border border-slate-100 shadow-2xl rounded-3xl p-8 space-y-6">
          <div>
            <label className="block text-sm text-slate-600 mb-2 font-semibold">Email</label>
            <input
              id="login-email"
              type="email"
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-2 font-semibold">Password</label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 pr-12"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268-2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-500 text-sm">
              {error}
            </div>
          )}

          <button id="login-submit" type="submit" className="btn-primary" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Masuk...
              </span>
            ) : 'Masuk'}
          </button>

          {biometricEnabled && (
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                // Simulasi Delay Biometrik
                await new Promise(r => setTimeout(r, 1000));
                const savedEmail = localStorage.getItem('last_login_email');
                if (savedEmail) {
                  alert('Otentikasi Biometrik Berhasil (Simulasi)');
                  router.push('/dashboard');
                } else {
                  setError('Harap login manual terlebih dahulu sekali untuk mendaftarkan biometrik.');
                  setLoading(false);
                }
              }}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-100 transition-all active:scale-[0.98]"
            >
              <Image
                src={fingerprint}
                alt="Wellness Logo"
                className="h-10 w-auto object-contain"
                priority
                unoptimized
              />
              Masuk dengan Biometrik
            </button>
          )}

          <p className="text-center text-sm text-slate-500 mt-4">
            Belum punya akun? <Link href="/register" className="text-emerald-600 font-bold">Daftar</Link>
          </p>

        </form>
      </div>
    </div>
  );
}
