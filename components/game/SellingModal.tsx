import React from 'react';
import { useGameStore } from '@/lib/store';
import { Sector } from '@/lib/types';
import { X, TrendingUp, Coins } from 'lucide-react';

export const SellingModal: React.FC = () => {
  const { phase, players, turnOrder, activePlayerIndex, market, sellStock, nextTurn, sectorOrder } = useGameStore();

  const activePlayerId = turnOrder[activePlayerIndex];
  if (phase !== 'SELLING' || activePlayerId !== 0) return null;

  const player = players[0];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300 p-4">
      <div className="bg-zinc-900 border border-white/10 p-6 md:p-8 rounded-[2.5rem] max-w-2xl w-full shadow-2xl space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Fase Penjualan</h2>
          <p className="text-xl font-black text-white uppercase tracking-tight">Kelola Portofolio</p>
        </div>

        <div className="grid grid-cols-5 gap-1 md:gap-2">
          {sectorOrder.map((sector) => {
            const price = market[sector];
            const count = sector === 'Reksa Dana' ? player.reksaDana : player.portfolio[sector as Exclude<Sector, 'Reksa Dana'>];
            
            return (
              <div key={sector} className="group flex flex-col items-center p-1.5 md:p-3 bg-white/5 border border-white/10 rounded-xl md:rounded-2xl transition-all text-center min-w-0">
                <span className="text-[5px] md:text-[7px] font-black uppercase tracking-widest text-white/30 mb-1.5 md:mb-2 truncate w-full">
                  {sector === 'Reksa Dana' ? 'RD' : sector}
                </span>
                
                <div className="flex flex-col items-center mb-2 md:mb-3">
                  <span className="text-base md:text-lg font-black text-white leading-none">{count}</span>
                  <span className="text-[5px] md:text-[6px] text-white/20 uppercase font-black tracking-tighter mt-0.5 md:mt-1">Lembar</span>
                </div>
                
                <div className="w-full pt-1.5 md:pt-2 border-t border-white/5 space-y-1.5 md:space-y-2">
                  <div className="flex flex-col">
                    <span className="text-[9px] md:text-xs font-black text-emerald-400">${price}</span>
                    <span className="text-[4px] md:text-[5px] text-white/20 uppercase font-black">Price</span>
                  </div>
                  
                  <button
                    disabled={count === 0}
                    onClick={() => sellStock(0, sector, count)}
                    className="w-full py-1.5 md:py-2 bg-emerald-600 disabled:bg-zinc-800 disabled:text-white/10 text-white rounded-lg md:rounded-xl flex flex-col items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    <span className="text-[6px] md:text-[8px] font-black uppercase leading-none mb-0.5">Jual Semua</span>
                    <Coins className="w-2.5 h-2.5 md:w-3.5 md:h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-between items-center">
            <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Total Cash Anda</span>
                <span className="text-xl font-black text-yellow-400 tabular-nums">{player.coins} Koin</span>
            </div>
            <button
                onClick={() => nextTurn()}
                className="px-8 py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl active:scale-95"
            >
                Selesai Jual
            </button>
        </div>
      </div>
    </div>
  );
};
