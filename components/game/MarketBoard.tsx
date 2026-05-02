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
  const sectorOrder = useGameStore((state) => state.sectorOrder);

  const phase = useGameStore(state => state.phase);

  // Mencegah flash konten yang salah sebelum hydration selesai
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-24 bg-white/5 animate-pulse rounded-xl" />;
  }

  return (
    <div className="grid grid-cols-5 gap-2 p-2 bg-white/10 backdrop-blur-md rounded-xl">
      {sectorOrder.map((sector) => {
        const price = market[sector];
        const isSuspended = (suspendedSectors as string[]).includes(sector);
        const isRD = sector === 'Reksa Dana';
        const showPrice = !isRD || phase === 'SELLING' || phase === 'END';
        const displayName = isRD ? 'Reksa Dana' : `Saham ${sector}`;
        
        return (
          <div key={sector} className="relative flex flex-col items-center p-2 rounded-lg bg-white/5 border border-white/10 shadow-lg min-w-0">
            {isSuspended && (
              <div className="absolute top-0.5 right-0.5 text-red-400" title="Suspended">
                <Lock size={10} />
              </div>
            )}
            <div className={`w-2 h-2 rounded-full mb-1 ${sectorColors[sector]}`} />
            <h3 className="text-[9px] font-bold text-white/70 truncate w-full text-center whitespace-nowrap">{displayName}</h3>
            <div className="text-lg font-black text-white leading-none mt-1">
              {showPrice ? price : '?'}
            </div>
            <div className="text-[7px] uppercase tracking-tighter text-white/30 mt-1 hidden md:block">Price</div>
          </div>
        );
      })}
    </div>
  );
};
