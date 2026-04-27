'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PageHeader from '@/components/PageHeader';
import SuccessModal from '@/components/SuccessModal';
import ConfirmModal from '@/components/ConfirmModal';
import CameraScanner from '@/components/CameraScanner';

export default function MealLogPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const [programId, setProgramId] = useState<number | null>(null);
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: 'Tersimpan!', message: '' });

  const [mealTime, setMealTime] = useState('snack');
  const [loggedAt, setLoggedAt] = useState('');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });

  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (userId) {
      // Auto-select meal time based on hour
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 11) setMealTime('sarapan');
      else if (hour >= 11 && hour < 15) setMealTime('makan siang');
      else if (hour >= 17 && hour < 21) setMealTime('makan malam');
      else setMealTime('snack');

      // Set default loggedAt time
      setLoggedAt(new Date().toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' }));

      fetch(`/api/program/${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.program) {
            setProgramId(data.program.id);
            fetchMeals(data.program.id, logDate);
          } else {
            setLoading(false);
          }
        });
    }
  }, [userId, logDate]);

  // Debounced search for food nutrition
  useEffect(() => {
    const timer = setTimeout(() => {
      if (foodName.length > 2 && showDropdown) {
        setIsSearching(true);
        fetch(`/api/program/nutrition/search?query=${encodeURIComponent(foodName)}`)
          .then(res => res.json())
          .then(data => {
            setSearchResults(data.results || []);
          })
          .catch(e => console.error(e))
          .finally(() => setIsSearching(false));
      } else {
        setSearchResults([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [foodName, showDropdown]);

  const handleSelectFood = (food: any) => {
    setFoodName(food.name);
    setCalories(String(food.calories));
    setProtein(String(food.protein_g));
    setFat(String(food.fat_g));
    setCarbs(String(food.carbs_g));
    setShowDropdown(false);
  };

  const fetchMeals = async (pid: number, date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/program/detailed-logs?program_id=${pid}&log_date=${date}`);
      const data = await res.json();
      setMeals(data.meals || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programId || !foodName || !calories) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/program/log/meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: programId,
          log_date: logDate,
          meal_time: mealTime,
          logged_at: loggedAt,
          food_name: foodName,
          calories: parseInt(calories),
          protein_g: parseFloat(protein || '0'),
          fat_g: parseFloat(fat || '0'),
          carbs_g: parseFloat(carbs || '0'),
        })
      });
      if (res.ok) {
        setFoodName('');
        setCalories('');
        setProtein('');
        setFat('');
        setCarbs('');
        fetchMeals(programId, logDate);
        setModalConfig({ title: 'Tersimpan!', message: 'Data makanan berhasil ditambahkan ke log harian.' });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMeal = (id: number) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const executeDeleteMeal = async () => {
    const id = confirmDelete.id;
    if (!programId || !id) return;
    setConfirmDelete({ isOpen: false, id: null });
    try {
      const res = await fetch(`/api/program/log/meal/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMeals(programId, logDate);
        setModalConfig({ title: 'Terhapus!', message: 'Data makanan telah dihapus dari log.' });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);

  return (
    <div className="min-h-dvh flex flex-col pb-safe bg-[#f8fafc]">
      <PageHeader title="Log Kalori Makan" subtitle="Catat asupan nutrisi Anda hari ini" />

      <SuccessModal
        isOpen={saved}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => setSaved(false)}
        autoRedirect={false}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Hapus Makanan?"
        message="Data ini akan dihapus secara permanen dari log harian Anda."
        variant="danger"
        onConfirm={executeDeleteMeal}
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
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] p-6 text-white shadow-xl shadow-emerald-500/20">
          <p className="text-emerald-100 text-sm font-semibold uppercase tracking-wider mb-1">Total Kalori Hari Ini</p>
          <p className="text-4xl font-black">{totalCalories} <span className="text-lg font-medium">kcal</span></p>
        </div>

        {/* Add Meal Form */}
        <form onSubmit={handleAddMeal} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            Tambah Makanan
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2.5 ml-1">Waktu Makan</label>
              <select className="input-dark w-full font-semibold" value={mealTime} onChange={e => setMealTime(e.target.value)}>
                <option value="sarapan">🌅 Sarapan</option>
                <option value="makan siang">☀️ Makan Siang</option>
                <option value="makan malam">🌙 Makan Malam</option>
                <option value="snack">🍿 Snack / Cemilan</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2.5 ml-1">Jam Makan</label>
              <input
                type="time"
                className="input-dark w-full font-semibold"
                value={loggedAt}
                onChange={e => setLoggedAt(e.target.value)}
              />
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Nama Makanan</label>
              <button
                type="button"
                onClick={() => setIsScanning(true)}
                className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl flex items-center gap-1 hover:bg-emerald-100 transition-colors"
              >
                <span>📷</span> Scan Makanan AI
              </button>
            </div>
            <input
              required
              type="text"
              placeholder="Contoh: Nasi Goreng, Dada Ayam..."
              className="input-dark w-full"
              value={foodName}
              onChange={e => {
                setFoodName(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
            />
            {showDropdown && (foodName.length > 2) && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">Mencari database nutrisi...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((result, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full text-left p-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex flex-col gap-0.5"
                      onClick={() => handleSelectFood(result)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-sm">{result.name}</span>
                        {result.category && (
                          <span className="text-[9px] font-black uppercase tracking-tighter bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                            {result.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                        <span>🔥 {result.calories} kkal</span>
                        <span>💪 {result.protein_g}g P</span>
                        <span>🥑 {result.fat_g}g L</span>
                        <span>🍚 {result.carbs_g}g K</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400 text-xs font-bold uppercase tracking-wider flex justify-between items-center">
                    <span>Tidak ditemukan.</span>
                    <button type="button" onClick={() => setShowDropdown(false)} className="text-emerald-500 hover:underline">Tutup</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kalori (kcal)</label>
              <input required type="number" placeholder="0" className="input-dark w-full" value={calories} onChange={e => setCalories(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Protein (g)</label>
              <input type="number" placeholder="0" className="input-dark w-full" value={protein} onChange={e => setProtein(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lemak (g)</label>
              <input type="number" placeholder="0" className="input-dark w-full" value={fat} onChange={e => setFat(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Karbo (g)</label>
              <input type="number" placeholder="0" className="input-dark w-full" value={carbs} onChange={e => setCarbs(e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={isSaving || !programId} className="w-full btn-primary py-4 mt-2">
            {isSaving ? 'Menyimpan...' : '➕ Tambah Makanan'}
          </button>
        </form>

        {/* Meal List */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-900 px-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Riwayat Makan
          </h3>

          {loading ? (
            <p className="text-center text-slate-400 text-sm py-4">Memuat data...</p>
          ) : meals.length > 0 ? (
            meals.map(m => (
              <div key={m.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between group">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md mb-1 inline-block">
                    {m.meal_time} {m.logged_at ? `• ${m.logged_at.substring(0, 5)}` : ''}
                  </span>
                  <p className="text-slate-900 font-bold">{m.food_name}</p>
                  <p className="text-slate-500 text-xs mt-1">P: {m.protein_g}g • L: {m.fat_g}g • K: {m.carbs_g}g</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-emerald-600 font-black">{m.calories}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">kcal</p>
                  </div>
                  <button onClick={() => handleDeleteMeal(m.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-3xl p-8 text-center">
              <p className="text-slate-400 text-sm font-medium">Belum ada catatan makan untuk tanggal ini.</p>
            </div>
          )}
        </div>
      </div>

      {isScanning && (
        <CameraScanner
          onClose={() => setIsScanning(false)}
          onScanComplete={(result) => {
            handleSelectFood(result);
            setIsScanning(false);
          }}
        />
      )}
    </div>
  );
}
