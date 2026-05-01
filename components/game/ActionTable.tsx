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
  const { marketCards, phase, drawMarketCards, takeActionCard, turnOrder, activePlayerIndex, players } = useGameStore();

  const activePlayerId = turnOrder[activePlayerIndex];

  if (phase !== 'ACTION') return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Bursa Aksi (Action Cards)</h2>
        {marketCards.length === 0 && (
          <button 
            onClick={drawMarketCards}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium shadow-lg"
          >
            Buka {players.length * 2} Kartu
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {marketCards.map((card) => (
          <div 
            key={card.id} 
            className={`group relative ${sectorBg[card.sector]} hover:bg-white/10 border ${sectorColors[card.sector]} p-4 rounded-xl transition-all cursor-pointer overflow-hidden`}
            onClick={() => takeActionCard(activePlayerId, card.id)}
          >
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <MousePointer2 className="w-4 h-4 text-white" />
            </div>
            <h4 className={`text-[10px] font-black uppercase tracking-widest mb-2 ${sectorColors[card.sector]}`}>{card.title}</h4>
            <p className="text-[11px] text-white/80 leading-relaxed font-medium">{card.description}</p>
          </div>
        ))}
        {marketCards.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-white/5 rounded-2xl text-white/20 font-medium">
            Waiting for cards to be drawn...
          </div>
        )}
      </div>
    </div>
  );
};
