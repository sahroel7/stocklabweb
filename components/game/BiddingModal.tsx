import React, { useState } from 'react';
import { useGameStore } from '@/lib/store';

export const BiddingModal: React.FC = () => {
  const { phase, players, submitBid, currentBids, resolveBidding } = useGameStore();
  const [bidAmount, setBidAmount] = useState(0);

  if (phase !== 'BIDDING') return null;

  const userHasBid = currentBids[0] !== undefined;
  const allBidsIn = Object.keys(currentBids).length === players.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-in fade-in duration-500">
      <div className="bg-zinc-900 border border-white/10 w-full max-w-md rounded-[2.5rem] shadow-2xl p-6 space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500">Bidding</h2>
          <p className="text-2xl font-bold text-white tracking-tight leading-none">Urutan Jalan</p>
        </div>
        
        <div className="grid grid-cols-5 gap-2">
          {players.map((p) => {
            const hasBid = currentBids[p.id] !== undefined;
            const isUser = p.id === 0;
            return (
              <div
                key={p.id}
                className={`p-2 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all ${
                  hasBid 
                    ? 'bg-indigo-500/10 border-indigo-500/30' 
                    : 'bg-white/5 border-white/10 animate-pulse'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${
                  isUser ? 'bg-white text-black' : 'bg-white/10 text-white'
                }`}>
                  {isUser ? 'YOU' : `B${p.id}`}
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest ${hasBid ? 'text-indigo-400' : 'text-white/20'}`}>
                  {hasBid ? 'OK' : '...'}
                </span>
              </div>
            );
          })}
        </div>

        {!userHasBid ? (
          <div className="bg-indigo-600/10 p-5 rounded-[2rem] border border-indigo-500/20 space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Saldo</p>
                <p className="text-2xl font-black text-white">{players[0].coins} <span className="text-[10px] text-white/40">Koin</span></p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-0.5">Bid: <span className="text-white">{bidAmount}</span></p>
              </div>
            </div>

            <div className="space-y-2">
              <input 
                type="range" 
                min={0} 
                max={players[0].coins}
                value={bidAmount}
                onChange={(e) => setBidAmount(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <button 
              onClick={() => {
                submitBid(0, bidAmount);
              }}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-95"
            >
              Kirim Bid
            </button>
          </div>
        ) : (
          <div className="text-center py-4">
            {!allBidsIn ? (
              <p className="text-white/40 text-[10px] font-medium italic animate-pulse">Menunggu bot...</p>
            ) : (
              <button 
                onClick={resolveBidding}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] font-black text-base uppercase tracking-widest transition-all shadow-xl animate-in zoom-in-95"
              >
                Mulai!
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
