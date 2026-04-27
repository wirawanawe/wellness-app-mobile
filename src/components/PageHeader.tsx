'use client';
import { useRouter } from 'next/navigation';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
}

export default function PageHeader({ title, subtitle, showBack = true }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="relative px-5 pt-14 pb-8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent" />
      <div className="relative z-10">
        {showBack && (
          <button 
            onClick={() => router.back()}
            className="mb-4 w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-transform shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {subtitle && <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-[0.2em]">{subtitle}</p>}
        <h1 className="text-3xl font-bold text-slate-900 mt-1 leading-tight">{title}</h1>
      </div>
    </div>
  );
}
