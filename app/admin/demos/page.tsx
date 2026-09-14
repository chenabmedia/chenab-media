'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/firestore';
import { collection, getDocs } from 'firebase/firestore';
import { FileMusic, RefreshCw, Loader2 } from 'lucide-react';

export default function AdminDemosPage() {
  const [demos, setDemos] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDemos = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'demoSubmissions'));
      const list: any[] = [];
      snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setDemos(list);
    } catch (err) {
      console.warn('Error loading demos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemos();
  }, []);

  return (
    <div className="space-y-8 font-mono text-xs">
      <div className="border-b border-[#1A1A1A] pb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <FileMusic size={14} />
            <span>A&R DEMO QUEUE</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-[#F5F5F5] uppercase tracking-wider">
            UNSOLICITED & SUBMITTED DEMOS
          </h1>
        </div>

        <button
          onClick={fetchDemos}
          className="p-2.5 border border-[#222222] bg-[#111111] text-[#CCCCCC] hover:text-white uppercase flex items-center gap-2"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>REFRESH QUEUE</span>
        </button>
      </div>

      <div className="border border-[#1C1C1C] bg-[#0C0C0C]">
        {loading ? (
          <div className="p-12 text-center text-[#888888] space-y-2">
            <Loader2 size={24} className="animate-spin mx-auto text-amber-400" />
            <p className="uppercase">LOADING DEMO SUBMISSIONS...</p>
          </div>
        ) : demos.length === 0 ? (
          <div className="p-12 text-center text-[#888888] space-y-2">
            <FileMusic size={28} className="mx-auto text-[#444444]" />
            <p className="uppercase font-bold text-[#CCCCCC]">NO DEMO PITCHES RECORDED IN FIRESTORE</p>
          </div>
        ) : (
          <div className="divide-y divide-[#181818]">
            {demos.map((demo) => (
              <div key={demo.id} className="p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#F5F5F5] text-sm">{demo.demoTitle || 'Untitled Pitch'}</span>
                  <span className="text-[10px] text-[#666666]">
                    {demo.createdAt ? new Date(demo.createdAt).toLocaleString() : 'Recent'}
                  </span>
                </div>
                <p className="text-[#888888]">{demo.artistName} &bull; {demo.email}</p>
                {demo.message && <p className="text-[#CCCCCC] text-xs pt-1">{demo.message}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
