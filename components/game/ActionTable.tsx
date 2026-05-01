import React from 'react';
import { useGameStore } from '@/lib/store';
import { ActionCard } from '@/lib/types';
import { MousePointer2, Zap, Info } from 'lucide-react';

const sectorColors: Record<string, string> = {
  Keuangan: 'text-purple-400 border-purple-500/30',
  Pertanian: 'text-green-400 border-green-500/30',
  Pertambangan: 'text-red-400 border-red-500/30',
  Properti: 'text-blue-400 border-blue-500/30',
  Reksadana: 'text-indigo-400 border-indigo-500/30',
};

const sectorBg: Record<string, string> = {
  Keuangan: 'bg-purple-500/10',
  Pertanian: 'bg-green-500/10',
  Pertambangan: 'bg-red-500/10',
  Properti: 'bg-blue-500/10',
  Reksadana: 'bg-indigo-500/10',
};

export const ActionTable: React.FC = () => {
  const { marketCards, phase, takeActionCard, turnOrder, activePlayerIndex, players } = useGameStore();

  const activePlayerId = turnOrder[activePlayerIndex];
  const activePlayer = players.find(p => p.id === activePlayerId);
  const isUserTurn = activePlayerId === 0;

  if (phase !== 'ACTION') return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center bg-zinc-900 p-6 rounded-[2rem] border border-white/5 shadow-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xl font-black uppercase tracking-tighter text-white">Bursa Aksi</h2>
          </div>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Pilih kartu untuk portofolio atau aksi</p>
        </div>
        <div className="flex items-center gap-4 px-6 py-3 bg-white/5 rounded-2xl border border-white/10">
          <div className={`w-3 h-3 rounded-full animate-pulse ${isUserTurn ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'bg-amber-500'}`} />
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Active Investor</span>
            <span className={`text-sm font-black uppercase tracking-tighter ${isUserTurn ? 'text-green-400' : 'text-amber-400'}`}>
              {activePlayer?.name}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {marketCards.map((card) => {
          const canClick = isUserTurn;
          return (
            <button 
              key={card.id} 
              disabled={!canClick}
              className={`group relative flex flex-col h-64 ${card.color} border-2 border-white/10 rounded-2xl transition-all overflow-hidden ${canClick ? 'hover:scale-[1.02] hover:shadow-2xl hover:border-white/30 cursor-pointer active:scale-95' : 'opacity-40 grayscale-[0.5] cursor-not-allowed'}`}
              onClick={() => canClick && takeActionCard(activePlayerId, card.id)}
            >
              {/* Card Header */}
              <div className="bg-black/20 p-3 flex justify-between items-center border-b border-white/10">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/60">{card.sector}</span>
                <Info className="w-3 h-3 text-white/40" />
              </div>

              {/* Card Body */}
              <div className="flex-1 p-4 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                   <Zap className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-tighter leading-tight text-white drop-shadow-md">
                  {card.title}
                </h4>
              </div>

              {/* Card Footer / Description */}
              <div className="bg-white/10 p-4 min-h-[80px] flex items-center justify-center border-t border-white/5">
                <p className="text-[10px] text-white/90 leading-tight font-bold italic drop-shadow-sm">
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
