import React from 'react';
import { useGameStore } from '@/lib/store';
import { Sector } from '@/lib/types';
import { Lock } from 'lucide-react';

const sectorColors: Record<Sector, string> = {
  Keuangan: 'bg-purple-600',
  Pertanian: 'bg-green-600',
  Pertambangan: 'bg-red-600',
  Properti: 'bg-blue-600',
  Reksadana: 'bg-gray-500',
};

export const MarketBoard: React.FC = () => {
  const market = useGameStore((state) => state.market);
  const suspendedSectors = useGameStore((state) => state.suspendedSectors);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-white/10 backdrop-blur-md rounded-xl">
      {(Object.entries(market) as [Sector, number][]).map(([sector, price]) => {
        const isSuspended = (suspendedSectors as string[]).includes(sector);
        return (
          <div key={sector} className="relative flex flex-col items-center p-3 rounded-lg bg-white/5 border border-white/10 shadow-lg">
            {isSuspended && (
              <div className="absolute top-1 right-1 text-red-400" title="Suspended">
                <Lock size={14} />
              </div>
            )}
            <div className={`w-3 h-3 rounded-full mb-2 ${sectorColors[sector]}`} />
            <h3 className="text-sm font-semibold text-white/70">{sector}</h3>
            <div className="text-2xl font-bold text-white mt-1">{price}</div>
            <div className="text-[10px] uppercase tracking-tighter text-white/40 mt-1">Price Per Share</div>
          </div>
        );
      })}
    </div>
  );
};
