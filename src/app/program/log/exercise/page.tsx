'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PageHeader from '@/components/PageHeader';
import SuccessModal from '@/components/SuccessModal';
import ConfirmModal from '@/components/ConfirmModal';

const EXERCISE_RATES: Record<string, number> = {
  'Jalan Kaki': 4.5,
  'Lari': 10,
  'Sepeda': 8,
  'Berenang': 7.5,
  'Angkat Beban': 6,
  'Senam / Aerobik': 7,
  'Yoga': 3.5,
  'Badminton / Tenis': 7,
  'Lainnya': 5
};

export default function ExerciseLogPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [programId, setProgramId] = useState<number | null>(null);
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: 'Tersimpan!', message: '' });

  const [activity, setActivity] = useState('Jalan Kaki');
  const [duration, setDuration] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [useAutoCalc, setUseAutoCalc] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });

  useEffect(() => {
    if (userId) {
      fetch(`/api/program/${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.program) {
            setProgramId(data.program.id);
            fetchExercises(data.program.id, logDate);
          } else {
            setLoading(false);
          }
        });
    }
  }, [userId, logDate]);

  const fetchExercises = async (pid: number, date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/program/detailed-logs?program_id=${pid}&log_date=${date}`);
      const data = await res.json();
      setExercises(data.exercise || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Auto calculate calories when duration or activity changes
  useEffect(() => {
    if (useAutoCalc && duration) {
      const mins = parseInt(duration);
      if (!isNaN(mins)) {
        const rate = EXERCISE_RATES[activity] || 5;
        setCustomCalories(Math.round(mins * rate).toString());
      }
    }
  }, [activity, duration, useAutoCalc]);

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programId || !duration || !customCalories) return;
    setIsSaving(true);

    try {
      const res = await fetch('/api/program/log/exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: programId,
          log_date: logDate,
          activity_type: activity,
          duration_minutes: parseInt(duration),
          calories_burned: parseInt(customCalories),
        })
      });
      if (res.ok) {
        setDuration('');
        setCustomCalories('');
        fetchExercises(programId, logDate);
        setModalConfig({ title: 'Tersimpan!', message: 'Log aktivitas berhasil ditambahkan.' });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteExercise = (id: number) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const executeDeleteExercise = async () => {
    const id = confirmDelete.id;
    if (!programId || !id) return;
    setConfirmDelete({ isOpen: false, id: null });
    try {
      const res = await fetch(`/api/program/log/exercise/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchExercises(programId, logDate);
        setModalConfig({ title: 'Terhapus!', message: 'Log aktivitas telah dihapus.' });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalBurned = exercises.reduce((sum, e) => sum + e.calories_burned, 0);
  const totalDuration = exercises.reduce((sum, e) => sum + e.duration_minutes, 0);

  return (
    <div className="min-h-dvh flex flex-col pb-safe bg-[#f8fafc]">
      <PageHeader title="Log Olahraga" subtitle="Catat aktivitas fisik Anda hari ini" />

      <SuccessModal 
        isOpen={saved} 
        title={modalConfig.title} 
        message={modalConfig.message} 
        onClose={() => setSaved(false)} 
        autoRedirect={false}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Hapus Log Olahraga?"
        message="Catatan aktivitas ini akan dihapus secara permanen."
        variant="danger"
        onConfirm={executeDeleteExercise}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
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

        {/* Total Summary */}
        <div className="bg-gradient-to-br from-orange-500 to-rose-600 rounded-[2rem] p-6 text-white shadow-xl shadow-orange-500/20 grid grid-cols-2 gap-4">
          <div>
            <p className="text-orange-100 text-xs font-semibold uppercase tracking-wider mb-1">Total Bakar Kalori</p>
            <p className="text-3xl font-black">{totalBurned} <span className="text-sm font-medium">kcal</span></p>
          </div>
          <div className="border-l border-white/20 pl-4">
            <p className="text-orange-100 text-xs font-semibold uppercase tracking-wider mb-1">Total Durasi</p>
            <p className="text-3xl font-black">{totalDuration} <span className="text-sm font-medium">menit</span></p>
          </div>
        </div>

        {/* Add Form */}
        <form onSubmit={handleAddExercise} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Tambah Aktivitas Fisik
          </h3>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Jenis Olahraga</label>
            <select className="input-dark w-full font-medium" value={activity} onChange={e => setActivity(e.target.value)}>
              {Object.keys(EXERCISE_RATES).map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Durasi (Menit)</label>
            <input required type="number" placeholder="Contoh: 30" className="input-dark w-full" value={duration} onChange={e => setDuration(e.target.value)} />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Kalori Terbakar (kcal)</label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Auto Kalkulasi</span>
                <button 
                  type="button"
                  onClick={() => setUseAutoCalc(!useAutoCalc)}
                  className={`w-8 h-4 rounded-full transition-all relative ${useAutoCalc ? 'bg-emerald-500' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useAutoCalc ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
            <input required type="number" placeholder="0" className="input-dark w-full text-lg font-black text-rose-500" value={customCalories} onChange={e => { setCustomCalories(e.target.value); setUseAutoCalc(false); }} />
          </div>

          <button type="submit" disabled={isSaving || !programId} className="w-full btn-primary bg-rose-500 hover:bg-rose-600 shadow-rose-500/20 py-4 mt-2">
            {isSaving ? 'Menyimpan...' : '🔥 Catat Olahraga'}
          </button>
        </form>

        {/* Timeline List */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 px-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            Riwayat Aktivitas
          </h3>
          
          {loading ? (
            <p className="text-center text-slate-400 text-sm py-4">Memuat data...</p>
          ) : exercises.length > 0 ? (
            exercises.map(ex => (
              <div key={ex.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center text-xl font-black border border-orange-100 shadow-inner">
                    🏃
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{ex.activity_type}</p>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">{ex.duration_minutes} Menit</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-black text-rose-500 text-lg">{ex.calories_burned}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">kcal</p>
                  </div>
                  <button onClick={() => handleDeleteExercise(ex.id)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-8 text-center">
              <p className="text-slate-400 text-sm font-medium">Belum ada catatan olahraga untuk tanggal ini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
