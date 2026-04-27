'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  action_url: string;
  created_at: string;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const r = await fetch('/api/notifications');
        if (r.ok) {
          const d = await r.json();
          setNotifications(d.notifications || []);
        }
      } catch (err) {
        console.error('Error loading notifications:', err);
      } finally {
        setLoading(false);
      }
    }
    loadNotifications();
  }, []);

  async function handleMarkRead(id: number | 'all') {
    const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    if (res.ok) {
      if (id === 'all') {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      } else {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      }
    }
  }

  const typeIcons: Record<string, string> = {
    chat: '💬',
    lab_request: '🩺',
    program_update: '✅',
    program_request: '📝',
    info: 'ℹ️',
    warning: '⚠️',
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#f8fafc]">
      <div className="bg-white border-b border-slate-100 px-5 pt-14 pb-6 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Notifikasi</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Update Terkini Program Anda</p>
          </div>
          <button 
            onClick={() => handleMarkRead('all')}
            className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider"
          >
            Tandai Dibaca Semua
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3 pb-32">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-3xl animate-pulse border border-slate-50" />
          ))
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <span className="text-6xl mb-4">🔔</span>
            <p className="text-sm font-bold text-slate-900">Belum ada notifikasi</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id} 
              onClick={() => {
                handleMarkRead(n.id);
                if (n.action_url) router.push(n.action_url);
              }}
              className={`bg-white border p-5 rounded-[2rem] flex gap-4 transition-all active:scale-95 shadow-sm ${
                n.is_read ? 'border-slate-100 opacity-60' : 'border-emerald-100 shadow-emerald-500/5'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                {typeIcons[n.type] || '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{n.title}</h3>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">
                  {new Date(n.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav active="" />
    </div>
  );
}
