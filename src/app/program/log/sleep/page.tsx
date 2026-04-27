'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PageHeader from '@/components/PageHeader';
import SuccessModal from '@/components/SuccessModal';

function calculateSleep(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  let diff = (eH * 60 + eM) - (sH * 60 + sM);
  if (diff < 0) diff += 24 * 60; // Midnight crossover
  return Math.round((diff / 60) * 10) / 10;
}

export default function SleepLogPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [programId, setProgramId] = useState<number | null>(null);
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    sleep_start: '',
    sleep_end: '',
    sleep_quality: 'good',
    jam_istirahat: '0'
  });

  // To keep track of other daily log data so we don't overwrite them
  const [fullLog, setFullLog] = useState<any>(null);

  useEffect(() => {
    if (userId) {
      fetch(`/api/program/${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.program) {
            setProgramId(data.program.id);
            fetchLog(data.program.id, logDate);
          } else {
            setLoading(false);
          }
        });
    }
  }, [userId, logDate]);

  const fetchLog = async (pid: number, date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/program/detailed-logs?program_id=${pid}&log_date=${date}`);
      const data = await res.json();
      if (data.log) {
        setFullLog(data.log);
        setForm({
          sleep_start: data.log.sleep_start || '',
          sleep_end: data.log.sleep_end || '',
          sleep_quality: data.log.sleep_quality || 'good',
          jam_istirahat: String(data.log.jam_istirahat || '0')
        });
      } else {
        setFullLog(null);
        setForm({
          sleep_start: '',
          sleep_end: '',
          sleep_quality: 'good',
          jam_istirahat: '0'
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!programId) return;
    setIsSaving(true);

    try {
      // We use the progress API because sleep is stored in the daily_logs table
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: programId,
          // Preserve other data if they exist
          kalori_makan: fullLog?.kalori_makan || 0,
          air_liter: fullLog?.air_liter || 0,
          bakar_kalori: fullLog?.bakar_kalori || 0,
          mood: fullLog?.mood || 'good',
          stress_level: fullLog?.stress_level || 5,
          weight_kg: fullLog?.weight_kg || undefined,
          notes: fullLog?.notes || undefined,
          // New sleep data
          jam_istirahat: Number(form.jam_istirahat),
          sleep_start: form.sleep_start,
          sleep_end: form.sleep_end,
          sleep_quality: form.sleep_quality,
        })
      });

      if (res.ok) {
        setSaved(true);
        fetchLog(programId, logDate);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col pb-safe bg-[#f8fafc]">
      <PageHeader title="Log Istirahat" subtitle="Kualitas tidur kunci pemulihan tubuh" />

      <SuccessModal 
        isOpen={saved} 
        title="Berhasil Disimpan!" 
        message="Catatan tidur Anda telah berhasil diperbarui." 
        onClose={() => setSaved(false)} 
        autoRedirect={false}
      />

      <div className="flex-1 px-4 py-6 space-y-6">
        {/* Date Selector */}
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
          <label className="text-slate-500 font-bold text-sm">Pilih Tanggal</label>
          <input 
            type="date" 
            value={logDate} 
            onChange={e => setLogDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 font-semibold rounded-xl px-4 py-2"
          />
        </div>

        {/* Input Card */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-7 shadow-sm shadow-slate-200/50 space-y-8 animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-3xl shadow-inner border border-indigo-100">🌙</div>
            <div>
              <p className="text-slate-900 font-black text-lg leading-tight">Detail Tidur</p>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Input Waktu Istirahat</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block px-1">Jam Tidur</label>
              <div className="relative">
                <input 
                  type="time" 
                  className="input-dark w-full font-bold py-4" 
                  value={form.sleep_start} 
                  onChange={(e) => {
                    const newStart = e.target.value;
                    const duration = calculateSleep(newStart, form.sleep_end);
                    setForm({ ...form, sleep_start: newStart, jam_istirahat: String(duration) });
                  }} 
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block px-1">Jam Bangun</label>
              <div className="relative">
                <input 
                  type="time" 
                  className="input-dark w-full font-bold py-4" 
                  value={form.sleep_end} 
                  onChange={(e) => {
                    const newEnd = e.target.value;
                    const duration = calculateSleep(form.sleep_start, newEnd);
                    setForm({ ...form, sleep_end: newEnd, jam_istirahat: String(duration) });
                  }} 
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-[2rem] text-white flex items-center justify-between shadow-xl shadow-indigo-500/20">
            <div>
              <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Total Durasi</p>
              <p className="text-4xl font-black">{form.jam_istirahat} <span className="text-lg font-medium">Jam</span></p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm">⏳</div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 block px-1">Bagaimana Kualitas Tidur Anda?</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'excellent', label: 'Sangat Nyenyak', icon: '💎', desc: 'Tanpa terbangun' },
                { value: 'good', label: 'Tidur Baik', icon: '✅', desc: 'Merasa segar' },
                { value: 'fair', label: 'Cukup', icon: '😐', desc: 'Sedikit lelah' },
                { value: 'poor', label: 'Buruk', icon: '❌', desc: 'Sering terbangun' },
              ].map((q) => (
                <button
                  key={q.value}
                  type="button"
                  onClick={() => setForm({ ...form, sleep_quality: q.value })}
                  className={`flex flex-col items-start gap-1 px-4 py-4 rounded-[1.5rem] border-2 transition-all text-left ${
                    form.sleep_quality === q.value
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm'
                      : 'bg-slate-50 border-transparent text-slate-500 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{q.icon}</span>
                    <span className="text-xs font-black uppercase tracking-tight">{q.label}</span>
                  </div>
                  <span className="text-[9px] font-bold opacity-70 leading-none">{q.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving || !form.sleep_start || !form.sleep_end}
            className="btn-primary w-full py-5 rounded-[2rem] text-base font-black shadow-xl shadow-emerald-500/30 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? '⏳ Menyimpan...' : '💾 Simpan Catatan Tidur'}
          </button>
        </div>
      </div>
    </div>
  );
}
