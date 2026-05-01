import React from 'react';
import { useGameStore } from '@/lib/store';
import { Sector } from '@/lib/types';
import { TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';

export const EconomyModal: React.FC = () => {
  const { phase, currentEconomyCards, finishEconomyPhase } = useGameStore();

  if (phase !== 'ECONOMY' || !currentEconomyCards) return null;

  const { sectors, event } = currentEconomyCards;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-500">
      <div className="bg-zinc-900 border border-white/10 w-full max-w-3xl rounded-[2.5rem] shadow-2xl p-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-sm font-black uppercase tracking-[0.4em] text-indigo-500">Fase Ekonomi</h2>
          <p className="text-3xl font-bold text-white tracking-tight">Hasil Pasar Ronde Ini</p>
        </div>

        {/* Global Event (Purple Card) */}
        {event && (
          <div className="bg-purple-600/10 border border-purple-500/30 p-6 rounded-[2rem] space-y-4 animate-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/40">
                <Zap className="text-white w-6 h-6" />
              </div>
              <div>
                <h4 className="text-purple-400 font-black uppercase tracking-widest text-xs">Peristiwa Global</h4>
                <p className="text-xl font-bold text-white">{event.title}</p>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed italic">"{event.description}"</p>
          </div>
        )}

        {/* Sector Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.entries(sectors) as [Exclude<Sector, 'Reksadana'>, any][]).map(([sector, card]) => (
            <div key={sector} className="bg-white/5 border border-white/10 p-4 rounded-3xl flex flex-col items-center gap-2 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{sector}</span>
              <div className="text-3xl font-black text-white">
                {card.value > 0 ? `+${card.value}` : card.value}
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold uppercase ${card.value > 0 ? 'text-green-400' : card.value < 0 ? 'text-red-400' : 'text-white/40'}`}>
                {card.value > 0 ? <TrendingUp size={12} /> : card.value < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
                <span>{card.value > 0 ? 'Naik' : card.value < 0 ? 'Turun' : 'Tetap'}</span>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={finishEconomyPhase}
          className="w-full py-5 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black text-lg uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95"
        >
          Selesaikan Fase & Lanjut
        </button>
      </div>
    </div>
  );
};
