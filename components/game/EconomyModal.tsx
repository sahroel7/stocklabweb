import React, { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { Sector, EconomyCard } from '@/lib/types';
import { TrendingUp, TrendingDown, Minus, Zap, Award, AlertTriangle, RefreshCcw, DollarSign, PlusCircle, MinusCircle, UserMinus, Info, X } from 'lucide-react';

export const EconomyModal: React.FC = () => {
  const { phase, currentEconomyCards, finishEconomyPhase } = useGameStore();
  const [activeDesc, setActiveDesc] = useState<{title: string, desc: string} | null>(null);

  const sectorOrder = useGameStore(state => state.sectorOrder);

  if (phase !== 'ECONOMY' || !currentEconomyCards) return null;

  const { sectors } = currentEconomyCards;
  // Filter out 'Reksa Dana' because it doesn't have an economy card
  const filteredOrder = sectorOrder.filter(s => s !== 'Reksa Dana') as Exclude<Sector, 'Reksa Dana'>[];

  const getCardIcon = (card: EconomyCard, size: number = 16) => {
    if (card.color === 'PURPLE') {
      switch (card.type) {
        case 'RESTRUKTURISASI': return <RefreshCcw size={size} />;
        case 'RESESI': return <TrendingDown size={size} />;
        case 'STIMULUS': return <TrendingUp size={size} />;
        case 'BUYBACK': return <DollarSign size={size} />;
        case 'PENERBITAN_SAHAM': return <PlusCircle size={size} />;
        case 'PAJAK_JALAN': return <UserMinus size={size} />;
        case 'EXTRA_FEE': return <AlertTriangle size={size} />;
        default: return <Zap size={size} />;
      }
    }
    if (card.type === 'DIVIDEND') return <Award size={size} />;
    if (card.value > 0) return <TrendingUp size={size} />;
    if (card.value < 0) return <TrendingDown size={size} />;
    return <Minus size={size} />;
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
      <div className="bg-zinc-950 border border-white/10 w-full max-w-4xl rounded-[2.5rem] shadow-2xl p-4 md:p-8 space-y-4 md:space-y-8 overflow-hidden relative">
        <div className="text-center space-y-1 md:space-y-2">
          <h2 className="text-[10px] md:text-sm font-black uppercase tracking-[0.4em] text-indigo-500">Fase Ekonomi</h2>
          <p className="text-xl md:text-3xl font-bold text-white tracking-tight">Sentimen Pasar Ronde Ini</p>
        </div>

        {/* Sector Cards */}
        <div className="grid grid-cols-4 gap-1.5 md:gap-4">
          {filteredOrder.map((sector) => {
            const card = sectors[sector];
            return (
              <div key={sector} className={`border p-2 md:p-5 rounded-2xl md:rounded-[2rem] flex flex-col gap-2 md:gap-3 transition-all relative overflow-hidden ${getCardColorClass(card.color)}`}>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <span className="text-[5px] md:text-[10px] font-black uppercase tracking-widest opacity-50 truncate mr-1">Saham {sector}</span>
                    <button 
                      onClick={() => setActiveDesc({ title: card.title, desc: card.description })}
                      className="md:hidden text-white/40 hover:text-white"
                    >
                      <Info size={10} />
                    </button>
                  </div>
                  <div className="flex justify-center md:justify-start">
                    <div className="bg-white/5 p-1 rounded-lg">
                      {getCardIcon(card, 14)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-0.5 md:space-y-1">
                  <h3 className="text-[9px] md:text-lg font-black leading-tight text-white truncate md:whitespace-normal">{card.title}</h3>
                  <p className="hidden md:block text-[10px] leading-tight text-white/60 h-8 overflow-hidden line-clamp-2">
                    {card.description}
                  </p>
                </div>

                <div className="mt-auto flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-0">
                  <div className="text-sm md:text-2xl font-black text-white">
                    {card.type === 'PRICE_CHANGE' ? (card.value > 0 ? `+${card.value}` : card.value) : '•'}
                  </div>
                  <div className="px-1 md:px-2 py-0.5 md:py-1 bg-white/10 rounded md:rounded-lg text-[6px] md:text-[9px] font-black uppercase tracking-tighter text-white/80 w-fit">
                    {card.color}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Description Overlay */}
        {activeDesc && (
          <div className="absolute inset-0 z-10 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in zoom-in-95 duration-200">
            <div className="bg-zinc-900 border border-white/10 p-6 rounded-[2rem] max-w-xs w-full space-y-4">
              <div className="flex justify-between items-start">
                <h4 className="text-sm font-black text-white uppercase tracking-wider">{activeDesc.title}</h4>
                <button onClick={() => setActiveDesc(null)} className="text-white/40"><X size={20} /></button>
              </div>
              <p className="text-xs text-white/70 leading-relaxed italic">
                "{activeDesc.desc}"
              </p>
              <button 
                onClick={() => setActiveDesc(null)}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

        <button 
          onClick={finishEconomyPhase}
          className="w-full py-3 md:py-5 bg-white text-black hover:bg-zinc-200 rounded-2xl md:rounded-3xl font-black text-sm md:text-lg uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95"
        >
          Konfirmasi & Lanjut
        </button>
      </div>
    </div>
  );
};

