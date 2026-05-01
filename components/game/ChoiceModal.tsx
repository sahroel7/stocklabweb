import React from 'react';
import { useGameStore } from '@/lib/store';
import { Sector } from '@/lib/types';

export const ChoiceModal: React.FC = () => {
  const { pendingAction, handleChoice, market } = useGameStore();

  if (!pendingAction || pendingAction.playerId !== 0) return null;

  const { card } = pendingAction;
  const currentPrice = market[card.sector];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-indigo-500">Pilih Aksi Anda</h2>
          <p className="text-2xl font-bold text-white leading-tight">
            Anda mengambil kartu <span className="text-indigo-400">{card.title}</span>. Apa yang akan Anda lakukan?
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => handleChoice('SHARE')}
            className="group relative flex flex-col items-center p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all"
          >
            <div className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Opsi 1</div>
            <div className="text-xl font-bold text-white">Simpan sebagai Saham</div>
            <div className="text-[10px] text-white/40 mt-2 italic">
              Tambah 1 lembar portofolio {card.sector}.
            </div>
          </button>

          <button
            onClick={() => handleChoice('ACTION')}
            className="group relative flex flex-col items-center p-6 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/50 rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
          >
            <div className="text-xs font-black uppercase tracking-widest text-indigo-200 mb-1">Opsi 2</div>
            <div className="text-xl font-bold text-white">Jalankan Efek Kartu</div>
            <div className="text-[10px] text-indigo-200 mt-2 italic text-center">
              {card.description}
            </div>
          </button>

          <button
            onClick={() => handleChoice('SELL')}
            className="group relative flex flex-col items-center p-4 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 rounded-2xl transition-all"
          >
            <div className="text-xl font-bold text-red-400">Jual Langsung</div>
            <div className="text-[10px] text-red-500/60 mt-1 italic">
              Dapatkan {currentPrice} koin sekarang.
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
