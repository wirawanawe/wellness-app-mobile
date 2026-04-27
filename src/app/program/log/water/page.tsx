'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PageHeader from '@/components/PageHeader';
import SuccessModal from '@/components/SuccessModal';
import ConfirmModal from '@/components/ConfirmModal';

export default function WaterLogPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [programId, setProgramId] = useState<number | null>(null);
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [waterLogs, setWaterLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: 'Tersimpan!', message: '' });

  const [customAmount, setCustomAmount] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });

  useEffect(() => {
    if (userId) {
      fetch(`/api/program/${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.program) {
            setProgramId(data.program.id);
            fetchWaterLogs(data.program.id, logDate);
          } else {
            setLoading(false);
          }
        });
    }
  }, [userId, logDate]);

  const fetchWaterLogs = async (pid: number, date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/program/detailed-logs?program_id=${pid}&log_date=${date}`);
      const data = await res.json();
      setWaterLogs(data.water || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWater = async (amount: number) => {
    if (!programId || !amount) return;
    setIsSaving(true);
    
    // Get current time in HH:mm format
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    try {
      const res = await fetch('/api/program/log/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: programId,
          log_date: logDate,
          amount_ml: amount,
          time_logged: timeString,
        })
      });
      if (res.ok) {
        setCustomAmount('');
        fetchWaterLogs(programId, logDate);
        setModalConfig({ title: 'Tersimpan!', message: 'Log air minum berhasil ditambahkan.' });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWater = (id: number) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const executeDeleteWater = async () => {
    const id = confirmDelete.id;
    if (!programId || !id) return;
    setConfirmDelete({ isOpen: false, id: null });
    try {
      const res = await fetch(`/api/program/log/water/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchWaterLogs(programId, logDate);
        setModalConfig({ title: 'Terhapus!', message: 'Log air minum telah dihapus.' });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalWaterMl = waterLogs.reduce((sum, w) => sum + w.amount_ml, 0);

  return (
    <div className="min-h-dvh flex flex-col pb-safe bg-[#f8fafc]">
      <PageHeader title="Log Air Minum" subtitle="Pastikan Anda tetap terhidrasi" />

      <SuccessModal 
        isOpen={saved} 
        title={modalConfig.title} 
        message={modalConfig.message} 
        onClose={() => setSaved(false)} 
        autoRedirect={false}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Hapus Log Minum?"
        message="Catatan hidrasi ini akan dihapus secara permanen."
        variant="danger"
        onConfirm={executeDeleteWater}
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
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[2rem] p-6 text-white shadow-xl shadow-cyan-500/20 text-center relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 text-[10rem] opacity-10">💧</div>
          <p className="text-cyan-100 text-sm font-semibold uppercase tracking-wider mb-1 relative z-10">Total Hidrasi Hari Ini</p>
          <p className="text-5xl font-black relative z-10">{(totalWaterMl / 1000).toFixed(2)} <span className="text-xl font-medium">Liter</span></p>
          <p className="text-cyan-100 text-xs font-medium mt-2 relative z-10">Setara dengan {totalWaterMl} ml</p>
        </div>

        {/* Quick Add Buttons */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            Tambah Air
          </h3>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <button 
              disabled={isSaving}
              onClick={() => handleAddWater(100)}
              className="bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-100 py-3 rounded-2xl font-black text-sm transition-colors active:scale-95"
            >
              +100 ml
            </button>
            <button 
              disabled={isSaving}
              onClick={() => handleAddWater(250)}
              className="bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-100 py-3 rounded-2xl font-black text-sm transition-colors active:scale-95"
            >
              +250 ml
            </button>
            <button 
              disabled={isSaving}
              onClick={() => handleAddWater(500)}
              className="bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-100 py-3 rounded-2xl font-black text-sm transition-colors active:scale-95"
            >
              +500 ml
            </button>
          </div>

          <div className="flex gap-3">
            <input 
              type="number" 
              placeholder="Custom (ml)..." 
              className="input-dark flex-1" 
              value={customAmount} 
              onChange={e => setCustomAmount(e.target.value)} 
            />
            <button 
              disabled={isSaving || !customAmount}
              onClick={() => handleAddWater(parseInt(customAmount))}
              className="bg-slate-900 text-white font-bold px-6 rounded-2xl active:scale-95 disabled:opacity-50"
            >
              Tambah
            </button>
          </div>
        </div>

        {/* Timeline List */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 px-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            Timeline Hidrasi
          </h3>
          
          {loading ? (
            <p className="text-center text-slate-400 text-sm py-4">Memuat data...</p>
          ) : waterLogs.length > 0 ? (
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {waterLogs.map(w => (
                  <div key={w.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-cyan-100 text-cyan-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-lg">
                      💧
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-100 shadow-sm bg-slate-50 flex items-center justify-between">
                      <div>
                        <time className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1 block">
                          {w.time_logged.substring(0, 5)}
                        </time>
                        <p className="font-bold text-slate-900">{w.amount_ml} <span className="text-xs font-medium text-slate-500">ml</span></p>
                      </div>
                      <button onClick={() => handleDeleteWater(w.id)} className="text-red-400 hover:text-red-600 p-2 opacity-50 hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-8 text-center">
              <p className="text-slate-400 text-sm font-medium">Belum ada catatan minum untuk tanggal ini.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
