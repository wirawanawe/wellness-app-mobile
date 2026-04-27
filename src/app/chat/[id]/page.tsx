'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  created_at: string;
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: otherId } = use(params);
  const { data: session } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const userId = (session?.user as any)?.id;

  useEffect(() => {
    if (!otherId) return;
    
    // Fetch profile of other user
    fetch(`/api/users/${otherId}/profile`)
      .then(r => r.json())
      .then(d => setOtherUser(d.user));

    // Fetch messages
    const fetchMessages = () => {
      fetch(`/api/chat/messages/${otherId}`)
        .then(r => r.json())
        .then(d => {
          setMessages(d.messages);
          setLoading(false);
        });
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [otherId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    if (!newMessage.trim()) return;
    const msg = newMessage;
    setNewMessage('');
    
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: otherId, message: msg })
      });
      if (res.ok) {
        // Optimistic update
        const tempMsg: Message = {
          id: Date.now(),
          sender_id: Number(userId),
          receiver_id: Number(otherId),
          message: msg,
          created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempMsg]);
      }
    } catch (e) { console.error(e); }
  }

  if (loading) return (
    <div className="min-h-dvh flex items-center justify-center bg-white">
      <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-dvh flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-5 pt-14 pb-4 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg overflow-hidden border border-emerald-50">
          {otherUser?.avatar_url ? <img src={otherUser.avatar_url} className="w-full h-full object-cover" /> : '👤'}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold text-slate-900 truncate">{otherUser?.name || 'Loading...'}</h1>
          <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{otherUser?.role === 'dokter' ? 'Dokter Pendamping' : 'Pasien'}</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((m) => {
          const isMe = m.sender_id === Number(userId);
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium shadow-sm ${
                isMe 
                ? 'bg-emerald-600 text-white rounded-tr-none' 
                : 'bg-white border border-slate-100 text-slate-900 rounded-tl-none'
              }`}>
                {m.message}
                <p className={`text-[9px] mt-1 opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                  {new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100 pb-10">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-2 pl-4">
          <input 
            type="text" 
            placeholder="Ketik pesan..." 
            className="flex-1 bg-transparent border-none outline-none text-sm font-medium py-2"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-90 transition-transform"
          >
            <svg className="w-5 h-5 rotate-45 -mt-0.5 -mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
