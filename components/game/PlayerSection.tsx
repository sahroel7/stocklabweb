import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/store';
import { Coins, Eye, EyeOff } from 'lucide-react';
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
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => setMounted(true), []);

  const activePlayerId = turnOrder[activePlayerIndex] ?? players[0]?.id;
  const activePlayer = players.find(p => p.id === activePlayerId) || players[0];

  // Auto-hide stats when player turn changes
  useEffect(() => {
    setIsRevealed(false);
  }, [activePlayerId]);

  if (!mounted || players.length === 0) return <div className="h-10 bg-white/5 animate-pulse rounded-2xl mb-4" />;

  const netWorth = calculateNetWorth(activePlayer, market);

  return (
    <div className={`flex items-center justify-between bg-white/5 border rounded-2xl px-4 py-2 mb-4 transition-all ${activePlayer.isBot ? 'border-white/10' : 'border-indigo-500/30 bg-indigo-500/5'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${activePlayer.isBot ? 'bg-white/20' : 'bg-indigo-500 animate-pulse'}`} />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
          {activePlayer.isBot ? 'Bot Account' : `Active Player: ${activePlayer.name}`}
        </span>

        {!activePlayer.isBot && (
          <button 
            onClick={() => setIsRevealed(!isRevealed)}
            className="p-1 hover:bg-white/5 rounded-lg transition-colors text-indigo-400 flex items-center justify-center"
            title={isRevealed ? "Hide Stats" : "Reveal Stats"}
          >
            {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Net Worth</span>
            <span className={`text-sm font-black text-emerald-400 tabular-nums transition-all duration-300 ${!activePlayer.isBot && !isRevealed ? 'blur-md select-none opacity-20' : 'blur-0'}`}>
              ${netWorth}
            </span>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Cash</span>
            <span className={`text-sm font-black text-yellow-400 tabular-nums transition-all duration-300 ${!activePlayer.isBot && !isRevealed ? 'blur-md select-none opacity-20' : 'blur-0'}`}>
              {activePlayer.coins}
            </span>
        </div>
        {!activePlayer.isBot && activePlayer.debt === 0 && (
          <button 
            onClick={() => useGameStore.getState().takeDebt(activePlayer.id)}
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
            p.id === activePlayerId 
              ? 'bg-indigo-600/10 border-indigo-500/50 shadow-lg shadow-indigo-500/5' 
              : 'bg-white/5 border-white/10'
          }`}
        >
          <div className="flex justify-between items-start mb-1 gap-1">
            <div className="flex flex-col min-w-0 flex-1">
              <div className={`text-[9px] font-bold truncate leading-none ${p.id === activePlayerId ? 'text-white' : 'text-white/60'}`}>
                {p.name}
              </div>
            </div>
            <span className={`text-[8px] font-black uppercase tracking-tight shrink-0 ${activePlayerId === p.id ? 'text-indigo-400' : 'text-white/20'}`}>
              {p.isBot ? `Bot` : `Player`}
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
