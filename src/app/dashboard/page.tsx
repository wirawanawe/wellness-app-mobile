'use client';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import ConfirmModal from '@/components/ConfirmModal';

// ─── Types ───────────────────────────────────────────────────────────────────
interface LabResult { status: string; created_at: string; id: number }
interface Program { status: string; target_durasi_program: number; start_date: string; doctor_name?: string }
interface Article { title: string; link: string; description: string; pubDate: string; image: string; source: string }
interface PatientProgram {
  id: number;
  user_id: number;
  patient_name: string;
  patient_email: string;
  company_name: string;
  status: string;
  lab_status: string;
  target_durasi_program: number;
}
interface DashboardData {
  latestLab: LabResult | null;
  activeProgram: Program | null;
  progressPercent: number;
  daysElapsed: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getGreeting(): { text: string; emoji: string } {
  const hour = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })).getHours();
  if (hour >= 5 && hour < 11) return { text: 'Selamat Pagi', emoji: '🌅' };
  if (hour >= 11 && hour < 15) return { text: 'Selamat Siang', emoji: '☀️' };
  if (hour >= 15 && hour < 19) return { text: 'Selamat Sore', emoji: '🌇' };
  return { text: 'Selamat Malam', emoji: '🌙' };
}

function formatDate(): string {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
}

const statusConfig = {
  ideal: { label: 'Kondisi Ideal ✓', color: 'badge-ideal', icon: '💚', bg: 'from-emerald-500/20 to-teal-500/10', border: 'border-emerald-500/30' },
  needs_program: { label: 'Perlu Program', color: 'badge-needs-program', icon: '⚠️', bg: 'from-amber-500/20 to-orange-500/10', border: 'border-amber-500/30' },
  pending: { label: 'Sedang Diproses', color: 'badge-pending', icon: '🔄', bg: 'from-indigo-500/20 to-purple-500/10', border: 'border-indigo-500/30' },
  processing: { label: 'Sedang Diproses', color: 'badge-pending', icon: '🔄', bg: 'from-indigo-500/20 to-purple-500/10', border: 'border-indigo-500/30' },
};

const CALCS = [
  { href: '/health-calc?tab=bmi', icon: '⚖️', label: 'BMI', color: 'from-emerald-500/20 to-teal-500/10' },
  { href: '/health-calc?tab=water', icon: '💧', label: 'Air Harian', color: 'from-blue-500/20 to-cyan-500/10' },
  { href: '/health-calc?tab=calorie', icon: '🔥', label: 'Kalori', color: 'from-orange-500/20 to-red-500/10' },
];

// ─── Progress Ring (SVG) ─────────────────────────────────────────────────────
function ProgressRing({ pct }: { pct: number }) {
  const r = 52, circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg className="progress-ring w-32 h-32 -rotate-90" viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="10" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="url(#prog)" strokeWidth="10"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
      <defs>
        <linearGradient id="prog" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Article Card Skeleton ───────────────────────────────────────────────────
function ArticleSkeleton() {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden flex-shrink-0 w-64 animate-pulse shadow-sm">
      <div className="h-32 bg-slate-50" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-100 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [patients, setPatients] = useState<PatientProgram[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<string>('Memuat lokasi...');
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [ads, setAds] = useState<{ id: number; title: string; image_url: string; link_url: string }[]>([]);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  const userId = (session?.user as { id?: string })?.id;
  const userRole = (session?.user as { role?: string })?.role;
  const greeting = getGreeting();
  const firstName = session?.user?.name?.split(' ')[0] || 'Tamu';

  // ── Fetch articles ──────────────────────────────────────────────────────────
  const fetchArticles = async () => {
    setArticlesLoading(true);
    try {
      const r = await fetch('/api/health-articles');
      const d = await r.json();
      setArticles(d.articles || []);
    } catch (e) {
      console.error(e);
    } finally {
      setArticlesLoading(false);
    }
  };

  // ── Fetch location ──────────────────────────────────────────────────────────
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      setLocation(prev => prev === 'Memuat lokasi...' ? 'Lokasi PHC' : prev);
    }, 10000);

    const fetchIPLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const d = await res.json();
        if (d.city) {
          setLocation(`${d.city}, ${d.region_code || ''}`);
        } else {
          const res2 = await fetch('https://ip-api.com/json/');
          const d2 = await res2.json();
          setLocation(d2.city || 'Surabaya, Jawa Timur');
        }
      } catch {
        setLocation('Surabaya, Jawa Timur');
      }
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        clearTimeout(safetyTimeout);
        try {
          const { latitude, longitude } = pos.coords;
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=id`, {
            headers: { 'User-Agent': 'WellnessApp/1.0' }
          });
          const d = await r.json();
          const addr = d.address || {};
          const city = addr.city || addr.town || addr.regency || addr.municipality || addr.city_district || addr.county || addr.state || '';

          if (city) {
            setLocation(city);
          } else if (d.display_name) {
            setLocation(d.display_name.split(',')[0]);
          } else {
            setLocation('Surabaya, Jawa Timur');
          }
        } catch (err) {
          fetchIPLocation();
        }
      },
      (err) => {
        clearTimeout(safetyTimeout);
        fetchIPLocation();
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
    return () => clearTimeout(safetyTimeout);
  }, []);

  // ── Fetch dashboard data ────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchDashboard() {
      try {
        // Fetch Ads from the new ads table (PUBLIC)
        try {
          const adRes = await fetch('/api/ads');
          if (adRes.ok) {
            const adData = await adRes.json();
            setAds(adData.ads?.filter((a: any) => a.is_active === 1) || []);
          }
        } catch (err) {
          console.error('Failed to fetch ads:', err);
        }

        if (userId) {
          // Fetch unread notifications count
          try {
            const nres = await fetch('/api/notifications');
            if (nres.ok) {
              const ndata = await nres.json();
              setUnreadNotifCount(ndata.unreadCount || 0);
            }
          } catch (err) {
            console.error('Failed to fetch notifications:', err);
          }

          if (userRole === 'dokter') {
            const res = await fetch('/api/programs');
            const d = await res.json();
            setPatients(d.programs || []);
          } else {
            const [labRes, progRes] = await Promise.all([
              fetch('/api/lab/results/latest'),
              fetch(`/api/program/${userId}`),
            ]);
            const labData = labRes.ok ? await labRes.json() : {};
            const progData = progRes.ok ? await progRes.json() : {};
            setData({
              latestLab: labData.labResult || null,
              activeProgram: progData.program || null,
              progressPercent: progData.progressPercent || 0,
              daysElapsed: progData.daysElapsed || 0,
            });
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
    fetchArticles();
  }, [userId, userRole]);

  const labStatus = data?.latestLab?.status as keyof typeof statusConfig | undefined;
  const statusInfo = labStatus ? statusConfig[labStatus] : null;

  return (
    <div className="min-h-dvh flex flex-col pb-safe bg-[#f8fafc]">

      {/* ── HERO HEADER ────────────────────────────────────────────────────── */}
      <div className="relative px-5 pt-14 pb-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-b-[2.5rem]">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent" />
        </div>

        <div className="relative flex items-start justify-between z-10">
          <div className="flex-1 min-w-0">
            <p className="text-emerald-600 text-sm font-semibold flex items-center gap-1.5">
              <span>{greeting.emoji}</span> {greeting.text}{userRole === 'dokter' ? '' : userId ? '' : 'Pejuang Sehat'}!
            </p>
            {userId ? (
              <h1 className="text-3xl font-bold text-slate-900 mt-0.5 leading-tight">
                {userRole === 'dokter' ? 'dr. ' : ''}{firstName} <span className="wave inline-block">👋</span>
              </h1>
            ) : (
              <Link href="/login" className="block group mt-0.5">
                <h1 className="text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight">
                  Yuk, Login Sekarang! <span className="inline-block animate-bounce">👉</span>
                </h1>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Dapatkan akses penuh fitur Wellness PHC</p>
              </Link>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate()}
              </span>
              <span className="flex items-center gap-1 text-slate-500 text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {location}
              </span>
            </div>
          </div>

          {userId && (
            <div className="relative flex items-center gap-2">
              <Link href="/notifications" className="relative w-11 h-11 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 active:scale-90 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-4 border-white rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-lg shadow-red-500/20">
                    {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex-shrink-0 group relative z-50 focus:outline-none"
              >
                <div className={`w-11 h-11 rounded-full bg-gradient-to-br from-violet-500/40 to-indigo-500/40 border-2 transition-all shadow-lg flex items-center justify-center text-white font-bold text-sm ${dropdownOpen ? 'border-emerald-400 scale-110' : 'border-violet-500/40 group-hover:scale-110'}`}>
                  {session?.user?.image
                    ? <img src={session.user.image} alt="profile" className="w-full h-full rounded-full object-cover" />
                    : (session?.user?.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('') || '?')
                  }
                </div>
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-100 shadow-2xl z-50 overflow-hidden animate-slide-up origin-top-right rounded-2xl">
                    <div className="p-2 space-y-1">
                      <Link href="/profile" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors" onClick={() => setDropdownOpen(false)}>
                        <span className="text-xl">👤</span>
                        <span className="text-sm font-semibold">Buka Profil</span>
                      </Link>
                      <Link href="/settings" className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors" onClick={() => setDropdownOpen(false)}>
                        <span className="text-xl">⚙️</span>
                        <span className="text-sm font-semibold">Pengaturan</span>
                      </Link>
                      <button onClick={() => {
                        localStorage.setItem('manual_logout', 'true');
                        signOut({ callbackUrl: '/login' });
                      }} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-left">
                        <span className="text-xl">🚪</span>
                        <span className="text-sm font-semibold">Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 space-y-8 pb-32">
        {/* ── PROGRAM SECTION ──────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-slate-900 text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              Program Wellness
            </p>
          </div>

          {loading ? (
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col items-center gap-4 animate-pulse">
              <div className="w-16 h-16 rounded-full bg-slate-50" />
              <div className="h-4 bg-slate-50 rounded w-1/2" />
            </div>
          ) : userRole === 'dokter' ? (
            <div className="space-y-4">
              {patients.length > 0 ? (
                patients.map(p => (
                  <div key={p.id} className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${p.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                        ● {p.status}
                      </span>
                      <span className="text-slate-400 text-[10px] font-bold">{p.company_name}</span>
                    </div>
                    <p className="text-slate-900 font-bold">{p.patient_name}</p>
                    <p className="text-slate-500 text-xs mt-1">{p.patient_email}</p>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Target: {p.target_durasi_program} Hari</div>
                      <Link href={`/patients/${p.user_id}`} className="text-emerald-600 text-xs font-black uppercase tracking-widest">Detail →</Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-[2.5rem]">
                  <p className="text-slate-400 text-sm font-medium">Belum ada pasien aktif</p>
                </div>
              )}
            </div>
          ) : (
            /* ── EMPLOYEE DASHBOARD ── */
            <>
              {data?.activeProgram ? (
                data.activeProgram.status === 'requested' ? (
                  <div className="bg-white border border-amber-100 rounded-[2.5rem] p-6 shadow-sm bg-gradient-to-br from-amber-50/50 to-orange-50/20">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">⏳</div>
                      <div>
                        <p className="text-amber-700 font-black text-lg leading-tight">Menunggu Konfirmasi</p>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-widest border border-amber-200">Permintaan Diproses</span>
                      </div>
                    </div>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed mb-5">
                      Permintaan Anda sedang diproses oleh <span className="font-bold text-slate-700">dr. {data.activeProgram.doctor_name || 'Dokter'}</span>. Mohon menunggu konfirmasi, atau Anda dapat membatalkan permohonan ini.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowConfirmCancel(true)}
                        className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 hover:text-red-500 hover:border-red-200 transition-all active:scale-[0.98]"
                      >
                        Batalkan
                      </button>
                      <Link
                        href="/lab/manual"
                        className="flex-1 py-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 text-xs font-bold text-center hover:bg-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <span>📝</span> Edit Hasil Lab
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm shadow-slate-200/50">
                    <div className="flex items-center gap-5">
                      <div className="relative flex-shrink-0 flex items-center justify-center">
                        <ProgressRing pct={data.progressPercent} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-2xl font-bold text-slate-900">{data.progressPercent}%</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">selesai</p>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">● Aktif</span>
                        </div>
                        <p className="text-slate-900 font-bold">Wellness Journey</p>
                        <p className="text-slate-500 text-sm">Hari ke-{data.daysElapsed} dari {data.activeProgram.target_durasi_program}</p>
                        <Link href="/program" className="inline-flex items-center gap-1 text-emerald-600 text-sm font-bold mt-2 hover:underline">
                          Lihat target hari ini →
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              ) : data?.latestLab?.status === 'needs_program' ? (
                <div className="bg-white border border-amber-100 rounded-[2.5rem] p-7 shadow-sm bg-gradient-to-br from-amber-50/50 to-orange-50/20">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">⚠️</div>
                    <div>
                      <p className="text-amber-700 font-black text-lg leading-tight">Butuh Program!</p>
                      <p className="text-slate-500 text-[11px] mt-1 font-medium leading-relaxed">Hasil lab Anda memerlukan tindakan. Pilih dokter untuk memulai program.</p>
                    </div>
                  </div>
                  <Link href="/program/select-doctor" className="btn-primary text-center block py-4 text-sm rounded-2xl shadow-lg shadow-amber-500/20">
                    Pilih Dokter Sekarang →
                  </Link>
                </div>
              ) : !data?.latestLab ? (
                <Link href="/lab/choice" className="block bg-white border border-emerald-100 rounded-[2.5rem] p-7 shadow-sm bg-gradient-to-br from-emerald-500/50 to-teal-50/20 active:scale-[0.98] transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-[1.5rem] bg-emerald-100 flex items-center justify-center flex-shrink-0 text-3xl shadow-inner border border-white group-hover:scale-110 transition-transform">🩺</div>
                    <div className="flex-1">
                      <p className="text-slate-900 font-black text-lg leading-tight">Mulai Sehatmu!</p>
                      <p className="text-slate-500 text-[11px] mt-1 font-medium leading-relaxed">Upload hasil MCU atau isi data manual untuk memulai program wellness.</p>
                      <p className="text-emerald-600 text-[10px] mt-3 font-black uppercase tracking-widest flex items-center gap-1">
                        Mulai Sekarang
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                        </svg>
                      </p>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className={`bg-white border border-slate-100 rounded-[2.5rem] p-7 shadow-sm bg-gradient-to-br ${statusInfo?.bg || ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm border border-slate-100/50">
                        {statusInfo?.icon}
                      </div>
                      <div>
                        <p className="text-slate-900 font-black text-lg leading-tight">Hasil Lab Anda</p>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                          {new Date(data.latestLab.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${statusInfo?.border || ''} ${statusInfo?.color || ''} bg-white/50 backdrop-blur-sm`}>
                      {statusInfo?.label}
                    </div>
                  </div>
                  {labStatus === 'ideal' && (
                    <Link href="/program/select-doctor" className="mt-5 btn-primary text-center block py-3 text-sm rounded-2xl shadow-lg shadow-emerald-500/20">
                      Mulai Program Pencegahan →
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </section>

        {/* ── CALCULATORS SECTION ──────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-slate-900 text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              Kalkulator Sehat
            </p>
            <Link href="/health-calc" className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline">Lihat Semua →</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {CALCS.map((calc, i) => (
              <Link key={i} href={calc.href} className="flex flex-col items-center gap-3 bg-white border border-slate-100 p-5 rounded-[2rem] hover:scale-105 active:scale-95 transition-all group shadow-sm shadow-slate-200/50">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${calc.color} flex items-center justify-center text-2xl shadow-inner group-hover:rotate-12 transition-transform`}>
                  {calc.icon}
                </div>
                <span className="text-slate-900 text-[10px] font-black uppercase tracking-widest text-center leading-tight">{calc.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── ADS CAROUSEL ─────────────────────────────────────────────────── */}
        {ads.length > 0 && (
          <section className="relative group">
            <div className="overflow-x-auto flex gap-4 snap-x snap-mandatory no-scrollbar pb-2">
              {ads.map((ad) => (
                <div key={ad.id} className="min-w-full snap-center">
                  <Link href={ad.link_url} target="_blank" className="block relative h-48 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50 group">
                    <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <p className="text-white font-bold text-lg leading-tight drop-shadow-md">{ad.title}</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── ARTICLES SECTION ─────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-slate-900 text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
              Berita Kesehatan
            </p>
            <Link href="/articles" className="text-orange-600 text-[10px] font-black uppercase tracking-widest hover:underline">Baca Semua →</Link>
          </div>

          <div className="overflow-x-auto flex gap-4 pb-4 no-scrollbar -mx-1 px-1">
            {articlesLoading ? (
              [1, 2, 3].map(i => <ArticleSkeleton key={i} />)
            ) : (
              articles.map((article, i) => (
                <Link key={i} href={article.link} className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden flex-shrink-0 w-64 shadow-sm shadow-slate-200/50 hover:shadow-md transition-all active:scale-[0.98] group">
                  <div className="h-32 relative overflow-hidden">
                    <img src={article.image} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-900 shadow-sm">
                      {article.source}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-slate-900 font-bold text-sm leading-snug line-clamp-2 group-hover:text-emerald-600 transition-colors">
                      {article.title}
                    </h3>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">{article.pubDate}</span>
                      <span className="text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">Baca →</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <ConfirmModal 
        isOpen={showConfirmCancel}
        title="Batalkan Permohonan?"
        message="Apakah Anda yakin ingin membatalkan permohonan program wellness ini?"
        confirmText="Ya, Batalkan"
        variant="danger"
        onConfirm={async () => {
          setShowConfirmCancel(false);
          try {
            const res = await fetch('/api/program/cancel', { method: 'POST' });
            if (res.ok) {
              window.location.reload();
            }
          } catch (e) {
            console.error(e);
          }
        }}
        onCancel={() => setShowConfirmCancel(false)}
      />

      <BottomNav active="dashboard" />
    </div>
  );
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div>
      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">{label}</label>
      <input
        type="number" value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="input-dark font-medium"
      />
    </div>
  );
}
