'use client';

import React, { useEffect } from 'react';
import { useGameStore } from '@/lib/store';
import { Sector } from '@/lib/types';
import { MarketBoard } from '@/components/game/MarketBoard';
import { GameLog } from '@/components/game/GameLog';
import { ActionTable } from '@/components/game/ActionTable';
import { BiddingModal } from '@/components/game/BiddingModal';
import { ChoiceModal } from '@/components/game/ChoiceModal';
import { EconomyModal } from '@/components/game/EconomyModal';
import { PlayerSection } from '@/components/game/PlayerSection';
import { InteractionOverlay } from '@/components/game/InteractionOverlay';
import { Trophy, RefreshCcw, Info, HelpCircle, X } from 'lucide-react';

export default function StocklabPage() {
  const [showRules, setShowRules] = React.useState(false);
  const { 
    round, 
    phase, 
    players, 
    market, 
    resetGame, 
    turnOrder, 
    activePlayerIndex, 
    marketCards, 
    takeActionCard, 
    pendingAction, 
    handleChoice,
    interaction,
    drawMarketCards,
    submitBid,
    resolveBidding,
    sellStock,
    resolveEconomy
  } = useGameStore();

  const activePlayerId = turnOrder[activePlayerIndex];
  const activePlayer = players.find(p => p.id === activePlayerId);

  // Bot Automation
  useEffect(() => {
    // 1. BIDDING PHASE AUTOMATION
    if (phase === 'BIDDING') {
      const botsToBid = players.filter(p => p.id !== 0 && useGameStore.getState().currentBids[p.id] === undefined);
      if (botsToBid.length > 0) {
        const timer = setTimeout(() => {
          botsToBid.forEach(bot => {
            // Simple bot bidding: bid between 0 and 20% of coins
            const maxBid = Math.floor(bot.coins * 0.2);
            const bid = Math.floor(Math.random() * (maxBid + 1));
            submitBid(bot.id, bid);
          });
        }, 1000);
        return () => clearTimeout(timer);
      } else if (Object.keys(useGameStore.getState().currentBids).length === players.length) {
        // All bids in, resolve!
        const timer = setTimeout(resolveBidding, 1000);
        return () => clearTimeout(timer);
      }
    }

    // 2. ACTION PHASE AUTOMATION
    if (phase === 'ACTION' && activePlayerId !== undefined && activePlayerId !== 0 && !interaction) {
      const bot = players.find(p => p.id === activePlayerId);
      if (!bot) return;

      const timer = setTimeout(() => {
        if (pendingAction) {
          if (pendingAction.playerId === activePlayerId) {
            // Bot Decision Logic
            const { card } = pendingAction;
            const currentHoldings = bot.portfolio[card.sector as keyof typeof bot.portfolio];
            
            // Priority 1: Sell if coins are very low
            if (bot.coins < 3) {
              handleChoice('SELL');
            }
            // Priority 2: Convert to share if holdings are low
            else if (currentHoldings < 3) {
              handleChoice('SHARE');
            } 
            // Priority 3: Use Action
            else {
              handleChoice('ACTION');
            }
          }
        } else if (marketCards.length > 0) {
          const randomCard = marketCards[Math.floor(Math.random() * marketCards.length)];
          takeActionCard(activePlayerId, randomCard.id);
        }
      }, 1500);

      return () => clearTimeout(timer);
    }

    // 3. SELLING PHASE AUTOMATION
    if (phase === 'SELLING') {
      if (activePlayerId !== 0 && activePlayerId !== undefined) {
        const timer = setTimeout(() => {
          // Bot selling logic: Sell if cash is low (< 5)
          if (activePlayer && activePlayer.coins < 5) {
            const sectorsWithStock = Object.entries(activePlayer.portfolio)
              .filter(([_, amount]) => (amount as number) > 0);
            if (sectorsWithStock.length > 0) {
              sellStock(activePlayerId, sectorsWithStock[0][0] as Sector, 1);
              // Small extra delay after selling before finishing turn
              setTimeout(useGameStore.getState().nextTurn, 1000);
              return;
            }
          }
          // Finish turn
          useGameStore.getState().nextTurn();
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [phase, activePlayerId, pendingAction, marketCards, handleChoice, takeActionCard, players, activePlayerIndex, drawMarketCards, submitBid, resolveBidding, sellStock, resolveEconomy, activePlayer, useGameStore.getState().extraTurns]);

  const calculateScore = (player: typeof players[0]) => {
    let total = player.coins;
    Object.entries(player.portfolio).forEach(([sector, amount]) => {
      total += (amount as number) * (market[sector as keyof typeof market] || 0);
    });
    total += player.reksaDana * (market['Reksa Dana'] || 0);
    total -= (player.debt > 0 ? 13 : 0);
    return total;
  };

  const sortedWinners = [...players].sort((a, b) => calculateScore(b) - calculateScore(a));

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-12 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tighter uppercase italic text-indigo-500">Stocklab</h1>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="bg-indigo-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">R{round}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setShowRules(true)}
               className="p-1.5 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
             >
               <HelpCircle className="w-4 h-4" />
             </button>
             <button 
               onClick={resetGame}
               className="p-1.5 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"
             >
               <RefreshCcw className="w-4 h-4" />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-2 md:p-6 space-y-4">
        {phase === 'END' ? (
          <div className="max-w-2xl mx-auto text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="inline-flex p-4 bg-yellow-500/10 rounded-full mb-4">
              <Trophy className="w-16 h-16 text-yellow-500" />
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tight">Permainan Berakhir!</h2>
            
            <div className="space-y-4">
              {sortedWinners.map((p, i) => (
                <div 
                  key={p.id} 
                  className={`flex justify-between items-center p-6 rounded-2xl border ${
                    i === 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-2xl font-black ${i === 0 ? 'text-yellow-500' : 'text-white/20'}`}>#{i + 1}</span>
                    <div className="text-left">
                      <div className="font-bold text-xl">{p.name}</div>
                      <div className="text-xs text-white/40 uppercase tracking-widest">Final Net Worth</div>
                    </div>
                  </div>
                  <div className="text-3xl font-black tabular-nums">{calculateScore(p)}</div>
                </div>
              ))}
            </div>

            <button 
              onClick={resetGame}
              className="px-12 py-4 bg-white text-black rounded-full font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl"
            >
              Play Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <MarketBoard />
              <PlayerSection />
              <ActionTable />
            </div>
            
            <div className="lg:col-span-4 h-fit lg:sticky lg:top-24">
              <div className="space-y-6">
                <div className="h-[400px]">
                  <GameLog />
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3">
                  <Info className="w-5 h-5 text-indigo-400 shrink-0" />
                  <p className="text-[11px] text-white/40 leading-relaxed italic">
                    Tip: Perhatikan harga Sektor. Split terjadi di atas 12, Crash di bawah 2. Gunakan Rumor dengan bijak untuk memanipulasi pasar sebelum fase Ekonomi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <BiddingModal />
      <ChoiceModal />
      <EconomyModal />
      <InteractionOverlay />

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative my-auto">
            <button 
              onClick={() => setShowRules(false)}
              className="absolute top-8 right-8 p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white/40 hover:text-white" />
            </button>
            
            <div className="space-y-8">
              <div className="space-y-2 text-center md:text-left">
                <h2 className="text-sm font-black uppercase tracking-[0.4em] text-indigo-500">Panduan Bermain</h2>
                <p className="text-4xl font-black text-white tracking-tight">Aturan Stocklab</p>
              </div>

              <div className="grid gap-4 md:gap-6">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 p-6 bg-white/5 rounded-3xl border border-white/5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl shrink-0">1</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg">Fase Bidding</h4>
                    <p className="text-white/50 text-sm leading-relaxed text-pretty">Berikan penawaran koin secara rahasia. Pemain dengan bid tertinggi jalan duluan. Koin bid akan dibayarkan ke Bank.</p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 md:gap-6 p-6 bg-white/5 rounded-3xl border border-white/5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl shrink-0">2</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg">Fase Aksi</h4>
                    <p className="text-white/50 text-sm leading-relaxed text-pretty">Pilih 2 kartu dari Bursa Aksi. Untuk setiap kartu, kamu bisa memilih: 
                    <span className="block mt-1 text-indigo-400 font-bold">A. Simpan Saham | B. Mainkan Efek Aksi | C. Jual Tunai</span></p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 md:gap-6 p-6 bg-white/5 rounded-3xl border border-white/5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl shrink-0">3</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg">Ekonomi & Split/Crash</h4>
                    <p className="text-white/50 text-sm leading-relaxed text-pretty">Di akhir ronde, harga pasar akan berubah.
                    <span className="block mt-1">📈 <b>Split (&gt;12):</b> Harga jadi 6, jumlah lembar sahammu <b>Dua Kali Lipat</b>.</span>
                    <span className="block mt-1">📉 <b>Crash (&lt;2):</b> Harga jadi 5, seluruh lembar saham sektor itu <b>Hangus (0)</b>.</span></p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 md:gap-6 p-6 bg-white/5 rounded-3xl border border-white/5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl shrink-0">4</div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-lg">Pinjaman & Pemenang</h4>
                    <p className="text-white/50 text-sm leading-relaxed text-pretty">Bisa pinjam 10 koin tapi harus bayar 13 koin di akhir ronde 6. Pemenang adalah yang memiliki <b>Net Worth</b> tertinggi.</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowRules(false)}
                className="w-full py-5 bg-white text-black rounded-2xl font-black text-lg uppercase tracking-widest transition-all hover:scale-[1.02] shadow-xl shadow-white/10"
              >
                Saya Mengerti, Ayo Main!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
