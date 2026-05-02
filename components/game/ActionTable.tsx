import React from 'react';
import { useGameStore } from '@/lib/store';
import { ActionCard, Sector } from '@/lib/types';
import { MousePointer2, Zap, Info } from 'lucide-react';

const sectorColors: Record<string, string> = {
  Keuangan: 'text-yellow-400 border-yellow-500/30',
  Agrikultur: 'text-green-400 border-green-500/30',
  Tambang: 'text-red-400 border-red-500/30',
  Konsumer: 'text-blue-400 border-blue-500/30',
  'Reksa Dana': 'text-indigo-400 border-indigo-500/30',
  };

  const sectorBgColors: Record<Sector, string> = {
  Keuangan: 'bg-yellow-500/10',
  Agrikultur: 'bg-green-500/10',
  Tambang: 'bg-red-500/10',
  Konsumer: 'bg-blue-500/10',
  'Reksa Dana': 'bg-indigo-500/10',
  };


export const ActionTable: React.FC = () => {
  const { marketCards, phase, takeActionCard, turnOrder, activePlayerIndex, players } = useGameStore();

  const activePlayerId = turnOrder[activePlayerIndex];
  const activePlayer = players.find(p => p.id === activePlayerId);
  const isHumanTurn = activePlayer && !activePlayer.isBot;

  if (phase !== 'ACTION') return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center bg-zinc-900 p-3 rounded-2xl border border-white/5 shadow-2xl">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Zap className="w-3 h-3 text-indigo-400" />
            <h2 className="text-sm font-black uppercase tracking-tighter text-white">Bursa Aksi</h2>
          </div>
          <p className="text-[7px] font-bold text-white/40 uppercase tracking-widest">Pilih kartu</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10">
          <div className={`w-2 h-2 rounded-full animate-pulse ${isHumanTurn ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-amber-500'}`} />
          <div className="flex flex-col">
            <span className={`text-[10px] font-black uppercase tracking-tighter ${isHumanTurn ? 'text-green-400' : 'text-amber-400'}`}>
              {activePlayer?.name}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {marketCards.map((card) => {
          const canClick = isHumanTurn;
          return (
            <button 
              key={card.id} 
              disabled={!canClick}
              className={`group relative flex flex-col h-40 ${card.color} border border-white/10 rounded-xl transition-all overflow-hidden ${canClick ? 'hover:scale-[1.02] cursor-pointer active:scale-95' : 'opacity-40 grayscale-[0.5] cursor-not-allowed'}`}
              onClick={() => canClick && takeActionCard(activePlayerId, card.id)}
            >
              {/* Card Header */}
              <div className="bg-black/20 p-1.5 flex justify-between items-center border-b border-white/10">
                <span className="text-[7px] font-black uppercase tracking-widest text-white/60 whitespace-nowrap">
                  {card.sector === 'Reksa Dana' ? 'Reksa Dana' : `Saham ${card.sector}`}
                </span>
              </div>

              {/* Card Body */}
              <div className="flex-1 p-2 flex flex-col items-center justify-center text-center space-y-1">
                <h4 className="text-[9px] font-black uppercase tracking-tighter leading-tight text-white drop-shadow-md">
                  {card.title}
                </h4>
              </div>

              {/* Card Footer / Description */}
              <div className="bg-white/10 p-2 min-h-[40px] flex items-center justify-center border-t border-white/5">
                <p className="text-[8px] text-white/90 leading-tight font-bold italic drop-shadow-sm">
                  "{card.description}"
                </p>
              </div>

              {/* Hover Effect */}
              {canClick && (
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors flex items-center justify-center">
                  <div className="p-2 bg-white text-black rounded-full opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100">
                    <MousePointer2 className="w-4 h-4" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
        {marketCards.length === 0 && (
          <div className="col-span-full py-20 text-center border-4 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center gap-4">
            <div className="p-4 bg-white/5 rounded-full">
              <Zap className="w-8 h-8 text-white/10" />
            </div>
            <p className="text-white/20 font-black uppercase tracking-[0.3em]">Bursa Aksi Kosong</p>
          </div>
        )}
      </div>
    </div>
  );
};
