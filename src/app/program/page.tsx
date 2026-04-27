'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

// ============================================================
// KEY DELIVERABLE #4: Employee Daily Target View
// Displays: Kalori Makanan, Air (L), Bakar Kalori,
//           Jam Istirahat, Durasi Program
// Features: Animated progress rings, today's log summary,
//           weekly averages, doctor info
// ============================================================

interface Program {
  id: number;
  status: string;
  start_date: string;
  end_date: string;
  target_kalori_makan: number;
  target_air_liter: number;
  target_bakar_kalori: number;
  target_jam_istirahat: number;
  target_durasi_program: number;
  doctor_id: number;
  doctor_name: string;
  doctor_specialization: string;
  doctor_notes: string;
}

interface TodayLog {
  kalori_makan: number;
  air_liter: number;
  bakar_kalori: number;
  jam_istirahat: number;
  mood: string;
}

interface WeekStats {
  avg_kalori_makan: number;
  avg_air_liter: number;
  avg_bakar_kalori: number;
  avg_jam_istirahat: number;
  days_logged: number;
}

interface TargetItem {
  key: keyof TodayLog;
  label: string;
  icon: string;
  unit: string;
  target: number;
  actual: number;
  color: string;
  colorRGB: string;
  format: (v: number) => string;
  href: string;
}

function CircleProgress({
  percent,
  color,
  colorRGB,
  size = 88,
}: {
  percent: number;
  color: string;
  colorRGB: string;
  size?: number;
}) {
  const r = (size - 10) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} className="progress-ring -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ filter: `drop-shadow(0 2px 4px rgba(${colorRGB}, 0.2))` }}
      />
    </svg>
  );
}

const moodEmoji: Record<string, string> = {
  great: '🤩', good: '😊', okay: '😐', bad: '😔', terrible: '😫',
};

export default function ProgramPage() {
  const { data: session } = useSession();
  const [program, setProgram] = useState<Program | null>(null);
  const [todayLog, setTodayLog] = useState<TodayLog | null>(null);
  const [weekStats, setWeekStats] = useState<WeekStats | null>(null);
  const [daysElapsed, setDaysElapsed] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [last7DaysLogs, setLast7DaysLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'kalori_makan' | 'air_liter' | 'bakar_kalori' | 'jam_istirahat'>('kalori_makan');
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  const userId = (session?.user as { id?: string })?.id;

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/program/${userId}?weekOffset=${weekOffset}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.program) setProgram(data.program);
        if (data.todayLog) setTodayLog(data.todayLog);
        if (data.weekStats) setWeekStats(data.weekStats);
        setLast7DaysLogs(data.last7DaysLogs || []);
        setDaysElapsed(data.daysElapsed || 0);
        setProgressPercent(data.progressPercent || 0);
      })
      .finally(() => setLoading(false));
  }, [userId, weekOffset]);

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#f8fafc] gap-4">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Memuat Program...</p>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-8 text-center pb-24 bg-[#f8fafc]">
        <div className="w-24 h-24 rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center text-5xl mb-6 border border-slate-50">🏥</div>
        <h2 className="text-slate-900 text-2xl font-black mb-3 tracking-tight">Belum Ada Program</h2>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">Upload hasil lab Anda terlebih dahulu dan pilih dokter untuk mendapatkan program wellness yang disesuaikan.</p>
        <Link href="/lab/upload" className="btn-primary inline-block w-auto px-10 py-4 rounded-2xl shadow-lg shadow-emerald-500/20">Upload Hasil Lab</Link>
        <BottomNav active="program" />
      </div>
    );
  }

  const targets: TargetItem[] = [
    {
      key: 'kalori_makan',
      label: 'Kalori Makan',
      icon: '🍽️',
      unit: 'kkal',
      target: program.target_kalori_makan,
      actual: todayLog?.kalori_makan ?? 0,
      color: '#f59e0b',
      colorRGB: '245,158,11',
      format: (v) => (Number(v) || 0).toLocaleString('id-ID'),
      href: '/program/log/meals',
    },
    {
      key: 'air_liter',
      label: 'Konsumsi Air',
      icon: '💧',
      unit: 'liter',
      target: program.target_air_liter,
      actual: todayLog?.air_liter ?? 0,
      color: '#0ea5e9',
      colorRGB: '14,165,233',
      format: (v) => (Number(v) || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 }),
      href: '/program/log/water',
    },
    {
      key: 'bakar_kalori',
      label: 'Bakar Kalori',
      icon: '🔥',
      unit: 'kkal',
      target: program.target_bakar_kalori,
      actual: todayLog?.bakar_kalori ?? 0,
      color: '#ef4444',
      colorRGB: '239,68,68',
      format: (v) => (Number(v) || 0).toLocaleString('id-ID'),
      href: '/program/log/exercise',
    },
    {
      key: 'jam_istirahat',
      label: 'Jam Istirahat',
      icon: '🌙',
      unit: 'jam',
      target: program.target_jam_istirahat,
      actual: todayLog?.jam_istirahat ?? 0,
      color: '#8b5cf6',
      colorRGB: '139,92,246',
      format: (v) => (Number(v) || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 }),
      href: '/program/log/sleep',
    },
  ];

  const endDate = program.end_date ? new Date(program.end_date) : null;
  const daysRemaining = endDate
    ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="min-h-dvh flex flex-col pb-safe bg-[#f8fafc]">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent" />
        <div className="relative">
          <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-[0.2em]">Program Aktif</p>
          <h1 className="text-3xl font-bold text-slate-900 mt-1 leading-tight">Target Harian</h1>
          <p className="text-slate-500 text-xs mt-2 font-bold uppercase tracking-wider">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 space-y-5 pb-28 animate-slide-up">

        {/* Program Duration Card */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-7 shadow-sm shadow-slate-200/50">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Durasi Program</p>
              <p className="text-slate-900 font-black text-2xl mt-1 leading-none">
                {program.target_durasi_program} <span className="text-sm font-bold text-slate-400 uppercase">Hari</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Progress</p>
              <p className="text-emerald-600 font-bold text-sm mt-1 leading-none">Hari ke-{daysElapsed}</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="space-y-3">
            <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-1000 shadow-lg shadow-emerald-500/20"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter px-1">
              <span>Mulai: {new Date(program.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
              <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{progressPercent}%</span>
              {endDate && <span>Selesai: {endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>}
            </div>
          </div>
        </div>

        {/* Today's Mood */}
        {todayLog && (
          <div className="bg-white border border-slate-100 rounded-3xl px-6 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl shadow-inner border border-slate-100">
              {moodEmoji[todayLog.mood] || '😊'}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mood Hari Ini</p>
              <p className="text-slate-900 text-sm font-bold capitalize">{todayLog.mood}</p>
            </div>
            <Link href="/progress" className="ml-auto w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </Link>
          </div>
        )}

        {/* Target Progress Rings */}
        <div>
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-slate-900 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Target Realisasi
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {targets.map((t) => {
              const pct = t.target > 0 ? Math.min(100, Math.round((t.actual / t.target) * 100)) : 0;
              const isAchieved = pct >= 100;
              return (
                <Link
                  key={t.key}
                  href={t.href}
                  className={`bg-white border rounded-[2.5rem] p-6 flex flex-col items-center text-center transition-all shadow-sm shadow-slate-200/50 active:scale-95 hover:border-emerald-200 ${
                    isAchieved ? 'border-emerald-100 bg-emerald-50/20' : 'border-slate-100'
                  }`}
                >
                  <div className="relative mb-4">
                    <CircleProgress percent={pct} color={t.color} colorRGB={t.colorRGB} size={88} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl leading-none mb-1">{t.icon}</span>
                      <span className={`text-[11px] font-black ${isAchieved ? 'text-emerald-600' : 'text-slate-900'}`}>{pct}%</span>
                    </div>
                    {isAchieved && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-[10px] text-white shadow-lg shadow-emerald-500/30">✓</div>
                    )}
                  </div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">{t.label}</p>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-slate-900 font-black text-base">{t.format(t.actual)}</span>
                    <span className="text-slate-300 font-bold text-[10px]">/ {t.format(t.target)}</span>
                  </div>
                  <p className="text-slate-400 text-[9px] font-bold uppercase mt-0.5">{t.unit}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Weekly Chart */}
        {program && (
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-7 shadow-sm shadow-slate-200/50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Grafik Mingguan</p>
                <div className="flex items-center gap-2 mt-1">
                  <button 
                    onClick={() => setWeekOffset(prev => prev + 1)}
                    className="p-1 rounded-lg hover:bg-slate-50 text-slate-400 active:scale-90 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <p className="text-slate-900 font-black text-lg">
                    {weekOffset === 0 ? 'Minggu Ini' : `${weekOffset} Minggu Lalu`}
                  </p>
                  <button 
                    onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                    disabled={weekOffset === 0}
                    className={`p-1 rounded-lg transition-all ${weekOffset === 0 ? 'opacity-0 pointer-events-none' : 'hover:bg-slate-50 text-slate-400 active:scale-90'}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
              <div className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-100 text-[9px] font-bold text-emerald-600 uppercase">
                {last7DaysLogs.length} Hari Aktif
              </div>
            </div>

            {/* Tab Selector */}
            <div className="flex bg-slate-50 p-1 rounded-2xl mb-8">
              {[
                { id: 'kalori_makan', icon: '🍽️' },
                { id: 'air_liter', icon: '💧' },
                { id: 'bakar_kalori', icon: '🔥' },
                { id: 'jam_istirahat', icon: '🌙' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center py-2.5 rounded-xl transition-all ${
                    activeTab === tab.id 
                      ? 'bg-white shadow-sm text-lg scale-105' 
                      : 'text-slate-400 grayscale opacity-50'
                  }`}
                >
                  {tab.icon}
                </button>
              ))}
            </div>

            {/* Bars (Monday to Sunday) */}
            <div className="flex items-stretch justify-between h-48 gap-2 px-1">
              {Array.from({ length: 7 }).map((_, i) => {
                const now = new Date();
                // Apply week offset
                now.setDate(now.getDate() - (weekOffset * 7));
                
                const day = now.getDay() || 7; // Monday is 1, Sunday is 7
                const monday = new Date(now);
                monday.setDate(now.getDate() - (day - 1));
                
                const date = new Date(monday);
                date.setDate(monday.getDate() + i);
                
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const isToday = dateStr === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
                
                const dayLog = last7DaysLogs.find(l => {
                  const d = new Date(l.log_date);
                  const lStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                  return lStr === dateStr;
                });
                
                const value = dayLog ? Number(dayLog[activeTab]) || 0 : 0;
                const target = targets.find(t => t.key === activeTab)?.target || 1;
                const heightPct = Math.min(100, (value / target) * 100);
                const color = targets.find(t => t.key === activeTab)?.color || '#10b981';

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className={`flex-1 w-full bg-slate-50/50 rounded-2xl overflow-hidden flex flex-col justify-end border border-slate-100/50 relative ${isToday ? 'ring-2 ring-emerald-500/20 bg-emerald-50/10 border-emerald-200' : ''}`}>
                      <div className="absolute top-0 inset-x-0 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                        <div className="bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded-md text-center shadow-lg whitespace-nowrap">
                          {value}
                        </div>
                      </div>
                      <div 
                        className="w-full rounded-t-xl transition-all duration-700 ease-out shadow-sm"
                        style={{ 
                          height: value > 0 ? `${Math.max(8, heightPct)}%` : '0%', 
                          backgroundColor: color,
                        }}
                      />
                    </div>
                    <span className={`text-[9px] font-black uppercase ${isToday ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Summary info below chart */}
            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rata-rata</p>
                <p className="text-slate-900 font-black text-lg">
                  {activeTab === 'kalori_makan' && `${Math.round(Number(weekStats?.avg_kalori_makan || 0))} kkal`}
                  {activeTab === 'air_liter' && `${Number(weekStats?.avg_air_liter || 0).toFixed(1)} L`}
                  {activeTab === 'bakar_kalori' && `${Math.round(Number(weekStats?.avg_bakar_kalori || 0))} kkal`}
                  {activeTab === 'jam_istirahat' && `${Number(weekStats?.avg_jam_istirahat || 0).toFixed(1)} j`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Harian</p>
                <p className="text-slate-500 font-bold text-sm">
                  {targets.find(t => t.key === activeTab)?.target} {targets.find(t => t.key === activeTab)?.unit}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Doctor Info */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-7 shadow-sm shadow-slate-200/50">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">Dokter Pendamping</p>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shadow-inner">
              👨‍⚕️
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-900 font-black text-lg truncate leading-tight">{program.doctor_name}</p>
              <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider mt-1">{program.doctor_specialization || 'Dokter Wellness'}</p>
            </div>
            <Link href={`/chat/${program.doctor_id}`} className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm active:scale-90 transition-transform">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </Link>
          </div>
          {program.doctor_notes && (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 relative">
              <svg className="absolute -top-2 left-6 w-5 h-5 text-slate-100" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.895 14.895 16 16 16L18 16C19.105 16 20 16.895 20 18L20 21L14.017 21ZM14.017 21L8.017 21L8.017 18C8.017 16.895 8.895 16 10 16L12 16C13.105 16 14.017 16.895 14.017 18L14.017 21ZM5 21V18C5 16.895 5.895 16 7 16H9C10.105 16 11 16.895 11 18V21H5Z" opacity="0.1" /></svg>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pesan Dokter</p>
              <p className="text-slate-600 text-sm italic font-medium leading-relaxed">"{program.doctor_notes}"</p>
            </div>
          )}
        </div>

        {/* CTA */}
        {!todayLog && (
          <Link
            href="/progress"
            className="btn-primary block text-center py-5 rounded-[2rem] text-base font-black shadow-xl shadow-emerald-500/30 active:scale-95 transition-transform"
          >
            📝 Isi Progres Hari Ini
          </Link>
        )}
      </div>

      <BottomNav active="program" />
    </div>
  );
}
