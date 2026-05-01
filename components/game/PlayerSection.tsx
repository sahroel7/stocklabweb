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
    <div className="space-y-6">
      {/* Leaderboard Mini - Always Visible */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {sortedPlayers.map((p, i) => (
          <div 
            key={p.id} 
            className={`p-3 rounded-2xl border transition-all ${
              p.id === 0 
                ? 'bg-indigo-600/20 border-indigo-500/50' 
                : 'bg-white/5 border-white/10'
            } ${activePlayerId === p.id ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-black' : ''}`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className={`text-[10px] font-black ${i === 0 ? 'text-yellow-500' : 'text-white/20'}`}>#{i + 1}</span>
              <span className={`text-[10px] font-black uppercase ${activePlayerId === p.id ? 'text-indigo-400' : 'text-white/40'}`}>
                P{p.id + 1} {p.id === 0 && '(You)'}
              </span>
            </div>
            <div className="text-sm font-black text-white">{calculateNetWorth(p)}</div>
            <div className="text-[8px] font-bold text-white/20 uppercase tracking-tighter">Net Worth</div>
          </div>
        ))}
      </div>

      {/* Active Player Status - Only visible when there's an active player or in selling phase */}
      {(activePlayer || phase === 'SELLING') && activePlayerId !== undefined && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white/10 p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
                P{activePlayerId! + 1}
              </div>
              <div>
                <h3 className="text-white font-bold">{activePlayer?.name}</h3>
                <p className="text-[10px] text-white/40 uppercase font-black tracking-widest">Active Turn</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-emerald-400 font-bold text-lg">
                  <span className="text-[10px]">$</span>
                  <span>{activePlayer ? calculateNetWorth(activePlayer) : 0}</span>
                </div>
                <span className="text-[10px] text-white/30 uppercase">Net Worth</span>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-yellow-400 font-bold">
                  <Coins className="w-4 h-4" />
                  <span>{activePlayer?.coins}</span>
                </div>
                <span className="text-[10px] text-white/30 uppercase font-black">Cash</span>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-indigo-400 font-bold">
                  <Briefcase className="w-4 h-4" />
                  <span>{Object.values(activePlayer?.portfolio || {}).reduce((a, b) => a + b, 0) + (activePlayer?.reksaDana || 0)}</span>
                </div>
                <span className="text-[10px] text-white/30 uppercase">Shares</span>
              </div>
              {activePlayer?.id === 0 && activePlayer?.debt === 0 && (
                <button 
                  onClick={() => useGameStore.getState().takeDebt(activePlayer.id)}
                  className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded text-[10px] font-bold uppercase transition-all"
                >
                  Pinjam 10
                </button>
              )}
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-4">Portfolio</h4>
              <div className="space-y-2">
                {portfolioEntries.map(([sector, amount]) => (
                  <div key={sector} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                    <span className="text-sm text-white/80">
                      {sector === 'Reksa Dana' ? sector : `Saham ${sector}`}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-white">{amount} <span className="text-white/20 text-[10px]">Lbr</span></span>
                      {phase === 'SELLING' && (amount as number) > 0 && activePlayer?.id === 0 && (
                        <button 
                          onClick={() => sellStock(activePlayer.id, sector as Sector, 1)}
                          className="text-[10px] px-2 py-1 bg-green-600/20 hover:bg-green-600/40 text-green-400 border border-green-500/30 rounded uppercase font-bold transition-all"
                        >
                          Sell 1
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center items-center gap-4">
               {phase === 'ACTION' && activePlayerId === 0 && (
                 <div className="text-center">
                   <p className="text-white/40 text-sm italic mb-4">Ambil 1 kartu dari Bursa Aksi secara bergiliran.</p>
                 </div>
               )}
               {phase === 'ACTION' && activePlayerId !== 0 && (
                 <div className="text-center">
                   <p className="text-indigo-400 text-sm font-bold animate-pulse">Bot sedang berpikir...</p>
                 </div>
               )}

               {phase === 'SELLING' && activePlayerId === 0 && (
                 <button 
                   onClick={() => useGameStore.getState().nextTurn()}
                   className="group flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                 >
                   Selesai & Lanjut
                   <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                 </button>
               )}
            </div>
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
