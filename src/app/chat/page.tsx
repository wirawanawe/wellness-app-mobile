'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
import Link from 'next/link';

interface RecentChat {
  id: number;
  name: string;
  role: string;
  avatar_url: string;
  last_message: string;
  last_message_time: string;
}

export default function ChatListPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [chats, setChats] = useState<RecentChat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/chat/recent')
      .then(r => r.json())
      .then(d => {
        setChats(d.chats || []);
        setLoading(false);
      })
      .catch(e => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-[#f8fafc]">
      <div className="bg-white border-b border-slate-100 px-5 pt-14 pb-6 sticky top-0 z-20">
        <h1 className="text-2xl font-black text-slate-900">Pesan</h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Komunikasi dengan {(session?.user as any)?.role === 'dokter' ? 'Pasien' : 'Dokter'}</p>
      </div>

      <div className="flex-1 p-4 space-y-3 pb-32">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-3xl animate-pulse border border-slate-50" />
          ))
        ) : chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <span className="text-6xl mb-4">💬</span>
            <p className="text-sm font-bold text-slate-900">Belum ada percakapan</p>
            <p className="text-xs mt-1">Mulai chat dari halaman detail {(session?.user as any)?.role === 'dokter' ? 'pasien' : 'program'}</p>
          </div>
        ) : (
          chats.map((chat) => (
            <Link 
              key={chat.id} 
              href={`/chat/${chat.id}`}
              className="bg-white border border-slate-100 p-4 rounded-[2rem] flex items-center gap-4 transition-all active:scale-95 shadow-sm hover:shadow-md"
            >
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden border border-white shadow-sm">
                {chat.avatar_url ? <img src={chat.avatar_url} className="w-full h-full object-cover" /> : (chat.role === 'dokter' ? '👨‍⚕️' : '👤')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-sm font-black text-slate-900 truncate">{chat.name}</h3>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">
                    {new Date(chat.last_message_time).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate font-medium">{chat.last_message}</p>
              </div>
              <div className="text-slate-300">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </Link>
          ))
        )}
      </div>

      <BottomNav active="chat" />
    </div>
  );
}
