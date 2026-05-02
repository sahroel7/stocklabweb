'use client';

import React, { useState, useEffect } from 'react';
import { useGameStore } from '@/lib/store';
import { Plus, Minus } from 'lucide-react';

export const BiddingModal: React.FC = () => {
  const { phase, players, submitBid, currentBids, resolveBidding } = useGameStore();
  const [bidAmount, setBidAmount] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Find the first player who hasn't bid yet
  const nextPlayerToBid = players.find(p => currentBids[p.id] === undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset bidAmount when it's a new human player's turn to bid
  useEffect(() => {
    if (nextPlayerToBid && !nextPlayerToBid.isBot) {
      setBidAmount(0);
    }
  }, [nextPlayerToBid?.id]);

  // Auto-bot bidding logic
  useEffect(() => {
    if (mounted && phase === 'BIDDING') {
      const botsToBid = players.filter(p => p.isBot && currentBids[p.id] === undefined);
      
      if (botsToBid.length > 0) {
        const timers = botsToBid.map((bot, index) => {
          return setTimeout(() => {
            const difficulty = bot.difficulty || 'HARD';
            let amount = 0;
            
            if (difficulty === 'HARD') {
              const currentRound = useGameStore.getState().round;
              if (currentRound === 1) {
                amount = Math.floor(Math.random() * 8) + 5; 
              } else {
                if (bot.coins > 20) {
                  amount = Math.floor(Math.random() * 10) + 5;
                } else if (bot.coins > 10) {
                  amount = Math.floor(Math.random() * 5) + 2;
                } else {
                  amount = Math.floor(Math.random() * 3);
                }
              }
            } else {
              amount = Math.floor(Math.random() * 3);
            }
            
            submitBid(bot.id, Math.min(amount, bot.coins));
          }, 500 + (index * 200));
        });

        return () => timers.forEach(t => clearTimeout(t));
      }
    }
  }, [mounted, phase, currentBids, players, submitBid]);

  if (!mounted || phase !== 'BIDDING') return null;

  const allBidsIn = Object.keys(currentBids).length === players.length;
  const currentPlayerCoins = nextPlayerToBid?.coins || 0;

  const handleIncrement = () => {
    if (bidAmount < currentPlayerCoins) setBidAmount(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (bidAmount > 0) setBidAmount(prev => prev - 1);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-500">
      <div className="bg-zinc-950 border border-white/10 w-full max-w-md rounded-[3rem] shadow-2xl p-6 md:p-8 space-y-6 md:space-y-8">
        <div className="text-center space-y-1">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Fase Lelang</h2>
          <p className="text-2xl font-black text-white tracking-tight uppercase">Tentukan Urutan</p>
        </div>
        
        <div className="grid grid-cols-5 gap-2">
          {players.map((p) => {
            const hasBid = currentBids[p.id] !== undefined;
            const isActive = nextPlayerToBid?.id === p.id;
            return (
              <div
                key={p.id}
                className={`p-2 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  hasBid 
                    ? 'bg-indigo-500/10 border-indigo-500/30' 
                    : isActive ? 'bg-white/10 border-indigo-500/50 animate-pulse' : 'bg-white/5 border-white/10'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${
                  isActive ? 'bg-indigo-600 text-white' : hasBid ? 'bg-white/20 text-white' : 'bg-white/10 text-white/40'
                }`}>
                  {p.id === 0 ? 'YOU' : p.isBot ? `B${p.id}` : `P${p.id + 1}`}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${hasBid ? 'text-indigo-400' : isActive ? 'text-white' : 'text-white/20'}`}>
                  {hasBid ? 'OK' : isActive ? 'BID' : '...'}
                </span>
              </div>
            );
          })}
        </div>

        {!allBidsIn && nextPlayerToBid && !nextPlayerToBid.isBot ? (
          <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-xs font-black text-white/60 uppercase tracking-widest">Giliran: <span className="text-indigo-500">{nextPlayerToBid.name}</span></p>
            </div>

            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Saldo</p>
                <p className="text-3xl font-black text-white tabular-nums">{currentPlayerCoins}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Penawaran</p>
                <p className="text-3xl font-black text-indigo-500 tabular-nums">{bidAmount}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                type="button"
                onClick={handleDecrement}
                className="w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all"
              >
                <Minus size={20} />
              </button>
              
              <div className="flex-1 px-2">
                <input 
                  type="range" 
                  min={0} 
                  max={currentPlayerCoins}
                  value={bidAmount}
                  onInput={(e) => setBidAmount(parseInt((e.target as HTMLInputElement).value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
                />
              </div>

              <button 
                type="button"
                onClick={handleIncrement}
                className="w-12 h-12 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all"
              >
                <Plus size={20} />
              </button>
            </div>

            <button 
              type="button"
              onClick={() => submitBid(nextPlayerToBid.id, bidAmount)}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[1.5rem] font-black text-lg uppercase tracking-widest transition-all shadow-xl active:scale-95"
            >
              Kirim Penawaran
            </button>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            {!allBidsIn ? (
              <div className="space-y-2">
                <div className="flex justify-center gap-1">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                </div>
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Menunggu {nextPlayerToBid?.isBot ? 'Bot' : 'Pemain'} Selesai...</p>
              </div>
            ) : (
              <button 
                type="button"
                onClick={resolveBidding}
                className="w-full py-6 bg-white text-black rounded-[2rem] font-black text-xl uppercase tracking-widest transition-all shadow-2xl animate-in zoom-in-95 hover:bg-zinc-200 active:scale-95"
              >
                Mulai Ronde
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
