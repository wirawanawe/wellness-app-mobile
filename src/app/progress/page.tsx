'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import SuccessModal from '@/components/SuccessModal';

interface Program { id: number; target_kalori_makan: number; target_air_liter: number; target_bakar_kalori: number; target_jam_istirahat: number }
type Mood = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 'great', emoji: '🤩', label: 'Luar biasa' },
  { value: 'good', emoji: '😊', label: 'Bagus' },
  { value: 'okay', emoji: '😐', label: 'Biasa' },
  { value: 'bad', emoji: '😔', label: 'Kurang' },
  { value: 'terrible', emoji: '😫', label: 'Buruk' },
];


function calculateSleep(start: string, end: string): number {
  if (!start || !end) return 0;
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  let diff = (eH * 60 + eM) - (sH * 60 + sM);
  if (diff < 0) diff += 24 * 60; // Midnight crossover
  return Math.round((diff / 60) * 10) / 10;
}

export default function ProgressPage() {
  const { data: session } = useSession();
  const [program, setProgram] = useState<Program | null>(null);
  const [form, setForm] = useState({ 
    kalori_makan: '', air_liter: '', bakar_kalori: '', jam_istirahat: '', weight_kg: '', notes: '',
    sleep_start: '', sleep_end: '', sleep_quality: 'good' 
  });
  const [mood, setMood] = useState<Mood>('good');
  const [stressLevel, setStressLevel] = useState(5);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const userId = (session?.user as { id?: string })?.id;

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/program/${userId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.program) {
          setProgram(d.program);
          if (d.todayLog) {
            setForm({
              kalori_makan: String(d.todayLog.kalori_makan || ''),
              air_liter: String(d.todayLog.air_liter || ''),
              bakar_kalori: String(d.todayLog.bakar_kalori || ''),
              jam_istirahat: String(d.todayLog.jam_istirahat || ''),
              weight_kg: String(d.todayLog.weight_kg || ''),
              notes: d.todayLog.notes || '',
              sleep_start: d.todayLog.sleep_start || '',
              sleep_end: d.todayLog.sleep_end || '',
              sleep_quality: d.todayLog.sleep_quality || 'good',
            });
            setMood(d.todayLog.mood || 'good');
            setStressLevel(d.todayLog.stress_level || 5);
          }
        }
      });
  }, [userId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!program) return;
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: program.id,
          kalori_makan: Number(form.kalori_makan) || 0,
          air_liter: Number(form.air_liter) || 0,
          bakar_kalori: Number(form.bakar_kalori) || 0,
          jam_istirahat: Number(form.jam_istirahat) || 0,
          mood,
          stress_level: Number(stressLevel),
          weight_kg: form.weight_kg ? Number(form.weight_kg) : undefined,
          notes: form.notes || undefined,
          sleep_start: form.sleep_start || undefined,
          sleep_end: form.sleep_end || undefined,
          sleep_quality: form.sleep_quality,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    { key: 'kalori_makan', label: 'Kalori Makan', icon: '🍽️', unit: 'kkal', placeholder: '0', target: program?.target_kalori_makan, link: '/program/log/meals', readOnly: true },
    { key: 'air_liter', label: 'Air Minum', icon: '💧', unit: 'liter', placeholder: '0.0', target: program?.target_air_liter, link: '/program/log/water', readOnly: true },
    { key: 'bakar_kalori', label: 'Bakar Kalori', icon: '🔥', unit: 'kkal', placeholder: '0', target: program?.target_bakar_kalori, link: '/program/log/exercise', readOnly: true },
  ];

  return (
    <div className="min-h-dvh flex flex-col pb-safe bg-[#f8fafc]">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent" />
        <div className="relative">
          <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-[0.2em]">Catat Harian</p>
          <h1 className="text-3xl font-bold text-slate-900 mt-1 leading-tight">Log Progres</h1>
          <p className="text-slate-500 text-xs mt-2 font-bold uppercase tracking-wider">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {!program ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center pb-24">
          <div className="w-20 h-20 rounded-3xl bg-white shadow-xl shadow-slate-200/50 flex items-center justify-center text-4xl mb-6 border border-slate-50">📋</div>
          <p className="text-slate-900 font-bold text-lg leading-tight">Belum Ada Program Aktif</p>
          <p className="text-slate-500 text-xs mt-2 font-medium leading-relaxed">Upload hasil lab dan pilih dokter untuk mulai mencatat progres harian Anda.</p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="flex-1 px-4 pb-28 space-y-5 animate-slide-up">
          <SuccessModal 
            isOpen={saved} 
            title="Berhasil Disimpan!" 
            message="Catatan harian Anda telah berhasil diperbarui. Mari terus jaga kesehatan!" 
            onClose={() => setSaved(false)}
            autoRedirect={false}
          />



          {/* Progress Fields */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <h2 className="text-slate-900 font-bold text-sm uppercase tracking-widest leading-none">Target Pencapaian</h2>
            </div>
            
            {fields.map((f) => (
              <div key={f.key} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm shadow-slate-200/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-xl shadow-inner border border-slate-100">{f.icon}</div>
                    <p className="text-slate-900 font-bold text-sm leading-tight">{f.label}</p>
                  </div>
                  {f.target && (
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight leading-none">Target</p>
                      <p className="text-slate-500 text-[11px] font-black mt-1">{f.target} {f.unit}</p>
                    </div>
                  )}
                </div>
                <div className="relative flex gap-2 items-center">
                  <div className="relative flex-1">
                    <input
                      id={`log-${f.key}`}
                      type="number"
                      min="0"
                      step={f.key === 'air_liter' ? '0.1' : '1'}
                      className={`input-dark w-full font-bold text-lg py-4 pr-16 ${f.readOnly ? 'bg-slate-50 border-slate-200 text-slate-500 opacity-80 cursor-not-allowed' : ''}`}
                      placeholder={f.placeholder}
                      value={form[f.key as keyof typeof form]}
                      onChange={(e) => !f.readOnly && setForm({ ...form, [f.key]: e.target.value })}
                      readOnly={f.readOnly}
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">{f.unit}</span>
                  </div>
                  {f.link && (
                    <Link href={f.link} className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm active:scale-95 transition-transform shrink-0">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    </Link>
                  )}
                </div>
              </div>
            ))}

            {/* Sleep Section (Redesigned) */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm shadow-slate-200/50 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-xl shadow-inner border border-indigo-100">🌙</div>
                  <p className="text-slate-900 font-bold text-sm leading-tight">Jam Istirahat</p>
                </div>
                {program?.target_jam_istirahat && (
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight leading-none">Target</p>
                    <p className="text-indigo-500 text-[11px] font-black mt-1">{program.target_jam_istirahat} jam</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block px-1">Jam Tidur</label>
                  <input 
                    type="time" 
                    className="input-dark w-full font-bold" 
                    value={form.sleep_start} 
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const duration = calculateSleep(newStart, form.sleep_end);
                      setForm({ ...form, sleep_start: newStart, jam_istirahat: String(duration) });
                    }} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block px-1">Jam Bangun</label>
                  <input 
                    type="time" 
                    className="input-dark w-full font-bold" 
                    value={form.sleep_end} 
                    onChange={(e) => {
                      const newEnd = e.target.value;
                      const duration = calculateSleep(form.sleep_start, newEnd);
                      setForm({ ...form, sleep_end: newEnd, jam_istirahat: String(duration) });
                    }} 
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Durasi</p>
                <p className="text-xl font-black text-indigo-600">{form.jam_istirahat || '0'} <span className="text-[10px] font-bold text-slate-400">JAM</span></p>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block px-1">Kualitas Tidur</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'excellent', label: 'Nyenyak', icon: '💎' },
                    { value: 'good', label: 'Baik', icon: '✅' },
                    { value: 'fair', label: 'Biasa', icon: '😐' },
                    { value: 'poor', label: 'Buruk', icon: '❌' },
                  ].map((q) => (
                    <button
                      key={q.value}
                      type="button"
                      onClick={() => setForm({ ...form, sleep_quality: q.value })}
                      className={`flex items-center gap-2 px-3 py-3 rounded-2xl border-2 transition-all text-xs font-bold ${
                        form.sleep_quality === q.value
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'bg-slate-50 border-transparent text-slate-500 opacity-60'
                      }`}
                    >
                      <span>{q.icon}</span>
                      <span>{q.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Optional fields */}
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-7 space-y-6 shadow-sm shadow-slate-200/50">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              <h2 className="text-slate-900 font-bold text-sm uppercase tracking-widest leading-none">Opsional</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block px-1">⚖️ Berat Badan</label>
                <div className="relative">
                  <input id="log-weight" type="number" min="0" step="0.1" className="input-dark font-bold py-4 pr-16"
                    placeholder="65.0"
                    value={form.weight_kg}
                    onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">kg</span>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block px-1">📝 Catatan Aktivitas</label>
                <textarea id="log-notes" className="input-dark resize-none font-medium leading-relaxed" rows={4}
                  placeholder="Ceritakan aktivitas hari ini..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
          </div>

          {error && <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-red-600 text-sm font-bold text-center">{error}</div>}

          <button 
            id="log-save-btn" 
            type="submit" 
            disabled={saving} 
            className="btn-primary py-5 rounded-[2rem] text-base font-black shadow-xl shadow-emerald-500/30 active:scale-95 transition-transform"
          >
            {saving ? '⏳ Menyimpan...' : '💾 Simpan Progres'}
          </button>
        </form>
      )}

      <BottomNav active="progress" />
    </div>
  );
}
