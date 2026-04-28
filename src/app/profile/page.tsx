'use client';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import BottomNav from '@/components/BottomNav';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  ktp_number?: string;
  blood_type?: string;
  emergency_contact?: string;
  emergency_contact_name?: string;
  avatar_url?: string;
  company_name?: string;
  department?: string;
  employee_id?: string;
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-3xl">
        <div className="w-20 h-20 rounded-full bg-slate-100" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-slate-100 rounded w-2/3" />
          <div className="h-4 bg-slate-100 rounded w-1/2" />
          <div className="h-3 bg-slate-100 rounded w-1/3" />
        </div>
      </div>
      {[1,2,3].map(i => (
        <div key={i} className="bg-white border border-slate-100 rounded-3xl p-4 space-y-3">
          <div className="h-4 bg-slate-100 rounded w-1/4" />
          {[1,2,3].map(j => (
            <div key={j} className="flex justify-between">
              <div className="h-3 bg-slate-100 rounded w-1/3" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-start gap-4 py-4 border-b border-slate-50 last:border-0 group">
      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg flex-shrink-0 group-hover:bg-emerald-50 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-slate-900 text-sm font-bold break-words">{value || '-'}</p>
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm overflow-hidden">
      <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {title}
      </p>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<UserProfile>>({});
  const [saveMsg, setSaveMsg] = useState('');

  const userId = (session?.user as { id?: string })?.id;
  
  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/users/${userId}/profile`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.user) {
          setProfile(d.user);
          setForm(d.user);
        } else {
          setProfile({
            id: Number(userId),
            name: session?.user?.name || '',
            email: session?.user?.email || '',
          });
          setForm({
            name: session?.user?.name || '',
            email: session?.user?.email || '',
          });
        }
      })
      .catch(() => {
        setProfile({
          id: Number(userId),
          name: session?.user?.name || '',
          email: session?.user?.email || '',
        });
      })
      .finally(() => setLoading(false));
  }, [userId, session]);

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const d = await res.json();
        setProfile(d.user || { ...profile, ...form } as UserProfile);
        setEditing(false);
        setSaveMsg('Profil berhasil disimpan!');
        setTimeout(() => setSaveMsg(''), 3000);
      } else {
        setSaveMsg('Gagal menyimpan. Coba lagi.');
      }
    } catch {
      setSaveMsg('Gagal menyimpan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  return (
    <div className="min-h-dvh flex flex-col pb-safe bg-[#f8fafc]">
      {/* Header */}
      <div className="relative px-5 pt-14 pb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-transparent" />
        <div className="relative flex items-center gap-3">
          <Link href="/dashboard" className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600 active:scale-95 transition-transform">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-900">Profil Saya</h1>
            <p className="text-slate-500 text-[11px] font-medium uppercase tracking-wider">Informasi Akun</p>
          </div>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={saving}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
              editing ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600 border border-slate-100'
            }`}
          >
            {saving ? '⏳...' : editing ? '✓ Simpan' : '✏️ Edit'}
          </button>
        </div>
      </div>

      <div className="flex-1 px-4 space-y-4 pb-32 animate-slide-up">
        {saveMsg && (
          <div className={`p-4 rounded-2xl text-center text-xs font-bold ${saveMsg.includes('berhasil') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
            {saveMsg}
          </div>
        )}

        {loading ? <ProfileSkeleton /> : (
          <>
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center text-center">
              <div className="relative mb-4 group">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-white shadow-xl transition-transform group-hover:scale-105">
                  {initials}
                </div>
              </div>
              <p className="text-slate-900 font-black text-xl mb-1">{profile?.name}</p>
              <p className="text-slate-500 text-sm font-medium">{profile?.email}</p>
              <div className="mt-4 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                ID Karyawan: {profile?.employee_id || '-'}
              </div>
            </div>

            {editing ? (
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-7 space-y-6 shadow-sm">
                <div className="space-y-4">
                  <EditField label="Nama Lengkap" value={form.name || ''} onChange={v => setForm({...form, name: v})} />
                  <EditField label="Email" value={form.email || ''} onChange={v => setForm({...form, email: v})} />
                  <EditField label="No. Telepon" value={form.phone || ''} onChange={v => setForm({...form, phone: v})} />
                  <EditField label="No. KTP" value={form.ktp_number || ''} onChange={v => setForm({...form, ktp_number: v})} />
                  <EditField label="Tanggal Lahir" value={form.birth_date || ''} type="date" onChange={v => setForm({...form, birth_date: v})} />
                  <EditField label="Alamat" value={form.address || ''} onChange={v => setForm({...form, address: v})} />
                  <div className="grid grid-cols-2 gap-4">
                    <EditField label="Golongan Darah" value={form.blood_type || ''} onChange={v => setForm({...form, blood_type: v})} />
                    <div>
                      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Gender</label>
                      <select 
                        value={form.gender || ''} 
                        onChange={e => setForm({...form, gender: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        <option value="">Pilih</option>
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                  </div>
                  <hr className="border-slate-50" />
                  <EditField label="Kontak Darurat" value={form.emergency_contact_name || ''} onChange={v => setForm({...form, emergency_contact_name: v})} placeholder="Nama Kontak" />
                  <EditField label="No. Kontak Darurat" value={form.emergency_contact || ''} onChange={v => setForm({...form, emergency_contact: v})} placeholder="0812..." />
                </div>
              </div>
            ) : (
              <>
                <SectionCard title="👤 Data Pribadi">
                  <InfoRow label="Nama Lengkap" value={profile?.name || ''} icon="🪪" />
                  <InfoRow label="No. Telepon" value={profile?.phone || '-'} icon="📞" />
                  <InfoRow label="No. KTP" value={profile?.ktp_number || '-'} icon="🆔" />
                  <InfoRow label="Tanggal Lahir" value={formatDate(profile?.birth_date)} icon="🎂" />
                  <InfoRow label="Jenis Kelamin" value={profile?.gender === 'L' ? 'Laki-laki' : profile?.gender === 'P' ? 'Perempuan' : '-'} icon="🚻" />
                  <InfoRow label="Golongan Darah" value={profile?.blood_type || '-'} icon="🩸" />
                  <InfoRow label="Alamat" value={profile?.address || '-'} icon="📍" />
                </SectionCard>

                <SectionCard title="🏢 Informasi Pekerjaan">
                  <InfoRow label="Perusahaan" value={profile?.company_name || '-'} icon="🏢" />
                  <InfoRow label="Departemen" value={profile?.department || '-'} icon="📂" />
                  <InfoRow label="ID Karyawan" value={profile?.employee_id || '-'} icon="🔖" />
                </SectionCard>

                <SectionCard title="🚨 Kontak Darurat">
                  <InfoRow label="Nama Kontak" value={profile?.emergency_contact_name || '-'} icon="👤" />
                  <InfoRow label="No. Telepon" value={profile?.emergency_contact || '-'} icon="☎️" />
                </SectionCard>

                <button 
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="w-full py-4 rounded-[2rem] text-red-500 font-black text-sm bg-red-50 border border-red-100 active:scale-95 transition-all shadow-sm"
                >
                  🚪 Keluar dari Akun
                </button>
              </>
            )}
          </>
        )}
      </div>

      <BottomNav active="profile" />
    </div>
  );
}

function EditField({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">{label}</label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-300"
      />
    </div>
  );
}
