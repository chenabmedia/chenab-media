'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firestore';
import { collection, getDocs } from 'firebase/firestore';
import { MessageSquare, RefreshCw, Loader2 } from 'lucide-react';

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'contactSubmissions'));
      const list: any[] = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setMessages(list);
    } catch (err) {
      console.warn('Error loading contact messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div className="space-y-8 font-mono text-xs">
      <div className="border-b border-[#1A1A1A] pb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sky-400 mb-1">
            <MessageSquare size={14} />
            <span>CONTACT INBOX</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#F5F5F5] uppercase tracking-wider">
            INCOMING INQUIRIES
          </h1>
        </div>

        <button
          onClick={fetchMessages}
          className="p-2.5 border border-[#222222] bg-[#111111] text-[#CCCCCC] hover:text-white uppercase flex items-center gap-2"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>REFRESH</span>
        </button>
      </div>

      <div className="border border-[#1C1C1C] bg-[#0C0C0C]">
        {loading ? (
          <div className="p-12 text-center text-[#888888] space-y-2">
            <Loader2 size={24} className="animate-spin mx-auto text-sky-400" />
            <p className="uppercase">LOADING CONTACT INQUIRIES...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center text-[#888888] space-y-2">
            <MessageSquare size={28} className="mx-auto text-[#444444]" />
            <p className="uppercase font-bold text-[#CCCCCC]">NO CONTACT MESSAGES IN FIRESTORE</p>
          </div>
        ) : (
          <div className="divide-y divide-[#181818]">
            {messages.map((msg) => (
              <div key={msg.id} className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F5F5F5] text-sm">{msg.subject || 'General Inquiry'}</span>
                  <span className="text-[10px] text-[#666666]">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'Recent'}
                  </span>
                </div>
                <p className="text-[#888888]">{msg.name} &bull; {msg.email} &bull; [{msg.department || 'GENERAL'}]</p>
                <p className="text-[#CCCCCC] text-xs pt-1">{msg.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
