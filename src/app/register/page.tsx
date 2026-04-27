'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import logo from '@/../public/logo.png';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    ktp_number: '',
    employee_id: '',
    password: '',
    confirmPassword: '',
    role: 'umum',
    company_code: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    if (formData.role === 'karyawan' && !formData.company_code) {
      setError('Kode perusahaan wajib diisi untuk karyawan');
      return;
    }

    if (formData.role === 'karyawan' && !formData.employee_id) {
      setError('Kode pegawai wajib diisi untuk karyawan');
      return;
    }

    if (!formData.ktp_number) {
      setError('Nomor KTP wajib diisi');
      return;
    }

    if (!agreedToTerms) {
      setError('Anda harus menyetujui Syarat & Ketentuan');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          ktp_number: formData.ktp_number,
          employee_id: formData.employee_id,
          password: formData.password,
          role: formData.role,
          company_code: formData.company_code
        })
      });

      const data = await res.json();
      if (res.ok) {
        // Store registration data temporarily to be used in OTP verification
        localStorage.setItem('reg_data', JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          ktp_number: formData.ktp_number,
          employee_id: formData.employee_id,
          password: formData.password,
          role: formData.role,
          company_code: formData.company_code
        }));
        router.push('/verify-otp');
      } else {
        setError(data.error || 'Terjadi kesalahan saat registrasi');
      }
    } catch (err) {
      setError('Koneksi ke server gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden bg-white text-slate-200">
      <button 
        onClick={() => router.back()}
        className="absolute top-12 left-6 z-50 w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-transform shadow-sm"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-sm relative animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <Image src={logo} alt="Logo" className="h-20 w-auto object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Buat Akun</h1>
          <p className="text-slate-500 text-sm mt-1">Daftar untuk akses Wellness PHC</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-100 shadow-2xl rounded-3xl p-8 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Tipe Pendaftaran</label>
            <div className="flex gap-4">
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="role" value="umum" checked={formData.role === 'umum'} onChange={e => setFormData({...formData, role: e.target.value})} className="peer sr-only" />
                <div className="w-full text-center py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold peer-checked:bg-emerald-50 peer-checked:text-emerald-600 peer-checked:border-emerald-200 transition-all">
                  Umum
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="role" value="karyawan" checked={formData.role === 'karyawan'} onChange={e => setFormData({...formData, role: e.target.value})} className="peer sr-only" />
                <div className="w-full text-center py-2.5 rounded-2xl border border-slate-200 text-slate-600 font-bold peer-checked:bg-indigo-50 peer-checked:text-indigo-600 peer-checked:border-indigo-200 transition-all">
                  Karyawan
                </div>
              </label>
            </div>
          </div>

          {formData.role === 'karyawan' && (
            <div className="animate-slide-up grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Kode Perusahaan</label>
                <input
                  type="text" required={formData.role === 'karyawan'} className="w-full px-4 py-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-indigo-300"
                  placeholder="Kode Perusahaan"
                  value={formData.company_code} onChange={e => setFormData({...formData, company_code: e.target.value.toUpperCase()})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Kode Pegawai</label>
                <input
                  type="text" required={formData.role === 'karyawan'} className="w-full px-4 py-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-indigo-300"
                  placeholder="Kode Pegawai"
                  value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Nama Lengkap</label>
            <input
              type="text" required className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              placeholder="Masukkan nama lengkap"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">No. KTP</label>
              <input
                type="text" required className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                placeholder="16 digit NIK"
                value={formData.ktp_number} onChange={e => setFormData({...formData, ktp_number: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">No. Handphone</label>
              <input
                type="tel" required className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                placeholder="0812xxxxxx"
                value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Email</label>
            <input
              type="email" required className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              placeholder="nama@email.com"
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Password</label>
              <input
                type="password" required className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                placeholder="••••••"
                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Konfirmasi</label>
              <input
                type="password" required className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                placeholder="••••••"
                value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
              />
            </div>
          </div>
          
          <div className="px-1 flex items-start gap-3 mt-2">
            <div className="relative flex items-center">
              <input
                id="terms"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border border-slate-200 bg-slate-50 transition-all checked:bg-emerald-500 checked:border-emerald-500"
              />
              <svg
                className="absolute h-3.5 w-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 left-0.5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <label htmlFor="terms" className="text-[11px] text-slate-500 leading-relaxed cursor-pointer select-none">
              Saya setuju dengan <Link href="/terms" className="text-emerald-600 font-bold hover:underline">Syarat & Ketentuan</Link> aplikasi Wellness PHC terkait penggunaan data pribadi dan data medis.
            </label>
          </div>

          {error && <div className="bg-red-50 text-red-500 text-xs p-3 rounded-xl border border-red-100">{error}</div>}

          <button type="submit" disabled={loading} className="btn-primary w-full py-4 shadow-lg shadow-emerald-500/20">
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>

          <p className="text-center text-sm text-slate-500 mt-4">
            Sudah punya akun? <Link href="/login" className="text-emerald-600 font-bold">Masuk</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
