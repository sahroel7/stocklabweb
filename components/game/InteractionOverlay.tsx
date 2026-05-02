'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { Sector } from '@/lib/types';
import { Eye, TrendingUp, TrendingDown, Users, BadgeDollarSign, X, Check } from 'lucide-react';

const SECTORS: Sector[] = ['Keuangan', 'Agrikultur', 'Tambang', 'Konsumer'];

export const InteractionOverlay: React.FC = () => {
  const { 
    interaction, 
    players, 
    peekResults, 
    clearPeekResults, 
    peekSectors, 
    useRumor, 
    handleAkuisisiResponse,
    market,
    sellStock
  } = useGameStore();

  const [selectedSectors, setSelectedSectors] = useState<Sector[]>([]);
  const [rumorEffects, setRumorEffects] = useState<{ sector: Sector, amount: number }[]>([]);

  if (!interaction && !peekResults) return null;

  // 1. PEEK RESULTS (INFO BURSA)
  if (peekResults) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
        <div className="bg-zinc-900 border border-white/10 p-10 rounded-[3rem] max-w-2xl w-full shadow-2xl space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-amber-500">Hasil Info Bursa</h2>
            <p className="text-white/40 text-xs">Kartu ekonomi ronde ini untuk sektor yang Anda pilih:</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {peekResults.map((res, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 whitespace-nowrap">Saham {res.sector}</span>
                  <Eye className="w-4 h-4 text-white/20" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">{res.card.title}</h3>
                  <p className="text-xs text-white/60 leading-relaxed italic">"{res.card.description}"</p>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={clearPeekResults}
            className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  // 2. INTERACTIONS
  const renderInteraction = () => {
    switch (interaction?.type) {
      case 'SELECT_SECTOR':
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <Eye className="w-12 h-12 text-amber-500 mx-auto mb-2" />
              <h2 className="text-sm font-black uppercase tracking-[0.4em] text-amber-500">Info Bursa</h2>
              <p className="text-2xl font-bold text-white">Pilih 2 Sektor untuk Diintip</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {SECTORS.map(s => (
                <button
                  key={s}
                  onClick={() => {
                    if (selectedSectors.includes(s)) {
                      setSelectedSectors(selectedSectors.filter(x => x !== s));
                    } else if (selectedSectors.length < 2) {
                      setSelectedSectors([...selectedSectors, s]);
                    }
                  }}
                  className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-2 ${
                    selectedSectors.includes(s) 
                      ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/20' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span className="text-sm font-bold text-white whitespace-nowrap">Saham {s}</span>
                </button>
              ))}
            </div>
            <button
              disabled={selectedSectors.length < 2}
              onClick={() => {
                peekSectors(0, selectedSectors);
                setSelectedSectors([]);
              }}
              className="w-full py-5 bg-amber-600 disabled:bg-zinc-800 disabled:text-white/20 text-white rounded-2xl font-black uppercase tracking-widest transition-all"
            >
              Intip Sekarang
            </button>
          </div>
        );

      case 'SELECT_PLAYER':
        const sector = interaction.data as Sector;
        const potentialTargets = players.filter(p => p.id !== 0 && (p.portfolio[sector as Exclude<Sector, 'Reksa Dana'>] || 0) > 0);
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <Users className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
              <h2 className="text-sm font-black uppercase tracking-[0.4em] text-indigo-500">Akuisisi</h2>
              <p className="text-2xl font-bold text-white">Pilih Pemain untuk Diakuisisi</p>
              <p className="text-xs text-white/40 whitespace-nowrap">Sektor: Saham {sector}</p>
            </div>
            <div className="space-y-3">
              {potentialTargets.length > 0 ? potentialTargets.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleAkuisisiResponse(0, p.id)}
                  className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] flex justify-between items-center hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center font-bold text-white">
                      P{p.id + 1}
                    </div>
                    <span className="font-bold text-white">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-white whitespace-nowrap">{p.portfolio[sector as Exclude<Sector, 'Reksa Dana'>]} Saham</div>
                    <div className="text-[10px] text-white/40 uppercase whitespace-nowrap">Kompensasi: {Math.floor(market[sector] / 2)} Koin</div>
                  </div>
                </button>
              )) : (
                <div className="py-10 text-center text-white/20 italic whitespace-nowrap">Tidak ada pemain yang memiliki Saham {sector}.</div>
              )}
            </div>
            <button 
              onClick={() => useGameStore.setState({ interaction: null, pendingAction: null })}
              className="w-full py-4 text-white/40 font-bold uppercase tracking-widest hover:text-white transition-colors"
            >
              Batal
            </button>
          </div>
        );

      case 'SELECT_STOCK':
        const myStocks = (Object.entries(players[0].portfolio) as [Sector, number][]).filter(([_, count]) => count > 0);
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <BadgeDollarSign className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h2 className="text-sm font-black uppercase tracking-[0.4em] text-emerald-500">Trading Fee</h2>
              <p className="text-2xl font-bold text-white">Pilih Saham untuk Dijual</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {myStocks.length > 0 ? myStocks.map(([s, count]) => (
                <button
                  key={s}
                  onClick={() => sellStock(0, s, count)}
                  className="w-full p-6 bg-white/5 border border-white/10 rounded-[2rem] flex justify-between items-center hover:bg-white/10 transition-all"
                >
                  <span className="font-bold text-white whitespace-nowrap">Saham {s}</span>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400 whitespace-nowrap">+{count * market[s]} Koin</div>
                    <div className="text-[10px] text-white/40 uppercase whitespace-nowrap">{count} Saham @ {market[s]}</div>
                  </div>
                </button>
              )) : (
                <div className="py-10 text-center text-white/20 italic">Anda tidak memiliki saham untuk dijual.</div>
              )}
            </div>
            <button 
               onClick={() => useGameStore.setState({ interaction: null, pendingAction: null })}
               className="w-full py-4 text-white/40 font-bold uppercase tracking-widest hover:text-white transition-colors"
            >
              Batal
            </button>
          </div>
        );

      case 'RUMOR_CHOICE':
        const rumorSector = interaction.data as Sector;
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <TrendingUp className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <h2 className="text-sm font-black uppercase tracking-[0.4em] text-blue-500">Rumor</h2>
              <p className="text-2xl font-bold text-white">Tentukan Efek Rumor</p>
              <p className="text-xs text-white/40 whitespace-nowrap">Sektor Utama: Saham {rumorSector}</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
               {/* Option 1: +/- 2 for one stock */}
               <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-4">
                 <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Opsi A: Satu Saham (+/- 2)</p>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => useRumor(0, [{ sector: rumorSector, amount: 2 }])}
                      className="flex-1 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 rounded-2xl font-bold transition-all whitespace-nowrap"
                    >
                      +2 Saham {rumorSector}
                    </button>
                    <button 
                      onClick={() => useRumor(0, [{ sector: rumorSector, amount: -2 }])}
                      className="flex-1 py-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-2xl font-bold transition-all whitespace-nowrap"
                    >
                      -2 Saham {rumorSector}
                    </button>
                 </div>
               </div>

               {/* Option 2: +/- 1 for two stocks (Simplified: card sector + choice) */}
               <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-4">
                 <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Opsi B: Dua Saham (+/- 1)</p>
                 <p className="text-[10px] text-white/20 italic">Pilih satu lagi untuk diubah +/- 1 bersama Saham {rumorSector}:</p>
                 <div className="grid grid-cols-2 gap-2">
                   {SECTORS.filter(s => s !== rumorSector).map(s => (
                     <div key={s} className="flex gap-1">
                        <button 
                          onClick={() => useRumor(0, [{ sector: rumorSector, amount: 1 }, { sector: s, amount: 1 }])}
                          className="flex-1 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-white transition-all whitespace-nowrap"
                        >
                          +1 Saham {s}
                        </button>
                        <button 
                          onClick={() => useRumor(0, [{ sector: rumorSector, amount: -1 }, { sector: s, amount: -1 }])}
                          className="flex-1 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-white transition-all whitespace-nowrap"
                        >
                          -1 Saham {s}
                        </button>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
            <button 
               onClick={() => useGameStore.setState({ interaction: null, pendingAction: null })}
               className="w-full py-4 text-white/40 font-bold uppercase tracking-widest hover:text-white transition-colors"
            >
              Batal
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in zoom-in-95 duration-300 p-4">
      <div className="bg-zinc-900 border border-white/10 p-8 md:p-12 rounded-[3rem] max-w-xl w-full shadow-2xl overflow-y-auto max-h-[90vh]">
        {renderInteraction()}
      </div>
    </div>
  );
};
