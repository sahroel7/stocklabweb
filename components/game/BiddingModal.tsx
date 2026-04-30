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
      <div className="bg-zinc-900 border border-white/10 w-full max-w-xl rounded-[2.5rem] shadow-2xl p-8 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-sm font-black uppercase tracking-[0.4em] text-indigo-500">Ronde Bidding</h2>
          <p className="text-3xl font-bold text-white tracking-tight">Tentukan Urutan Jalanmu</p>
        </div>
        
        <div className="grid grid-cols-5 gap-3">
          {players.map((p) => {
            const hasBid = currentBids[p.id] !== undefined;
            const isUser = p.id === 0;
            return (
              <div
                key={p.id}
                className={`p-4 rounded-3xl border flex flex-col items-center justify-center gap-2 transition-all ${
                  hasBid 
                    ? 'bg-indigo-500/10 border-indigo-500/30' 
                    : 'bg-white/5 border-white/10 animate-pulse'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black ${
                  isUser ? 'bg-white text-black' : 'bg-white/10 text-white'
                }`}>
                  {isUser ? 'YOU' : `B${p.id}`}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${hasBid ? 'text-indigo-400' : 'text-white/20'}`}>
                  {hasBid ? 'READY' : '...'}
                </span>
              </div>
            );
          })}
        </div>

        {!userHasBid ? (
          <div className="bg-indigo-600/10 p-8 rounded-[2rem] border border-indigo-500/20 space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Saldo Tersedia</p>
                <p className="text-3xl font-black text-white">{players[0].coins} <span className="text-sm text-white/40">Koin</span></p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Min Bid</p>
                <p className="text-xl font-black text-white">0</p>
              </div>
            </div>

            <div className="space-y-4">
              <input 
                type="range" 
                min={0} 
                max={players[0].coins}
                value={bidAmount}
                onChange={(e) => setBidAmount(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] font-black text-white/20 uppercase tracking-widest">
                <span>0</span>
                <span>Bid: {bidAmount} Koin</span>
                <span>{players[0].coins}</span>
              </div>
            </div>

            <button 
              onClick={() => {
                submitBid(0, bidAmount);
              }}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg uppercase tracking-[0.2em] transition-all shadow-xl shadow-indigo-900/40 active:scale-95"
            >
              Kirim Bid Rahasia
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            {!allBidsIn ? (
              <p className="text-white/40 font-medium italic animate-bounce">Menunggu bot lain memberikan bid...</p>
            ) : (
              <button 
                onClick={resolveBidding}
                className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] font-black text-xl uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-900/40 animate-in zoom-in-95"
              >
                Buka Bid & Mulai!
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
