import React from 'react';
import { useGameStore } from '@/lib/store';
import { Sector } from '@/lib/types';
import { X, TrendingUp, Coins } from 'lucide-react';

export const SellingModal: React.FC = () => {
  const { phase, players, turnOrder, activePlayerIndex, market, sellStock, nextTurn } = useGameStore();

  const activePlayerId = turnOrder[activePlayerIndex];
  if (phase !== 'SELLING' || activePlayerId !== 0) return null;

  const player = players[0];
  const portfolioEntries = [
    ...Object.entries(player.portfolio),
    ['Reksa Dana', player.reksaDana]
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300 p-4">
      <div className="bg-zinc-900 border border-white/10 p-8 rounded-[3rem] max-w-lg w-full shadow-2xl space-y-8">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-[0.4em] text-emerald-500">Fase Penjualan</h2>
          <p className="text-2xl font-bold text-white">Kelola Portofolio Anda</p>
          <p className="text-xs text-white/40">Anda dapat menjual saham yang dimiliki sesuai harga pasar saat ini.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 max-h-[40vh] overflow-y-auto pr-2 scrollbar-hide">
          {portfolioEntries.map(([sector, amount]) => {
            const price = market[sector as Sector];
            const count = amount as number;
            
            return (
              <div key={sector} className="group flex justify-between items-center p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2rem] transition-all">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{sector === 'Reksa Dana' ? sector : `Saham ${sector}`}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl font-bold text-white">{count}</span>
                    <span className="text-[10px] text-white/20 uppercase font-black">Lembar</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400">@{price}</div>
                    <div className="text-[10px] text-white/20 uppercase font-black">Harga Pasar</div>
                  </div>
                  
                  <button
                    disabled={count === 0}
                    onClick={() => sellStock(0, sector as Sector, 1)}
                    className="w-12 h-12 bg-emerald-600 disabled:bg-zinc-800 disabled:text-white/10 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    <Coins className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 flex justify-between items-center">
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Total Cash</span>
                <span className="text-2xl font-bold text-yellow-400">{player.coins} Koin</span>
            </div>
            <button
                onClick={() => nextTurn()}
                className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl"
            >
                Selesai
            </button>
        </div>
      </div>
    </div>
  );
};
