import React from 'react';
import { useGameStore } from '@/lib/store';
import { Sector } from '@/lib/types';
import { Lock } from 'lucide-react';

const sectorColors: Record<Sector, string> = {
  Keuangan: 'bg-yellow-600',
  Agrikultur: 'bg-green-600',
  Tambang: 'bg-red-600',
  Konsumer: 'bg-blue-600',
  'Reksa Dana': 'bg-gray-500',
};

export const MarketBoard: React.FC = () => {
  const market = useGameStore((state) => state.market);
  const suspendedSectors = useGameStore((state) => state.suspendedSectors);

  const orderedSectors: Sector[] = [
    'Keuangan',
    'Agrikultur',
    'Reksa Dana',
    'Tambang',
    'Konsumer'
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-white/10 backdrop-blur-md rounded-xl">
      {orderedSectors.map((sector) => {
        const price = market[sector];
        const isSuspended = (suspendedSectors as string[]).includes(sector);
        const displayName = sector === 'Reksa Dana' ? sector : `Saham ${sector}`;
        
        return (
          <div key={sector} className="relative flex flex-col items-center p-3 rounded-lg bg-white/5 border border-white/10 shadow-lg">
            {isSuspended && (
              <div className="absolute top-1 right-1 text-red-400" title="Suspended">
                <Lock size={14} />
              </div>
            )}
            <div className={`w-3 h-3 rounded-full mb-2 ${sectorColors[sector]}`} />
            <h3 className="text-sm font-semibold text-white/70">{displayName}</h3>
            <div className="text-2xl font-bold text-white mt-1">{price}</div>
            <div className="text-[10px] uppercase tracking-tighter text-white/40 mt-1">Price Per Share</div>
          </div>
        );
      })}
    </div>
  );
};
