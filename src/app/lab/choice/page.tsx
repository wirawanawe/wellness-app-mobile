'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import PageHeader from '@/components/PageHeader';

export default function LabChoicePage() {
  const router = useRouter();

  return (
    <div className="min-h-dvh flex flex-col pb-safe bg-[#f8fafc]">
      <PageHeader 
        title="Mulai Sehatmu!" 
        subtitle="Pemeriksaan Lab" 
      />

      <div className="flex-1 px-4 space-y-4 animate-slide-up">
        <Link href="/lab/upload" className="block bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl group-hover:bg-emerald-100 transition-colors">
              📄
            </div>
            <div className="flex-1">
              <h2 className="text-slate-900 font-bold text-lg">Upload Hasil Lab</h2>
              <p className="text-slate-500 text-xs mt-1">AI akan menganalisis dokumen hasil lab Anda secara otomatis.</p>
            </div>
            <div className="text-slate-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        <Link href="/lab/manual" className="block bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl group-hover:bg-blue-100 transition-colors">
              ✏️
            </div>
            <div className="flex-1">
              <h2 className="text-slate-900 font-bold text-lg">Isi Data Manual</h2>
              <p className="text-slate-500 text-xs mt-1">Masukkan parameter kesehatan Anda secara manual satu per satu.</p>
            </div>
            <div className="text-slate-300">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      <BottomNav active="lab" />
    </div>
  );
}
