'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

interface Doctor {
  id: number;
  name: string;
  email: string;
  specialization?: string;
  hospital_affiliation?: string;
  bio?: string;
  rating: number;
  total_patients: number;
  quota: number;
  remaining_slots: number;
  profile_photo_url?: string;
}

export default function SelectDoctorPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/doctors')
      .then((r) => r.json())
      .then((d) => setDoctors(d.doctors || []))
      .finally(() => setLoading(false));
  }, []);

  async function selectDoctor(doctorId: number) {
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) return;
    setSelecting(doctorId);
    try {
      const labRes = await fetch('/api/lab/results/latest');
      const labData = labRes.ok ? await labRes.json() : {};

      const res = await fetch('/api/program/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: doctorId,
          lab_result_id: labData.labResult?.id,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/dashboard'), 2000);
      }
    } finally {
      setSelecting(null);
    }
  }

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.round(rating) ? 'text-amber-400' : 'text-slate-600'}>★</span>
    ));
  }

  return (
    <div className="min-h-dvh flex flex-col pb-safe bg-[#f8fafc]">
      <div className="relative px-5 pt-14 pb-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent" />
        <div className="relative">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">Pilih Dokter</h1>
          <p className="text-slate-500 text-xs mt-2 font-medium">Temukan pendamping ahli untuk perjalanan kesehatan Anda.</p>
        </div>
      </div>

      <div className="flex-1 px-4 pb-28 space-y-4 animate-slide-up">
        {success && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 text-center shadow-sm">
            <p className="text-emerald-700 font-bold flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              ✓ Permintaan Terkirim!
            </p>
            <p className="text-slate-500 text-[11px] mt-1 font-medium uppercase tracking-wider">Dokter akan segera meninjau hasil lab Anda.</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Mencari Dokter...</p>
          </div>
        ) : doctors.map((doc) => (
          <div key={doc.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm shadow-slate-200/50 group">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 text-3xl shadow-inner group-hover:scale-105 transition-transform">
                {doc.profile_photo_url ? (
                  <img src={doc.profile_photo_url} alt="" className="w-full h-full rounded-3xl object-cover" />
                ) : '👨‍⚕️'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-slate-900 font-bold text-lg truncate leading-tight">{doc.name}</h3>
                <p className="text-emerald-600 text-[11px] font-bold uppercase tracking-wide mt-1">{doc.specialization || 'Dokter Umum'}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>
                  <p className="text-slate-400 text-[11px] font-medium truncate">{doc.hospital_affiliation}</p>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex text-xs">{renderStars(Number(doc.rating) || 0)}</div>
                  <span className="text-slate-900 text-xs font-black">{(Number(doc.rating) || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}</span>
                  <span className="text-slate-200 text-xs">•</span>
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">{doc.total_patients} Pasien</span>
                </div>
              </div>
            </div>
            {doc.bio && (
              <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                <p className="text-slate-500 text-xs leading-relaxed font-medium line-clamp-2">{doc.bio}</p>
              </div>
            )}
            <div className="flex items-center justify-between mt-5">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${
                doc.remaining_slots > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${doc.remaining_slots > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {doc.remaining_slots > 0 ? `${doc.remaining_slots} Slot Tersisa` : 'Penuh'}
                </span>
              </div>
              <button
                id={`select-doctor-${doc.id}`}
                onClick={() => selectDoctor(doc.id)}
                disabled={selecting === doc.id || doc.remaining_slots <= 0}
                className="btn-primary py-3 px-8 text-sm shadow-lg shadow-emerald-500/20"
              >
                {selecting === doc.id ? '...' : 'Pilih Dokter'}
              </button>
            </div>
          </div>
        ))}
      </div>
      <BottomNav active="program" />
    </div>
  );
}
