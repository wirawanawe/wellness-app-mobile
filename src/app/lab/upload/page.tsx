'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import PageHeader from '@/components/PageHeader';

type UploadStatus = 'idle' | 'uploading' | 'error';

export default function LabUploadPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError('');
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }

  async function handleExtract() {
    if (!file) { setError('Pilih file terlebih dahulu.'); return; }
    
    setStatus('uploading');
    setError('');
    setProgress(0);

    // Simulate progress
    const timer = setInterval(() => setProgress((p) => Math.min(p + 12, 85)), 400);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/lab/extract', { method: 'POST', body: formData });
      clearInterval(timer);
      setProgress(100);

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ekstraksi gagal');

      // Save extracted parameters to session storage to be picked up by manual input page
      sessionStorage.setItem('extractedLabData', JSON.stringify(data.parameters || {}));
      
      // Redirect to manual input
      router.push('/lab/manual');
    } catch (e: unknown) {
      clearInterval(timer);
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
      setStatus('error');
    }
  }

  return (
    <div className="min-h-dvh flex flex-col pb-safe bg-[#f8fafc]">
      <PageHeader 
        title="Upload Hasil Lab" 
        subtitle="Ekstrak Parameter Otomatis" 
      />

      <div className="flex-1 px-4 space-y-5 pb-28 animate-slide-up">
        {/* Upload Area */}
        <div
          onClick={() => fileRef.current?.click()}
          className={`bg-white border-2 border-dashed p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all rounded-[2.5rem] shadow-sm ${
            file ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50'
          }`}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-48 rounded-2xl object-contain mb-4 shadow-md" />
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
              <svg className="w-10 h-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          )}
          {file ? (
            <>
              <p className="text-emerald-600 font-bold text-sm">{file.name}</p>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-2">{(file.size / 1024).toFixed(0)} KB — Ketuk untuk mengganti</p>
            </>
          ) : (
            <>
              <p className="text-slate-900 font-bold text-lg">Ketuk untuk upload</p>
              <p className="text-slate-400 text-xs mt-2 font-medium">PDF, JPG, PNG — Maks 10MB</p>
            </>
          )}
          <input
            ref={fileRef}
            id="lab-file-input"
            type="file"
            accept="image/*,.pdf"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* AI Info Banner */}
        <div className="flex items-start gap-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
          <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center flex-shrink-0 text-xl border border-violet-100 shadow-sm">
            🤖
          </div>
          <div>
            <p className="text-slate-900 text-sm font-bold">Analisis AI Otomatis</p>
            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-medium">
              Sistem kami akan mengekstrak parameter lab dari dokumen Anda secara otomatis. Anda dapat meninjau hasilnya sebelum menyimpannya.
            </p>
          </div>
        </div>

        {/* Progress Bar during upload */}
        {status === 'uploading' && (
          <div className="space-y-3 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
              <span className="text-slate-400 animate-pulse">Mengekstrak dokumen...</span>
              <span className="text-emerald-600">{progress}%</span>
            </div>
            <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-sm font-bold text-center">{error}</div>
        )}

        <button
          onClick={handleExtract}
          disabled={!file || status === 'uploading'}
          className={`btn-primary py-4 shadow-xl ${(!file || status === 'uploading') ? 'opacity-50 cursor-not-allowed' : 'shadow-emerald-500/20'}`}
        >
          {status === 'uploading' ? 'Mengekstrak Data...' : 'Ekstrak & Lanjut →'}
        </button>
      </div>

      <BottomNav active="lab" />
    </div>
  );
}
