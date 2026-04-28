'use client';
import { useState } from 'react';
import BottomNav from '@/components/BottomNav';

// ─── Types ───────────────────────────────────────────────────────────────────
type CalcKey = 'bmi' | 'water' | 'phq9' | 'fatigue' | 'bmr' | 'ideal_weight';

interface CalcItem {
  key: CalcKey;
  icon: string;
  label: string;
  color: string;
  desc: string;
}

const CALCS: CalcItem[] = [
  { key: 'bmi', icon: '⚖️', label: 'Kalkulator BMI', color: 'from-emerald-500/20 to-teal-500/10', desc: 'Hitung Indeks Massa Tubuh' },
  { key: 'water', icon: '💧', label: 'Kebutuhan Air', color: 'from-blue-500/20 to-cyan-500/10', desc: 'Air ideal per hari' },
  { key: 'bmr', icon: '🔥', label: 'Kalori Basal (BMR)', color: 'from-orange-500/20 to-red-500/10', desc: 'Kebutuhan kalori harianmu' },
  { key: 'ideal_weight', icon: '🎯', label: 'Berat Badan Ideal', color: 'from-violet-500/20 to-purple-500/10', desc: 'Target berat ideal' },
  { key: 'phq9', icon: '🧠', label: 'PHQ-9 Depresi', color: 'from-pink-500/20 to-rose-500/10', desc: 'Skrining kesehatan mental' },
  { key: 'fatigue', icon: '😴', label: 'Fatigue Assessment', color: 'from-indigo-500/20 to-slate-500/10', desc: 'Tingkat kelelahan' },
];

// ─── PHQ-9 Questions ────────────────────────────────────────────────────────
const PHQ9_QUESTIONS = [
  'Kurang minat atau kesenangan dalam melakukan sesuatu',
  'Merasa sedih, tertekan, atau putus asa',
  'Sulit tidur, sering terbangun, atau tidur terlalu banyak',
  'Merasa lelah atau kurang energi',
  'Nafsu makan berkurang atau makan berlebihan',
  'Merasa kurang percaya diri atau gagal',
  'Sulit berkonsentrasi pada sesuatu',
  'Bergerak atau berbicara begitu lambat sehingga orang lain menyadarinya',
  'Pikiran bahwa lebih baik mati atau menyakiti diri sendiri',
];

const PHQ9_OPTIONS = ['Tidak sama sekali (0)', 'Beberapa hari (1)', 'Lebih dari setengah hari (2)', 'Hampir setiap hari (3)'];

// ─── Fatigue Questions ───────────────────────────────────────────────────────
const FATIGUE_QUESTIONS = [
  'Saya merasa kelelahan',
  'Saya mudah lelah',
  'Saya merasa mengantuk sepanjang hari',
  'Saya tidak bisa berkonsentrasi karena kelelahan',
  'Kelelahan mengganggu pekerjaan saya',
  'Saya butuh istirahat lebih sering',
  'Kelelahan membatasi aktivitas sosial saya',
  'Saya kelelahan bahkan setelah tidur',
  'Saya khawatir tentang tingkat kelelahan saya',
];

export default function HealthCalcPage() {
  const [active, setActive] = useState<CalcKey | null>(null);

  // BMI state
  const [bmiHeight, setBmiHeight] = useState('');
  const [bmiWeight, setBmiWeight] = useState('');
  const [bmiResult, setBmiResult] = useState<{ bmi: number; label: string; color: string } | null>(null);

  // Water state
  const [waterWeight, setWaterWeight] = useState('');
  const [waterActivity, setWaterActivity] = useState('1.0');
  const [waterResult, setWaterResult] = useState<number | null>(null);

  // BMR state
  const [bmrWeight, setBmrWeight] = useState('');
  const [bmrHeight, setBmrHeight] = useState('');
  const [bmrAge, setBmrAge] = useState('');
  const [bmrGender, setBmrGender] = useState('L');
  const [bmrActivity, setBmrActivity] = useState('1.2');
  const [bmrResult, setBmrResult] = useState<{ bmr: number; tdee: number } | null>(null);

  // Ideal Weight state
  const [iwHeight, setIwHeight] = useState('');
  const [iwGender, setIwGender] = useState('L');
  const [iwResult, setIwResult] = useState<{ min: number; max: number } | null>(null);

  // PHQ-9 state
  const [phq9Answers, setPhq9Answers] = useState<number[]>(Array(9).fill(-1));
  const [phq9Result, setPhq9Result] = useState<{ score: number; label: string; color: string; advice: string } | null>(null);

  // Fatigue state
  const [fatigueAnswers, setFatigueAnswers] = useState<number[]>(Array(9).fill(-1));
  const [fatigueResult, setFatigueResult] = useState<{ score: number; label: string; color: string } | null>(null);

  // ── BMI Calculator ─────────────────────────────────────────────────────────
  function calcBMI() {
    const h = parseFloat(bmiHeight) / 100;
    const w = parseFloat(bmiWeight);
    if (!h || !w) return;
    const bmi = w / (h * h);
    let label = '', color = '';
    if (bmi < 18.5) { label = 'Berat Badan Kurang'; color = 'text-blue-400'; }
    else if (bmi < 25) { label = 'Normal / Ideal ✓'; color = 'text-emerald-400'; }
    else if (bmi < 30) { label = 'Kelebihan Berat Badan'; color = 'text-amber-400'; }
    else { label = 'Obesitas'; color = 'text-red-400'; }
    setBmiResult({ bmi: parseFloat(bmi.toFixed(1)), label, color });
  }

  // ── Water Calculator ───────────────────────────────────────────────────────
  function calcWater() {
    const w = parseFloat(waterWeight);
    const a = parseFloat(waterActivity);
    if (!w) return;
    setWaterResult(parseFloat((w * 0.033 * a).toFixed(2)));
  }

  // ── BMR Calculator ─────────────────────────────────────────────────────────
  function calcBMR() {
    const w = parseFloat(bmrWeight), h = parseFloat(bmrHeight), age = parseFloat(bmrAge), act = parseFloat(bmrActivity);
    if (!w || !h || !age) return;
    let bmr = bmrGender === 'L'
      ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * age
      : 447.593 + 9.247 * w + 3.098 * h - 4.330 * age;
    setBmrResult({ bmr: Math.round(bmr), tdee: Math.round(bmr * act) });
  }

  // ── Ideal Weight ───────────────────────────────────────────────────────────
  function calcIdealWeight() {
    const h = parseFloat(iwHeight);
    if (!h) return;
    const base = h - 100;
    const min = iwGender === 'L' ? base * 0.9 : base * 0.85;
    const max = iwGender === 'L' ? base : base * 0.9;
    setIwResult({ min: parseFloat(min.toFixed(1)), max: parseFloat(max.toFixed(1)) });
  }

  // ── PHQ-9 ──────────────────────────────────────────────────────────────────
  function calcPHQ9() {
    if (phq9Answers.includes(-1)) return;
    const score = phq9Answers.reduce((a, b) => a + b, 0);
    let label = '', color = '', advice = '';
    if (score <= 4) { label = 'Minimal / Normal'; color = 'text-emerald-400'; advice = 'Tidak ada indikasi depresi. Pertahankan gaya hidup sehat Anda.'; }
    else if (score <= 9) { label = 'Depresi Ringan'; color = 'text-yellow-400'; advice = 'Perhatikan kesehatan mental Anda. Coba kelola stres dengan olahraga atau meditasi.'; }
    else if (score <= 14) { label = 'Depresi Sedang'; color = 'text-amber-400'; advice = 'Disarankan untuk berkonsultasi dengan profesional kesehatan mental.'; }
    else if (score <= 19) { label = 'Depresi Cukup Berat'; color = 'text-orange-400'; advice = 'Segera hubungi dokter atau psikolog untuk penanganan lebih lanjut.'; }
    else { label = 'Depresi Berat'; color = 'text-red-400'; advice = 'Segera cari pertolongan profesional. Jangan tunda konsultasi dengan dokter.'; }
    setPhq9Result({ score, label, color, advice });
  }

  // ── Fatigue ────────────────────────────────────────────────────────────────
  function calcFatigue() {
    if (fatigueAnswers.includes(-1)) return;
    const score = fatigueAnswers.reduce((a, b) => a + b, 0);
    let label = '', color = '';
    if (score <= 9) { label = 'Kelelahan Minimal'; color = 'text-emerald-400'; }
    else if (score <= 18) { label = 'Kelelahan Ringan'; color = 'text-yellow-400'; }
    else if (score <= 27) { label = 'Kelelahan Sedang'; color = 'text-amber-400'; }
    else { label = 'Kelelahan Berat'; color = 'text-red-400'; }
    setFatigueResult({ score, label, color });
  }

  return (
    <div className="min-h-dvh flex flex-col pb-safe bg-[#f8fafc]">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent" />
        <div className="relative flex items-center gap-3">
          {active && (
            <button onClick={() => { setActive(null); setBmiResult(null); setWaterResult(null); setBmrResult(null); setIwResult(null); setPhq9Result(null); setFatigueResult(null); }} className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
          )}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">Kalkulator Kesehatan</h1>
            <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">{active ? CALCS.find(c => c.key === active)?.desc : 'Pilih Alat Ukur'}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pb-28 space-y-4 animate-slide-up">
        {!active && (
          <div className="grid grid-cols-2 gap-4">
            {CALCS.map(c => (
              <button key={c.key} onClick={() => setActive(c.key)}
                className={`bg-white border border-slate-100 p-5 flex flex-col items-center gap-3 rounded-[2rem] shadow-sm shadow-slate-200/50 hover:scale-[1.03] active:scale-95 transition-transform text-center group`}>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center text-3xl shadow-inner`}>
                  {c.icon}
                </div>
                <div>
                  <p className="text-slate-900 text-sm font-bold leading-tight">{c.label}</p>
                  <p className="text-slate-400 text-[10px] font-medium mt-1 leading-tight">{c.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* BMI Calculator */}
        {active === 'bmi' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
              <InputField label="Tinggi Badan (cm)" value={bmiHeight} onChange={setBmiHeight} placeholder="170" />
              <InputField label="Berat Badan (kg)" value={bmiWeight} onChange={setBmiWeight} placeholder="65" />
              <button onClick={calcBMI} className="btn-primary py-4 shadow-lg shadow-emerald-500/20">Hitung BMI</button>
            </div>
            {bmiResult && (
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-7 text-center space-y-3 shadow-xl shadow-slate-200/50">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Indeks Massa Tubuh</p>
                <p className="text-6xl font-black text-slate-900 tracking-tighter">{bmiResult.bmi.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}</p>
                <div className={`inline-flex px-4 py-1.5 rounded-full text-sm font-bold bg-slate-50 border border-slate-100 ${bmiResult.color}`}>
                  {bmiResult.label}
                </div>
                <div className="mt-6 h-3.5 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/50 shadow-inner">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 via-emerald-400 via-yellow-400 to-red-400 opacity-60" style={{ width: '100%' }} />
                  <div className="absolute inset-y-0 w-1.5 bg-slate-900 rounded-full shadow-lg ring-4 ring-white" style={{ left: `${Math.min((bmiResult.bmi - 10) / 30 * 100, 100)}%` }} />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tight px-1">
                  <span>Kurang</span><span>Normal</span><span>Lebih</span><span>Obesitas</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Water Calculator */}
        {active === 'water' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
              <InputField label="Berat Badan (kg)" value={waterWeight} onChange={setWaterWeight} placeholder="65" />
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Tingkat Aktivitas</label>
                <select value={waterActivity} onChange={e => setWaterActivity(e.target.value)} className="input-dark font-medium">
                  <option value="0.9">Sangat Rendah (jarang gerak)</option>
                  <option value="1.0">Rendah (kerja kantoran)</option>
                  <option value="1.15">Sedang (olahraga 3x/minggu)</option>
                  <option value="1.3">Tinggi (olahraga intensif)</option>
                  <option value="1.4">Sangat Tinggi (atlet)</option>
                </select>
              </div>
              <button onClick={calcWater} className="btn-primary py-4 shadow-lg shadow-emerald-500/20">Hitung Kebutuhan Air</button>
            </div>
            {waterResult !== null && (
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 text-center space-y-3 shadow-xl shadow-slate-200/50">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 flex items-center justify-center text-3xl mx-auto shadow-sm border border-blue-100 mb-2">💧</div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Target Air Harian</p>
                <p className="text-6xl font-black text-blue-600 tracking-tighter">{waterResult.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} <span className="text-2xl ml-1">L</span></p>
                <p className="text-slate-500 text-sm font-bold bg-blue-50/50 py-2 rounded-2xl border border-blue-100/50">≈ {Math.round(waterResult * 1000 / 250)} gelas (250ml)</p>
              </div>
            )}
          </div>
        )}

        {/* BMR Calculator */}
        {active === 'bmr' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-5">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-3">Jenis Kelamin</label>
                <div className="flex gap-3">
                  {[['L', 'Laki-laki', '♂️'], ['P', 'Perempuan', '♀️']].map(([v, l, e]) => (
                    <button key={v} onClick={() => setBmrGender(v)} className={`flex-1 py-3 rounded-2xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-2 ${bmrGender === v ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'border-slate-100 bg-slate-50/50 text-slate-400'}`}>{e} {l}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Berat (kg)" value={bmrWeight} onChange={setBmrWeight} placeholder="65" />
                <InputField label="Tinggi (cm)" value={bmrHeight} onChange={setBmrHeight} placeholder="170" />
              </div>
              <InputField label="Usia (tahun)" value={bmrAge} onChange={setBmrAge} placeholder="30" />
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Tingkat Aktivitas</label>
                <select value={bmrActivity} onChange={e => setBmrActivity(e.target.value)} className="input-dark font-medium">
                  <option value="1.2">Sedentary (tidak banyak gerak)</option>
                  <option value="1.375">Ringan (olahraga 1-3x/minggu)</option>
                  <option value="1.55">Sedang (olahraga 3-5x/minggu)</option>
                  <option value="1.725">Tinggi (olahraga 6-7x/minggu)</option>
                  <option value="1.9">Sangat Tinggi (atlet/kerja fisik)</option>
                </select>
              </div>
              <button onClick={calcBMR} className="btn-primary py-4 shadow-lg shadow-emerald-500/20">Hitung Kalori</button>
            </div>
            {bmrResult && (
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-7 space-y-6 shadow-xl shadow-slate-200/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-5 rounded-3xl bg-slate-50 border border-slate-100">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">BMR</p>
                    <p className="text-3xl font-black text-slate-900">{bmrResult.bmr.toLocaleString('id-ID')}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">kkal/hari</p>
                  </div>
                  <div className="text-center p-5 rounded-3xl bg-emerald-50 border border-emerald-100">
                    <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-wider mb-1">TDEE</p>
                    <p className="text-3xl font-black text-emerald-700">{bmrResult.tdee.toLocaleString('id-ID')}</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase">kkal/hari</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest text-center">Estimasi Makronutrisi</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100"><p className="text-blue-600 text-sm font-bold">{Math.round(bmrResult.tdee * 0.45 / 4)}g</p><p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Karbo</p></div>
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100"><p className="text-emerald-600 text-sm font-bold">{Math.round(bmrResult.tdee * 0.3 / 4)}g</p><p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Protein</p></div>
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100"><p className="text-amber-600 text-sm font-bold">{Math.round(bmrResult.tdee * 0.25 / 9)}g</p><p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Lemak</p></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ideal Weight */}
        {active === 'ideal_weight' && (
          <div className="space-y-4">
            <div className="glass-card p-5 space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">Jenis Kelamin</label>
                <div className="flex gap-3">
                  {[['L', 'Laki-laki'], ['P', 'Perempuan']].map(([v, l]) => (
                    <button key={v} onClick={() => setIwGender(v)} className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${iwGender === v ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-white/10 text-slate-400'}`}>{l}</button>
                  ))}
                </div>
              </div>
              <InputField label="Tinggi Badan (cm)" value={iwHeight} onChange={setIwHeight} placeholder="170" />
              <button onClick={calcIdealWeight} className="btn-primary">Hitung Berat Ideal</button>
            </div>
            {iwResult && (
              <div className="glass-card p-6 text-center space-y-2">
                <p className="text-3xl">🎯</p>
                <p className="text-slate-400 text-sm">Berat Badan Ideal Anda</p>
                <p className="text-4xl font-bold text-violet-400">{iwResult.min.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} – {iwResult.max.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} <span className="text-xl">kg</span></p>
                <p className="text-slate-500 text-xs">Berdasarkan metode Broca yang dimodifikasi</p>
              </div>
            )}
          </div>
        )}

        {/* PHQ-9 */}
        {active === 'phq9' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
              <p className="text-slate-500 text-xs leading-relaxed font-medium">Selama 2 minggu terakhir, seberapa sering Anda terganggu oleh masalah berikut?</p>
            </div>
            {PHQ9_QUESTIONS.map((q, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm">
                <p className="text-slate-900 text-sm font-bold leading-relaxed">{i + 1}. {q}</p>
                <div className="grid grid-cols-2 gap-2">
                  {PHQ9_OPTIONS.map((opt, j) => (
                    <button key={j} onClick={() => { const a = [...phq9Answers]; a[i] = j; setPhq9Answers(a); }}
                      className={`py-3 px-4 rounded-2xl text-[10px] font-bold border transition-all ${phq9Answers[i] === j ? 'border-pink-500 bg-pink-50 text-pink-700 shadow-sm' : 'border-slate-50 bg-slate-50 text-slate-400'}`}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={calcPHQ9} disabled={phq9Answers.includes(-1)} className="btn-primary py-4 shadow-lg shadow-pink-500/20">Lihat Hasil Asesmen</button>
            {phq9Result && (
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 space-y-5 shadow-xl shadow-slate-200/50">
                <div className="text-center">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Hasil Skrining</p>
                  <p className="text-6xl font-black text-slate-900 mt-2">{phq9Result.score}</p>
                  <p className={`text-lg font-bold mt-2 ${phq9Result.color}`}>{phq9Result.label}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                  <p className="text-slate-600 text-sm leading-relaxed font-medium">{phq9Result.advice}</p>
                </div>
                <p className="text-slate-400 text-[10px] text-center font-bold uppercase tracking-tight">Penting: Hasil ini bukan diagnosis medis profesional.</p>
              </div>
            )}
          </div>
        )}

        {/* Fatigue Assessment */}
        {active === 'fatigue' && (
          <div className="space-y-4">
            <div className="glass-card p-4">
              <p className="text-slate-400 text-xs leading-relaxed">Nilai kesesuaian setiap pernyataan dengan kondisi Anda dalam 2 minggu terakhir (1 = Sangat tidak setuju, 4 = Sangat setuju).</p>
            </div>
            {FATIGUE_QUESTIONS.map((q, i) => (
              <div key={i} className="glass-card p-4 space-y-3">
                <p className="text-gray-600 text-sm font-medium">{i + 1}. {q}</p>
                <div className="flex gap-2 justify-between">
                  {[1, 2, 3, 4].map(v => (
                    <button key={v} onClick={() => { const a = [...fatigueAnswers]; a[i] = v; setFatigueAnswers(a); }}
                      className={`flex-1 py-2.5 rounded-xl text-sm border font-semibold transition-all ${fatigueAnswers[i] === v ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-white/10 text-slate-400'}`}>
                      {v}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Tidak setuju</span><span>Sangat setuju</span>
                </div>
              </div>
            ))}
            <button onClick={calcFatigue} disabled={fatigueAnswers.includes(-1)} className="btn-primary">Lihat Hasil</button>
            {fatigueResult && (
              <div className="glass-card p-5 text-center space-y-2">
                <p className="text-slate-400 text-sm">Skor Kelelahan</p>
                <p className="text-5xl font-bold text-white">{fatigueResult.score}<span className="text-2xl">/36</span></p>
                <p className={`text-lg font-semibold ${fatigueResult.color}`}>{fatigueResult.label}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav active="calc" />
    </div>
  );
}

// ─── Reusable Input ──────────────────────────────────────────────────────────
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
