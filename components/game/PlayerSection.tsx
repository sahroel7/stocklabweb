import React from 'react';
import { useGameStore } from '@/lib/store';
import { Coins, Briefcase, ChevronRight } from 'lucide-react';
import { Sector } from '@/lib/types';

export const PlayerSection: React.FC = () => {
  const { players, turnOrder, activePlayerIndex, phase, resolveEconomy, sellStock, market } = useGameStore();

  const activePlayerId = turnOrder[activePlayerIndex];
  const activePlayer = players.find(p => p.id === activePlayerId);

  const calculateNetWorth = (p: typeof players[0]) => {
    let total = p.coins;
    Object.entries(p.portfolio).forEach(([sector, amount]) => {
      total += amount * (market[sector as Sector] || 0);
    });
    total += p.reksaDana * (market['Reksa Dana'] || 0);
    total -= (p.debt > 0 ? 13 : 0);
    return total;
  };

  const sortedPlayers = [...players].sort((a, b) => calculateNetWorth(b) - calculateNetWorth(a));

  const portfolioEntries = activePlayer ? [
    ...Object.entries(activePlayer.portfolio),
    ['Reksa Dana', activePlayer.reksaDana]
  ] : [];

  return (
    <div className="space-y-4">
      {/* Leaderboard Mini - Always Visible */}
      <div className="grid grid-cols-5 gap-2">
        {sortedPlayers.map((p, i) => (
          <div 
            key={p.id} 
            className={`p-1.5 rounded-xl border transition-all ${
              p.id === 0 
                ? 'bg-indigo-600/20 border-indigo-500/50' 
                : 'bg-white/5 border-white/10'
            } ${activePlayerId === p.id ? 'ring-1 ring-indigo-500 ring-offset-1 ring-offset-black' : ''}`}
          >
            <div className="flex justify-between items-start mb-0.5">
              <span className={`text-[8px] font-black ${i === 0 ? 'text-yellow-500' : 'text-white/20'}`}>#{i + 1}</span>
              <span className={`text-[8px] font-black uppercase ${activePlayerId === p.id ? 'text-indigo-400' : 'text-white/40'}`}>
                P{p.id + 1}
              </span>
            </div>
            <div className="text-[10px] font-black text-white leading-none">
              {p.id === 0 ? calculateNetWorth(p) : '???' }
            </div>
            
            {/* Mini Portfolio Summary */}
            <div className="flex justify-between pt-1 mt-1 border-t border-white/5 overflow-hidden">
              {Object.entries(p.portfolio).map(([sector, amount]) => (
                <div key={sector} className="flex flex-col items-center">
                  <div className={`w-1 h-1 rounded-full ${
                    sector === 'Keuangan' ? 'bg-yellow-500' :
                    sector === 'Agrikultur' ? 'bg-green-600' :
                    sector === 'Tambang' ? 'bg-red-600' : 'bg-blue-600'
                  }`} title={sector} />
                  <span className="text-[6px] font-bold text-white/40">{amount}</span>
                </div>
              ))}
              <div className="flex flex-col items-center">
                <div className="w-1 h-1 rounded-full bg-gray-500" title="Reksa Dana" />
                <span className="text-[6px] font-bold text-white/40">{p.reksaDana}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Player Status */}
      {(activePlayer || phase === 'SELLING') && activePlayerId !== undefined && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-400">
          <div className="bg-white/10 p-3 flex justify-between items-center border-b border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-lg">
                P{activePlayerId! + 1}
              </div>
              <div className="hidden sm:block">
                <h3 className="text-white text-xs font-bold leading-none">{activePlayer?.name}</h3>
                <p className="text-[8px] text-white/40 uppercase font-black tracking-widest mt-0.5">Turn</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-0.5 text-emerald-400 font-bold text-sm">
                  <span className="text-[8px]">$</span>
                  <span>{activePlayer && activePlayer.id === 0 ? calculateNetWorth(activePlayer) : '???'}</span>
                </div>
                <span className="text-[7px] text-white/30 uppercase leading-none">Net Worth</span>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-yellow-400 font-bold text-sm leading-none">
                  <Coins className="w-3 h-3" />
                  <span>{activePlayer?.coins}</span>
                </div>
                <span className="text-[7px] text-white/30 uppercase font-black leading-none">Cash</span>
              </div>
              {activePlayer?.id === 0 && activePlayer?.debt === 0 && (
                <button 
                  onClick={() => useGameStore.getState().takeDebt(activePlayer.id)}
                  className="px-2 py-0.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded text-[8px] font-bold uppercase transition-all"
                >
                  Pinjam 10
                </button>
              )}
            </div>
          </div>

          <div className="p-3">
             {phase === 'ACTION' && activePlayerId === 0 && (
               <div className="py-2 text-center">
                 <p className="text-white/40 text-[10px] italic">Pilih kartu di bursa untuk melakukan aksi...</p>
               </div>
             )}
             {phase === 'ACTION' && activePlayerId !== 0 && (
               <div className="py-2 text-center">
                 <p className="text-indigo-400 text-[10px] font-bold animate-pulse">Bot sedang berpikir...</p>
               </div>
             )}
             {phase === 'SELLING' && activePlayerId === 0 && (
                <div className="py-2 text-center">
                  <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">Fase Penjualan Aktif</p>
                  <button 
                    onClick={() => useGameStore.getState().nextTurn()}
                    className="group mx-auto flex items-center gap-2 px-6 py-2 bg-white text-black rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                  >
                    Selesai & Lanjut
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
             )}
             {phase === 'SELLING' && activePlayerId !== 0 && (
                <div className="py-2 text-center">
                  <p className="text-white/20 text-[10px] italic">Bot sedang melakukan penjualan...</p>
                </div>
             )}
          </div>
        </div>
      )}

      {phase === 'BIDDING' && (
        <div className="py-12 text-center bg-white/5 border border-white/10 border-dashed rounded-[2rem]">
          <p className="text-white/20 font-medium italic">Silakan masukkan Bid Anda pada modal di atas untuk memulai ronde.</p>
        </div>
      )}
    </div>
  );
};
