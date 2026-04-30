import React from 'react';
import { useGameStore } from '@/lib/store';
import { Sector } from '@/lib/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const sectorColors: Record<Sector, string> = {
  Agri: 'bg-green-500',
  Mining: 'bg-gray-800',
  Consumer: 'bg-red-500',
  Financial: 'bg-yellow-500',
  MutualFund: 'bg-blue-500',
};

export const MarketBoard: React.FC = () => {
  const market = useGameStore((state) => state.market);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-white/10 backdrop-blur-md rounded-xl">
      {(Object.entries(market) as [Sector, number][]).map(([sector, price]) => (
        <div key={sector} className="flex flex-col items-center p-3 rounded-lg bg-white/5 border border-white/10 shadow-lg">
          <div className={`w-3 h-3 rounded-full mb-2 ${sectorColors[sector]}`} />
          <h3 className="text-sm font-semibold text-white/70">{sector}</h3>
          <div className="text-2xl font-bold text-white mt-1">{price}</div>
          <div className="text-[10px] uppercase tracking-tighter text-white/40 mt-1">Price Per Share</div>
        </div>
      ))}
    </div>
  );
};
