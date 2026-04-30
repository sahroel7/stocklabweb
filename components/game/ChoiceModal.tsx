import React from 'react';
import { useGameStore } from '@/lib/store';
import { Sector } from '@/lib/types';

export const ChoiceModal: React.FC = () => {
  const { pendingAction, handleChoice, market } = useGameStore();

  if (!pendingAction || pendingAction.playerId !== 0) return null;

  const { card } = pendingAction;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-sm font-black uppercase tracking-[0.3em] text-indigo-500">Pick Your Path</h2>
          <p className="text-2xl font-bold text-white leading-tight">
            You won <span className="text-indigo-400">{card.title}</span>. How will you use it?
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => handleChoice('SELL')}
            className="group relative flex flex-col items-center p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all"
          >
            <div className="text-xs font-black uppercase tracking-widest text-white/40 mb-1">Option A</div>
            <div className="text-xl font-bold text-white">Sell Card</div>
            <div className="text-[10px] text-white/40 mt-2 italic">
              Gain 10 coins to spend.
            </div>
          </button>

          <button
            onClick={() => handleChoice('ACTION')}
            className="group relative flex flex-col items-center p-6 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/50 rounded-2xl transition-all shadow-lg shadow-indigo-500/20"
          >
            <div className="text-xs font-black uppercase tracking-widest text-indigo-200 mb-1">Option B</div>
            <div className="text-xl font-bold text-white">Play Action Card</div>
            <div className="text-[10px] text-indigo-200 mt-2 italic text-center">
              {card.description}
            </div>
          </button>
        </div>

        {card.type === 'RUMOR' && (
           <div className="flex gap-2">
             <button 
               onClick={() => handleChoice('ACTION', 2)}
               className="flex-1 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold uppercase"
             >
               +2 Price
             </button>
             <button 
               onClick={() => handleChoice('ACTION', -2)}
               className="flex-1 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold uppercase"
             >
               -2 Price
             </button>
           </div>
        )}

        {card.type === 'MARKET_BOOM_CRASH' && (
           <div className="flex gap-2">
             <button 
               onClick={() => handleChoice('ACTION', 3)}
               className="flex-1 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-bold uppercase"
             >
               Boom (+3 All)
             </button>
             <button 
               onClick={() => handleChoice('ACTION', -3)}
               className="flex-1 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold uppercase"
             >
               Crash (-3 All)
             </button>
           </div>
        )}
      </div>
    </div>
  );
};
