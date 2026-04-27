'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';
import SuccessModal from '@/components/SuccessModal';

interface PatientDetail {
  patient: {
    id: number;
    name: string;
    email: string;
    gender: string;
    birth_date: string;
    company_name: string;
    avatar_url: string;
    phone: string;
  };
  latestLab: {
    id: number;
    lab_date: string;
    status: string;
    notes: string;
  } | null;
  labParameters: Array<{
    param_label: string;
    value: number;
    unit: string;
    normal_min: number;
    normal_max: number;
    status: string;
  }>;
  activeProgram: {
    id: number;
    status: string;
    target_kalori_makan: number;
    target_air_liter: number;
    target_bakar_kalori: number;
    target_jam_istirahat: number;
    target_durasi_program: number;
    doctor_notes: string;
  } | null;
  progressHistory: Array<{
    log_date: string;
    kalori_makan: number;
    air_liter: number;
    bakar_kalori: number;
    jam_istirahat: number;
    mood: string;
  }>;
}

function formatValue(v: number | string) {
  const n = Number(v) || 0;
  return n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProgramForm, setShowProgramForm] = useState(searchParams.get('action') === 'program');
  const [saved, setSaved] = useState(false);
  
  // Form state for creating/updating program
  const [form, setForm] = useState({
    target_kalori_makan: 2000,
    target_air_liter: 2.5,
    target_bakar_kalori: 300,
    target_jam_istirahat: 8,
    target_durasi_program: 30,
    doctor_notes: ''
  });

  useEffect(() => {
    if (!id) return;
    fetch(`/api/patients/${id}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        if (d.activeProgram) {
          setForm({
            target_kalori_makan: d.activeProgram.target_kalori_makan,
            target_air_liter: d.activeProgram.target_air_liter,
            target_bakar_kalori: d.activeProgram.target_bakar_kalori,
            target_jam_istirahat: d.activeProgram.target_jam_istirahat,
            target_durasi_program: d.activeProgram.target_durasi_program,
            doctor_notes: d.activeProgram.doctor_notes || ''
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmitProgram() {
    const res = await fetch('/api/programs', {
      method: data?.activeProgram ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        patient_id: id,
        program_id: data?.activeProgram?.id,
        lab_result_id: data?.latestLab?.id
      })
    });
    if (res.ok) {
      setSaved(true);
      setShowProgramForm(false);
      // Re-fetch data
      const d = await (await fetch(`/api/patients/${id}`)).json();
      setData(d);
    }
  }

  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  if (!data?.patient) return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-10 text-center">
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Pasien tidak ditemukan</p>
      <button onClick={() => router.back()} className="mt-4 text-emerald-600 font-bold">Kembali</button>
    </div>
  );

  const { patient, latestLab, labParameters, activeProgram, progressHistory } = data;

  return (
    <div className="min-h-dvh bg-[#f8fafc] pb-32">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-8 overflow-hidden bg-white border-b border-slate-100">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent" />
        <div className="relative flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Detail Pasien</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Rekam Medis & Program</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 animate-slide-up">
        <SuccessModal 
          isOpen={saved} 
          title="Program Tersimpan!" 
          message="Program wellness untuk pasien telah berhasil diperbarui." 
          onClose={() => setSaved(false)}
          autoRedirect={false}
        />
        {/* Patient Hero Card */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center text-4xl shadow-inner border border-emerald-100 flex-shrink-0">
            {patient.avatar_url ? <img src={patient.avatar_url} className="w-full h-full rounded-3xl object-cover" /> : '👤'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900 truncate">{patient.name}</h2>
            <p className="text-emerald-600 text-xs font-bold uppercase tracking-wide mt-1">{patient.company_name}</p>
            <div className="flex items-center gap-3 mt-3 text-slate-400 text-[11px] font-medium">
              <span className="flex items-center gap-1">🎂 {new Date(patient.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              <span className="w-1 h-1 rounded-full bg-slate-200" />
              <span>{patient.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            onClick={() => setShowProgramForm(true)}
            className="flex flex-col items-center justify-center p-4 bg-emerald-600 rounded-3xl text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition-transform"
          >
            <span className="text-2xl mb-1">📝</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Atur Program</span>
          </button>
          <Link 
            href={`/chat/${id}`}
            className="flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-3xl text-slate-900 shadow-sm active:scale-95 transition-transform"
          >
            <span className="text-2xl mb-1">💬</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hubungi Pasien</span>
          </Link>
        </div>

        {/* Latest Lab Results */}
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-slate-900 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Hasil Lab Terakhir
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{latestLab ? new Date(latestLab.lab_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Belum Ada'}</span>
          </div>

          {!latestLab ? (
            <div className="text-center py-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 text-xs font-medium">Belum ada data medical checkup</p>
            </div>
          ) : (
            <div className="space-y-3">
              {labParameters.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{p.param_label}</p>
                    <p className="text-slate-900 font-bold text-sm">{formatValue(p.value)} <span className="text-[10px] text-slate-400 font-medium">{p.unit}</span></p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase ${
                    p.status === 'normal' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {p.status === 'normal' ? 'Normal' : p.status === 'high' ? 'Tinggi' : 'Rendah'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Program Progress */}
        {activeProgram && (
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm">
             <div className="flex items-center justify-between mb-5">
              <h3 className="text-slate-900 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Realisasi 14 Hari
              </h3>
            </div>
            {progressHistory.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-xs font-medium">Belum ada log harian dari pasien</p>
              </div>
            ) : (
              <div className="space-y-4">
                {progressHistory.map((log, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg flex-shrink-0">
                      {log.mood === 'great' ? '🤩' : log.mood === 'good' ? '😊' : '😐'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 text-[11px] font-bold">{new Date(log.log_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                      <div className="flex gap-3 text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                        <span>🍽️ {log.kalori_makan}</span>
                        <span>💧 {log.air_liter}L</span>
                        <span>🔥 {log.bakar_kalori}</span>
                        <span>🌙 {log.jam_istirahat}j</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Program Form Overlay */}
      {showProgramForm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-8">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowProgramForm(false)} />
          <div className="relative w-full max-w-md bg-white rounded-[2.5rem] p-8 animate-slide-up shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="text-2xl">📝</span>
              {activeProgram ? 'Update Program' : 'Buat Program Baru'}
            </h3>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Target Kalori Makan (kkal)</label>
                <input 
                  type="number" 
                  className="input-dark bg-slate-50"
                  value={form.target_kalori_makan}
                  onChange={e => setForm({...form, target_kalori_makan: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Target Air (Liter)</label>
                <input 
                  type="number" step="0.1"
                  className="input-dark bg-slate-50"
                  value={form.target_air_liter}
                  onChange={e => setForm({...form, target_air_liter: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Target Bakar Kalori (kkal)</label>
                <input 
                  type="number" 
                  className="input-dark bg-slate-50"
                  value={form.target_bakar_kalori}
                  onChange={e => setForm({...form, target_bakar_kalori: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Target Jam Istirahat (Jam)</label>
                <input 
                  type="number" step="0.5"
                  className="input-dark bg-slate-50"
                  value={form.target_jam_istirahat}
                  onChange={e => setForm({...form, target_jam_istirahat: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Target Durasi (Hari)</label>
                <input 
                  type="number" 
                  className="input-dark bg-slate-50"
                  value={form.target_durasi_program}
                  onChange={e => setForm({...form, target_durasi_program: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Catatan Dokter</label>
                <textarea 
                  className="input-dark bg-slate-50 min-h-[100px] py-3"
                  value={form.doctor_notes}
                  onChange={e => setForm({...form, doctor_notes: e.target.value})}
                  placeholder="Instruksi tambahan untuk pasien..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={() => setShowProgramForm(false)} className="py-4 rounded-2xl text-sm font-bold text-slate-500 bg-slate-100">Batal</button>
              <button onClick={handleSubmitProgram} className="btn-primary py-4 rounded-2xl text-sm font-bold">Simpan</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active="dashboard" />
    </div>
  );
}
