import React from 'react';
import { useGameStore } from '@/lib/store';
import { ActionCard } from '@/lib/types';
import { MousePointer2 } from 'lucide-react';

const sectorColors: Record<string, string> = {
  Keuangan: 'text-yellow-400 border-yellow-500/30',
  Perkebunan: 'text-green-400 border-green-500/30',
  Pertambangan: 'text-gray-400 border-gray-500/30',
  Properti: 'text-red-400 border-red-500/30',
  Reksadana: 'text-blue-400 border-blue-500/30',
};

const sectorBg: Record<string, string> = {
  Keuangan: 'bg-yellow-500/10',
  Perkebunan: 'bg-green-500/10',
  Pertambangan: 'bg-gray-500/10',
  Properti: 'bg-red-500/10',
  Reksadana: 'bg-blue-500/10',
};

export const ActionTable: React.FC = () => {
  const { marketCards, phase, takeActionCard, turnOrder, activePlayerIndex, players } = useGameStore();

  const activePlayerId = turnOrder[activePlayerIndex];
  const activePlayer = players.find(p => p.id === activePlayerId);
  const isUserTurn = activePlayerId === 0;

  if (phase !== 'ACTION') return null;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter text-white">Bursa Aksi</h2>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Pilih 1 kartu untuk giliranmu</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/30">
          <div className={`w-2 h-2 rounded-full animate-pulse ${isUserTurn ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <span className="text-sm font-black uppercase tracking-widest text-white">
            Giliran: <span className={isUserTurn ? 'text-green-400' : 'text-yellow-400'}>{activePlayer?.name}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {marketCards.map((card) => {
          const canClick = isUserTurn;
          return (
            <div 
              key={card.id} 
              className={`group relative ${sectorBg[card.sector]} ${canClick ? 'hover:bg-white/10 cursor-pointer active:scale-95' : 'opacity-50 cursor-not-allowed'} border ${sectorColors[card.sector]} p-4 rounded-xl transition-all overflow-hidden`}
              onClick={() => canClick && takeActionCard(activePlayerId, card.id)}
            >
              {canClick && (
                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MousePointer2 className="w-4 h-4 text-white" />
                </div>
              )}
              <h4 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${sectorColors[card.sector]}`}>{card.title}</h4>
              <p className="text-[11px] text-white/80 leading-relaxed font-medium">{card.description}</p>
            </div>
          );
        })}
        {marketCards.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-2xl text-white/20 font-medium">
            Semua kartu telah diambil.
          </div>
        )}
      </div>
    </div>
  );
};
