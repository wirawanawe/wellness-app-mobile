'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

interface Article {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  image: string;
  source: string;
}

function ArticleSkeleton() {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm animate-pulse">
      <div className="h-48 bg-slate-50" />
      <div className="p-5 space-y-4">
        <div className="flex justify-between">
          <div className="h-4 bg-slate-100 rounded-lg w-20" />
          <div className="h-4 bg-slate-100 rounded-lg w-24" />
        </div>
        <div className="h-6 bg-slate-100 rounded-xl w-full" />
        <div className="h-4 bg-slate-100 rounded-lg w-5/6" />
        <div className="h-4 bg-slate-100 rounded-lg w-2/3" />
      </div>
    </div>
  );
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/health-articles');
      const d = await r.json();
      setArticles(d.articles || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

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
            <h1 className="text-xl font-bold text-slate-900">Semua Artikel</h1>
            <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Berita & Tips Kesehatan</p>
          </div>
          <button 
            onClick={fetchArticles}
            disabled={loading}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── CONTENT ────────────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 space-y-4 pb-28 animate-slide-up">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <ArticleSkeleton key={i} />)}
          </div>
        ) : articles.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-12 text-center shadow-sm">
            <span className="text-5xl block mb-4">📭</span>
            <p className="text-slate-900 font-bold text-lg">Belum Ada Artikel</p>
            <p className="text-slate-500 text-xs mt-2 font-medium">Coba refresh dalam beberapa saat untuk mendapatkan berita terbaru.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((a, i) => (
              <a 
                key={i} 
                href={a.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white border border-slate-100 rounded-3xl overflow-hidden block hover:shadow-xl transition-all duration-300 group shadow-sm"
              >
                {a.image ? (
                  <img src={a.image} alt={a.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="h-32 bg-slate-50 flex items-center justify-center">
                    <span className="text-4xl">📰</span>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100 uppercase tracking-wider">
                      {a.source}
                    </span>
                    <span className="text-slate-400 text-[10px] font-medium">
                      {new Date(a.pubDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                    </span>
                  </div>
                  <h3 className="text-slate-900 font-bold text-lg leading-tight mb-3 group-hover:text-emerald-600 transition-colors">{a.title}</h3>
                  <p className="text-slate-500 text-sm line-clamp-3 leading-relaxed mb-4">
                    {a.description}
                  </p>
                  <div className="flex items-center text-emerald-600 text-[11px] font-bold uppercase tracking-widest">
                    BACA SELENGKAPNYA 
                    <svg className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="dashboard" />
    </div>
  );
}
