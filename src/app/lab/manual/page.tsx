'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SuccessModal from '@/components/SuccessModal';
import PageHeader from '@/components/PageHeader';

const FIELDS = [
  { key: 'berat_badan',        label: 'Berat Badan',            unit: 'kg',    placeholder: '60',      normal: 'Tergantung BMI' },
  { key: 'tinggi_badan',       label: 'Tinggi Badan',           unit: 'cm',    placeholder: '170',     normal: '-'              },
  { key: 'gula_darah_puasa',   label: 'Gula Darah Puasa',      unit: 'mg/dL', placeholder: '70–100',  normal: '70 – 100 mg/dL' },
  { key: 'kolesterol_total',   label: 'Kolesterol Total',       unit: 'mg/dL', placeholder: '< 200',   normal: '< 200 mg/dL'    },
  { key: 'hdl',                label: 'HDL (Kolesterol Baik)',  unit: 'mg/dL', placeholder: '> 40',    normal: '> 40 mg/dL'     },
  { key: 'ldl',                label: 'LDL (Kolesterol Jahat)', unit: 'mg/dL', placeholder: '< 130',   normal: '< 130 mg/dL'    },
  { key: 'trigliserida',       label: 'Trigliserida',           unit: 'mg/dL', placeholder: '< 150',   normal: '< 150 mg/dL'    },
  { key: 'asam_urat',          label: 'Asam Urat',              unit: 'mg/dL', placeholder: '2.4–7.0', normal: '2.4–7.0 mg/dL'  },
  { key: 'hemoglobin',         label: 'Hemoglobin',             unit: 'g/dL',  placeholder: '11.5–17.5',normal: '11.5–17.5 g/dL' },
  { key: 'tekanan_sistolik',   label: 'Tekanan Darah Sistolik', unit: 'mmHg',  placeholder: '90–130',  normal: '90–130 mmHg'    },
  { key: 'tekanan_diastolik',  label: 'Tekanan Darah Diastolik',unit: 'mmHg', placeholder: '60–85',   normal: '60–85 mmHg'     },
  { key: 'sgot',               label: 'SGOT (AST)',             unit: 'U/L',   placeholder: '< 40',    normal: '< 40 U/L'       },
  { key: 'sgpt',               label: 'SGPT (ALT)',             unit: 'U/L',   placeholder: '< 41',    normal: '< 41 U/L'       },
  { key: 'kreatinin',          label: 'Kreatinin',              unit: 'mg/dL', placeholder: '0.6–1.2', normal: '0.6–1.2 mg/dL'  },
];

export default function ManualLabPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const router = useRouter();

  const [values, setValues] = useState<Record<string, string>>({});
  const [labDate, setLabDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [profile, setProfile] = useState<any>(null);
  const [screeningData, setScreeningData] = useState({
    family_history: '',
    accident_history: '',
    serious_illness_history: '',
    is_smoker: false,
    smoking_duration: '',
    drinks_alcohol: false,
    alcohol_duration: '',
    ktp_number: ''
  });

  useEffect(() => {
    // Check for prefilled data from OCR extraction
    const extractedDataStr = sessionStorage.getItem('extractedLabData');
    if (extractedDataStr) {
      try {
        const extractedData = JSON.parse(extractedDataStr);
        setValues(prev => ({ ...prev, ...extractedData }));
        // Clear it so it doesn't persist forever
        sessionStorage.removeItem('extractedLabData');
      } catch (e) {
        console.error('Failed to parse extracted data', e);
      }
    }

    if (userId) {
      // Fetch latest lab results to pre-fill
      fetch('/api/lab/results/latest')
        .then(r => r.json())
        .then(d => {
          if (d.labResult) {
            const params: Record<string, string> = {};
            d.parameters?.forEach((p: any) => {
              params[p.parameter_name] = p.value;
            });
            setValues(params);
            if (d.labResult.lab_date) {
              setLabDate(new Date(d.labResult.lab_date).toISOString().split('T')[0]);
            }
            // Pre-fill screening data
            setScreeningData(prev => ({
              ...prev,
              family_history: d.labResult.family_history || '',
              accident_history: d.labResult.accident_history || '',
              serious_illness_history: d.labResult.serious_illness_history || '',
              is_smoker: !!d.labResult.is_smoker,
              smoking_duration: d.labResult.smoking_duration || '',
              drinks_alcohol: !!d.labResult.drinks_alcohol,
              alcohol_duration: d.labResult.alcohol_duration || '',
              ktp_number: d.labResult.ktp_number || prev.ktp_number || ''
            }));
          }
        });

      fetch(`/api/users/${userId}/profile`)
        .then(r => r.json())
        .then(d => {
          if (d.user) {
            setProfile(d.user);
            if (d.user.ktp_number) {
              setScreeningData(prev => ({ ...prev, ktp_number: d.user.ktp_number }));
            }
          }
        });
    }
  }, [userId]);

  function setValue(key: string, val: string) {
    setValues(prev => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    
    if (!screeningData.ktp_number) { 
      setError('Nomor KTP wajib diisi di bagian screening.'); 
      setLoading(false); 
      return; 
    }

    try {
      const filled = Object.entries(values).filter(([, v]) => v !== '');
      if (filled.length === 0) { setError('Isi minimal satu parameter lab.'); setLoading(false); return; }

      // Update KTP in profile if it was empty before
      if (!profile?.ktp_number && screeningData.ktp_number) {
        await fetch(`/api/users/${userId}/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ktp_number: screeningData.ktp_number })
        });
      }

      const res = await fetch('/api/lab/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          lab_date: labDate, 
          parameters: values,
          ...screeningData
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan data');
      setSaved(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col pb-safe bg-[#f8fafc]">
      <PageHeader 
        title="Input Data Lab" 
        subtitle="Hasil Medical Checkup" 
      />

      <form onSubmit={handleSubmit} className="flex-1 px-4 pb-24 space-y-6 animate-slide-up mt-4">
        <SuccessModal 
          isOpen={saved} 
          title="Data Tersimpan!" 
          message="Hasil laboratorium dan screening kesehatan Anda telah berhasil dicatat ke dalam sistem." 
          onClose={() => router.push('/dashboard')}
          autoRedirect={false}
        />

        {/* Date */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            📅 Tanggal Pemeriksaan
          </label>
          <input type="date" value={labDate} onChange={e => setLabDate(e.target.value)} className="input-dark font-medium" max={new Date().toISOString().split('T')[0]} />
        </div>

        {/* Screening Form */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            Screening Kesehatan
          </h3>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              No. KTP {profile?.ktp_number ? '(Sudah Terverifikasi)' : '(Wajib)'}
            </label>
            <input 
              type="text" 
              className={`input-dark ${profile?.ktp_number ? 'opacity-70 bg-slate-100/10' : ''}`} 
              placeholder="317xxxxxxxxxxxxx"
              value={screeningData.ktp_number} 
              onChange={e => !profile?.ktp_number && setScreeningData({...screeningData, ktp_number: e.target.value})}
              readOnly={!!profile?.ktp_number}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Riwayat Penyakit Keluarga</label>
            <textarea 
              className="input-dark min-h-[80px] py-3" placeholder="Diabetes, Hipertensi, dll..."
              value={screeningData.family_history} onChange={e => setScreeningData({...screeningData, family_history: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Riwayat Kecelakaan / Sakit Berat</label>
            <textarea 
              className="input-dark min-h-[80px] py-3" placeholder="Pernah operasi, patah tulang, dll..."
              value={screeningData.serious_illness_history} onChange={e => setScreeningData({...screeningData, serious_illness_history: e.target.value})}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <div>
              <p className="text-sm font-bold text-slate-900">Apakah Anda Merokok?</p>
              {screeningData.is_smoker && (
                <input 
                  type="text" placeholder="Berapa lama?" className="text-xs bg-transparent border-b border-slate-200 mt-1 outline-none w-full"
                  value={screeningData.smoking_duration} onChange={e => setScreeningData({...screeningData, smoking_duration: e.target.value})}
                />
              )}
            </div>
            <button 
              type="button"
              onClick={() => setScreeningData({...screeningData, is_smoker: !screeningData.is_smoker})}
              className={`w-12 h-6 rounded-full transition-all relative ${screeningData.is_smoker ? 'bg-emerald-500' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${screeningData.is_smoker ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <div>
              <p className="text-sm font-bold text-slate-900">Konsumsi Alkohol?</p>
              {screeningData.drinks_alcohol && (
                <input 
                  type="text" placeholder="Berapa lama?" className="text-xs bg-transparent border-b border-slate-200 mt-1 outline-none w-full"
                  value={screeningData.alcohol_duration} onChange={e => setScreeningData({...screeningData, alcohol_duration: e.target.value})}
                />
              )}
            </div>
            <button 
              type="button"
              onClick={() => setScreeningData({...screeningData, drinks_alcohol: !screeningData.drinks_alcohol})}
              className={`w-12 h-6 rounded-full transition-all relative ${screeningData.drinks_alcohol ? 'bg-emerald-500' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${screeningData.drinks_alcohol ? 'right-1' : 'left-1'}`} />
            </button>
          </div>
        </div>

        {/* Fields */}
        <h3 className="font-bold text-slate-900 px-2 pt-2">Parameter Medis</h3>
        {FIELDS.map(f => (
          <div key={f.key} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm group">
            <div className="flex items-center justify-between mb-3">
              <label className="text-slate-900 text-sm font-bold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {f.label}
              </label>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg uppercase tracking-tight">{f.unit}</span>
            </div>
            <div className="relative">
              <input
                type="number" step="0.01"
                value={values[f.key] || ''}
                onChange={e => setValue(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="input-dark pr-16 font-semibold"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] font-bold uppercase">{f.unit}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 px-1">
              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter bg-emerald-50 px-1.5 py-0.5 rounded">Rujukan:</span>
              <p className="text-slate-500 text-xs font-medium">{f.normal}</p>
            </div>
          </div>
        ))}

        {error && <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-sm font-bold text-center">{error}</div>}

        <button type="submit" disabled={loading} className="btn-primary py-4 text-base shadow-xl shadow-emerald-500/20">
          {loading ? '⏳ Menyimpan...' : '💾 Simpan Data Lab & Screening'}
        </button>
      </form>
    </div>
  );
}
