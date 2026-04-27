'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyOtpPage() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [regData, setRegData] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem('reg_data');
    if (!data) {
      router.push('/register');
      return;
    }
    setRegData(JSON.parse(data));
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Masukkan 6 digit kode OTP');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...regData,
          otp
        })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.removeItem('reg_data');
        alert('Registrasi Berhasil! Silakan Login.');
        router.push('/login');
      } else {
        setError(data.error || 'Verifikasi gagal');
      }
    } catch (err) {
      setError('Koneksi ke server gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 bg-white relative overflow-hidden">
      <button 
        onClick={() => router.back()}
        className="absolute top-12 left-6 z-50 w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-transform shadow-sm"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="w-full max-w-sm text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifikasi Email</h1>
        <p className="text-slate-500 mb-8 text-sm">
          Masukkan 6 digit kode yang telah kami kirimkan ke <br/>
          <span className="font-bold text-slate-900">{regData?.email}</span>
        </p>

        <form onSubmit={handleVerify} className="space-y-6">
          <input
            type="text"
            maxLength={6}
            className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            required
          />

          {error && <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl border border-red-100">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary w-full py-4 shadow-lg shadow-emerald-500/20">
            {loading ? 'Memverifikasi...' : 'Verifikasi Akun'}
          </button>

          <button 
            type="button" 
            className="text-emerald-600 text-sm font-bold mt-4"
            onClick={() => {
              // Logic to resend OTP
              fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: regData.email })
              }).then(() => alert('OTP baru telah dikirim'));
            }}
          >
            Kirim Ulang Kode
          </button>
        </form>
      </div>
    </div>
  );
}
