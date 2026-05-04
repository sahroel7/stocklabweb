import React from 'react';
import { useGameStore } from '@/lib/store';
import { Sector } from '@/lib/types';

export const ChoiceModal: React.FC = () => {
  const { pendingAction, handleChoice, market, extraTurns, players, cancelActionCard } = useGameStore();
  const activePlayer = players.find(p => p.id === pendingAction?.playerId);

  if (!pendingAction || activePlayer?.isBot) return null;

  const { card } = pendingAction;
  const currentPrice = market[card.sector];
  const isQuickBuying = extraTurns > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 p-4">
      <div className="bg-zinc-900 border border-white/10 p-5 rounded-3xl max-w-sm w-full shadow-2xl space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">
            {isQuickBuying ? 'Quickbuy (Simpan)' : 'Pilih Aksi'}
          </h2>
          <p className="text-lg font-bold text-white leading-tight">
            Kartu <span className="text-indigo-400">{card.title}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => handleChoice('SHARE')}
            className="group relative flex flex-col items-center p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all"
          >
            <div className="text-base font-bold text-white">Simpan Saham</div>
            <div className="text-[9px] text-white/40 mt-1 italic text-center">
              Tambah 1 lembar portofolio {card.sector === 'Reksa Dana' ? card.sector : `Saham ${card.sector}`}.
            </div>
          </button>

          {!isQuickBuying && (
            <>
              <button
                onClick={() => handleChoice('ACTION')}
                className="group relative flex flex-col items-center p-4 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/50 rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
              >
                <div className="text-base font-bold text-white">Efek Kartu</div>
                <div className="text-[9px] text-indigo-100 mt-1 italic text-center">
                  {card.description}
                </div>
              </button>

              <button
                onClick={() => handleChoice('SELL')}
                className="group relative flex flex-col items-center p-3 bg-red-600/10 hover:bg-red-200/20 border border-red-500/20 rounded-2xl transition-all"
              >
                <div className="text-base font-bold text-red-400">Jual Langsung</div>
                <div className="text-[9px] text-red-500/60 mt-0.5 italic">
                  Dapat {currentPrice} koin.
                </div>
              </button>
            </>
          )}

          <button
            onClick={() => cancelActionCard()}
            className="w-full py-3 mt-2 text-white/40 font-bold uppercase tracking-widest hover:text-white transition-colors text-[10px]"
          >
            Batal Pilih
          </button>
        </div>
      </div>
    </div>
  );
};
