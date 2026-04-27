'use client';
import { useSession } from 'next-auth/react';
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
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
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
  const userRole = (session?.user as { role?: string })?.role;
  const firstName = session?.user?.name?.split(' ')[0] || 'User';

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/users/${userId}/profile`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.user) {
          setProfile(d.user);
          setForm(d.user);
        } else {
          // Fallback from session
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
        setForm({
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
        setTimeout(() => setSaveMsg(''), 3000);
      }
    } catch {
      setSaveMsg('Gagal menyimpan. Coba lagi.');
      setTimeout(() => setSaveMsg(''), 3000);
    } finally {
      setSaving(false);
    }
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  const initials = profile?.name
    ? profile.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="min-h-dvh flex flex-col pb-safe bg-[#f8fafc]">

      {/* ── HERO HEADER ──────────────────────────────────────────── */}
      <div className="relative px-5 pt-14 pb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-indigo-500/5 to-transparent" />
        <div className="absolute -top-10 -right-10 w-56 h-56 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-3">
          <Link href="/dashboard" className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors">
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
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm ${
              editing ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600 border border-slate-100'
            }`}
          >
            {saving ? '⏳...' : editing ? '✓ Simpan' : '✏️ Edit'}
          </button>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────── */}
      <div className="flex-1 px-4 space-y-4 pb-28 animate-slide-up">

        {/* Save message */}
        {saveMsg && (
          <div className={`glass-card p-3 text-center text-sm font-medium rounded-xl ${saveMsg.includes('berhasil') ? 'text-emerald-400 border border-emerald-500/30' : 'text-red-400 border border-red-500/30'}`}>
            {saveMsg}
          </div>
        )}

        {loading ? <ProfileSkeleton /> : (
          <>
            {/* Avatar Card */}
            <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 flex flex-col items-center text-center">
              <div className="relative group mb-4">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-white shadow-lg">
                    {initials}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white text-[10px]">
                  ✓
                </div>
              </div>
              <p className="text-slate-900 font-bold text-xl mb-1">{profile?.name}</p>
              <p className="text-slate-500 text-sm font-medium mb-4">{profile?.email}</p>
              {profile?.company_name && (
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-violet-50 text-violet-600 border border-violet-100">
                  🏢 {profile.company_name}
                </span>
              )}
            </div>

            {/* Personal Info */}
            {editing ? (
              <SectionCard title="📝 Edit Profil">
                <div className="space-y-3">
                  {[
                    { key: 'name', label: 'Nama Lengkap', type: 'text', placeholder: 'Nama lengkap Anda' },
                    { key: 'phone', label: 'No. Telepon', type: 'tel', placeholder: '08xx-xxxx-xxxx' },
                    { key: 'birth_date', label: 'Tanggal Lahir', type: 'date', placeholder: '' },
                    { key: 'ktp_number', label: 'No. KTP', type: 'text', placeholder: '16 digit NIK' },
                    { key: 'blood_type', label: 'Golongan Darah', type: 'select', options: ['', 'A', 'B', 'AB', 'O', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
                    { key: 'address', label: 'Alamat', type: 'textarea', placeholder: 'Alamat lengkap' },
                    { key: 'emergency_contact_name', label: 'Nama Kontak Darurat', type: 'text', placeholder: 'Nama' },
                    { key: 'emergency_contact', label: 'No. Kontak Darurat', type: 'tel', placeholder: '08xx-xxxx-xxxx' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1.5 block">{field.label}</label>
                      {field.type === 'select' ? (
                        <select
                          className="input-dark text-sm font-medium"
                          value={(form as any)[field.key] || ''}
                          onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        >
                          {field.options?.map(opt => <option key={opt} value={opt}>{opt || 'Pilih...'}</option>)}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          className="input-dark text-sm font-medium resize-none"
                          rows={3}
                          placeholder={field.placeholder}
                          value={(form as any)[field.key] || ''}
                          onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        />
                      ) : (
                        <input
                          type={field.type}
                          className="input-dark text-sm font-medium"
                          placeholder={field.placeholder}
                          value={(form as any)[field.key] || ''}
                          onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            ) : (
              <>
                <SectionCard title="👤 Data Pribadi">
                  <InfoRow label="Nama Lengkap" value={profile?.name || ''} icon="🪪" />
                  <InfoRow label="Tanggal Lahir" value={formatDate(profile?.birth_date)} icon="🎂" />
                  <InfoRow label="Jenis Kelamin" value={profile?.gender === 'male' ? 'Laki-laki' : profile?.gender === 'female' ? 'Perempuan' : '-'} icon="⚧️" />
                  <InfoRow label="Golongan Darah" value={profile?.blood_type || '-'} icon="🩸" />
                  <InfoRow label="No. KTP (NIK)" value={profile?.ktp_number ? profile.ktp_number.replace(/(.{4})/g, '$1 ').trim() : '-'} icon="🪪" />
                </SectionCard>

                <SectionCard title="📞 Kontak">
                  <InfoRow label="Email" value={profile?.email || ''} icon="📧" />
                  <InfoRow label="No. Telepon" value={profile?.phone || '-'} icon="📱" />
                  <InfoRow label="Alamat" value={profile?.address || '-'} icon="🏠" />
                </SectionCard>

                <SectionCard title="🚨 Kontak Darurat">
                  <InfoRow label="Nama" value={profile?.emergency_contact_name || '-'} icon="👤" />
                  <InfoRow label="No. Telepon" value={profile?.emergency_contact || '-'} icon="📱" />
                </SectionCard>

                <SectionCard title="🏢 Informasi Pekerjaan">
                  <InfoRow label="Perusahaan" value={profile?.company_name || '-'} icon="🏢" />
                  <InfoRow label="Departemen" value={profile?.department || '-'} icon="🗂️" />
                  <InfoRow label={userRole === 'dokter' ? "ID Dokter" : "ID Karyawan"} value={profile?.employee_id || '-'} icon="🔖" />
                </SectionCard>
              </>
            )}

            {editing && (
              <div className="flex gap-4">
                <button
                  onClick={() => { setEditing(false); setForm(profile || {}); }}
                  className="flex-1 py-4 rounded-2xl text-sm font-bold text-slate-500 bg-white border border-slate-100 shadow-sm"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-4 rounded-2xl text-sm font-bold btn-primary"
                >
                  {saving ? '⏳...' : 'Simpan'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav active="profile" />
    </div>
  );
}
