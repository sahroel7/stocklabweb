import React from 'react';
import { useGameStore } from '@/lib/store';
import { Coins } from 'lucide-react';
import { Sector } from '@/lib/types';

const calculateNetWorth = (p: any, market: any) => {
  if (!p || !market) return 0;
  let total = p.coins || 0;
  Object.entries(p.portfolio || {}).forEach(([sector, amount]) => {
    total += (amount as number) * (market[sector as Sector] || 0);
  });
  total += (p.reksaDana || 0) * (market['Reksa Dana'] || 0);
  total -= (p.debt > 0 ? 13 : 0);
  return total;
};

export const UserStats: React.FC = () => {
  const players = useGameStore(state => state.players);
  const market = useGameStore(state => state.market);
  const turnOrder = useGameStore(state => state.turnOrder);
  const activePlayerIndex = useGameStore(state => state.activePlayerIndex);
  
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted || players.length === 0) return <div className="h-10 bg-white/5 animate-pulse rounded-2xl mb-4" />;

  const user = players[0];
  if (!user) return null;

  const activePlayerId = turnOrder[activePlayerIndex];
  const netWorth = calculateNetWorth(user, market);
  const isMyTurn = activePlayerId === 0;

  return (
    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-2 mb-4">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${isMyTurn ? 'bg-indigo-500 animate-pulse' : 'bg-white/20'}`} />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">My Account</span>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Net Worth</span>
            <span className="text-sm font-black text-emerald-400 tabular-nums">${netWorth}</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Cash</span>
            <span className="text-sm font-black text-yellow-400 tabular-nums">{user.coins}</span>
        </div>
        {user.debt === 0 && (
          <button 
            onClick={() => useGameStore.getState().takeDebt(0)}
            className="text-[8px] font-black uppercase px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg transition-all"
          >
            Debt 10
          </button>
        )}
      </div>
    </div>
  );
};

export const PlayerSection: React.FC = () => {
  const players = useGameStore(state => state.players);
  const turnOrder = useGameStore(state => state.turnOrder);
  const activePlayerIndex = useGameStore(state => state.activePlayerIndex);
  const market = useGameStore(state => state.market);
  const sectorOrder = useGameStore(state => state.sectorOrder);

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-16 bg-white/5 animate-pulse rounded-xl" />;

  const activePlayerId = turnOrder[activePlayerIndex];
  
  // Sort by turnOrder if it exists, otherwise fallback to default
  const displayPlayers = turnOrder.length > 0 
    ? turnOrder.map(id => players.find(p => p.id === id)!).filter(Boolean)
    : players;

  return (
    <div className="grid grid-cols-5 gap-2 opacity-80 hover:opacity-100 transition-opacity">
      {displayPlayers.map((p, i) => (
        <div 
          key={p.id} 
          className={`p-2 rounded-xl border transition-all ${
            p.id === 0 
              ? 'bg-indigo-600/10 border-indigo-500/30' 
              : 'bg-white/5 border-white/10'
          } ${activePlayerId === p.id ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/5' : ''}`}
        >
          <div className="flex justify-between items-start mb-1 gap-1">
            <div className="flex flex-col min-w-0 flex-1">
              <div className="text-[9px] font-bold text-white/80 truncate leading-none">
                {p.name}
              </div>
            </div>
            <span className={`text-[8px] font-black uppercase tracking-tight shrink-0 ${activePlayerId === p.id ? 'text-indigo-400' : 'text-white/40'}`}>
              {turnOrder.length > 0 ? `no ${i + 1}` : `P${p.id + 1}`}
            </span>
          </div>
          
          <div className="flex justify-between pt-1.5 mt-1.5 border-t border-white/5 overflow-hidden gap-1">
            {sectorOrder.map((sector) => {
              const amount = sector === 'Reksa Dana' ? p.reksaDana : p.portfolio[sector as Exclude<Sector, 'Reksa Dana'>];
              
              return (
                <div key={sector} className="flex flex-col items-center flex-1">
                  <div className={`w-1 h-1 rounded-full mb-0.5 ${
                    sector === 'Keuangan' ? 'bg-yellow-500' :
                    sector === 'Agrikultur' ? 'bg-green-600' :
                    sector === 'Tambang' ? 'bg-red-600' : 
                    sector === 'Konsumer' ? 'bg-blue-600' : 'bg-zinc-500'
                  }`} />
                  <span className="text-[9px] font-black text-white/60 leading-none">{amount}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
