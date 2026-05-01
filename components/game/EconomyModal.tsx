import React from 'react';
import { useGameStore } from '@/lib/store';
import { Sector, EconomyCard } from '@/lib/types';
import { TrendingUp, TrendingDown, Minus, Zap, Award, AlertTriangle, RefreshCcw, DollarSign, PlusCircle, MinusCircle, UserMinus } from 'lucide-react';

export const EconomyModal: React.FC = () => {
  const { phase, currentEconomyCards, finishEconomyPhase } = useGameStore();

  if (phase !== 'ECONOMY' || !currentEconomyCards) return null;

  const { sectors } = currentEconomyCards;

  const getCardIcon = (card: EconomyCard) => {
    if (card.color === 'PURPLE') {
      switch (card.type) {
        case 'RESTRUKTURISASI': return <RefreshCcw size={16} />;
        case 'RESESI': return <TrendingDown size={16} />;
        case 'STIMULUS': return <TrendingUp size={16} />;
        case 'BUYBACK': return <DollarSign size={16} />;
        case 'PENERBITAN_SAHAM': return <PlusCircle size={16} />;
        case 'PAJAK_JALAN': return <UserMinus size={16} />;
        case 'EXTRA_FEE': return <AlertTriangle size={16} />;
        default: return <Zap size={16} />;
      }
    }
    if (card.type === 'DIVIDEND') return <Award size={16} />;
    if (card.value > 0) return <TrendingUp size={16} />;
    if (card.value < 0) return <TrendingDown size={16} />;
    return <Minus size={16} />;
  };

  const getCardColorClass = (color: string) => {
    switch (color) {
      case 'GREEN': return 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400';
      case 'RED': return 'border-red-500/50 bg-red-500/10 text-red-400';
      case 'BLUE': return 'border-blue-500/50 bg-blue-500/10 text-blue-400';
      case 'PURPLE': return 'border-purple-500/50 bg-purple-500/10 text-purple-400';
      default: return 'border-white/10 bg-white/5 text-white/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-500">
      <div className="bg-zinc-950 border border-white/10 w-full max-w-4xl rounded-[2.5rem] shadow-2xl p-8 space-y-8 overflow-hidden">
        <div className="text-center space-y-2">
          <h2 className="text-sm font-black uppercase tracking-[0.4em] text-indigo-500">Fase Ekonomi</h2>
          <p className="text-3xl font-bold text-white tracking-tight">Sentimen Pasar Ronde Ini</p>
        </div>

        {/* Sector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.entries(sectors) as [Exclude<Sector, 'Reksa Dana'>, EconomyCard][]).map(([sector, card]) => (
            <div key={sector} className={`border p-5 rounded-[2rem] flex flex-col gap-3 transition-all ${getCardColorClass(card.color)}`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Saham {sector}</span>
                {getCardIcon(card)}
              </div>
              
              <div className="space-y-1">
                <h3 className="text-lg font-black leading-tight text-white">{card.title}</h3>
                <p className="text-[10px] leading-tight text-white/60 h-8 overflow-hidden line-clamp-2">
                  {card.description}
                </p>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="text-2xl font-black text-white">
                  {card.type === 'PRICE_CHANGE' ? (card.value > 0 ? `+${card.value}` : card.value) : '•'}
                </div>
                <div className="px-2 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-tighter text-white/80">
                  {card.color}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={finishEconomyPhase}
          className="w-full py-5 bg-white text-black hover:bg-zinc-200 rounded-3xl font-black text-lg uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95"
        >
          Konfirmasi & Lanjut
        </button>
      </div>
    </div>
  );
};
