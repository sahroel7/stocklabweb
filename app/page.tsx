'use client';

import React, { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store';
import { Sector } from '@/lib/types';
import { MarketBoard } from '@/components/game/MarketBoard';
import { GameLog } from '@/components/game/GameLog';
import { ActionTable } from '@/components/game/ActionTable';
import { BiddingModal } from '@/components/game/BiddingModal';
import { ChoiceModal } from '@/components/game/ChoiceModal';
import { EconomyModal } from '@/components/game/EconomyModal';
import { PlayerSection, UserStats } from '@/components/game/PlayerSection';
import { InteractionOverlay } from '@/components/game/InteractionOverlay';
import { SellingModal } from '@/components/game/SellingModal';
import { Trophy, RefreshCcw, Info, HelpCircle, X, Brain, Zap, Gauge } from 'lucide-react';

export default function StocklabPage() {
  const [showRules, setShowRules] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const { 
    round, phase, players, market, resetGame, initializeGame,
    turnOrder, activePlayerIndex, marketCards, takeActionCard, 
    pendingAction, handleChoice, interaction, sellStock
  } = useGameStore();

  useEffect(() => {
    setMounted(true);
    initializeGame();
  }, [initializeGame]);

  const activePlayerId = turnOrder[activePlayerIndex];
  const activePlayer = players.find(p => p.id === activePlayerId);

  // Bot Automation Logic
  useEffect(() => {
    if (!mounted || phase === 'BIDDING' || phase === 'END') return;

    // 1. ACTION PHASE AUTOMATION
    if (phase === 'ACTION' && activePlayerId !== undefined && activePlayerId !== 0 && !interaction) {
      const bot = players.find(p => p.id === activePlayerId);
      if (!bot) return;

      const difficulty = bot.difficulty || 'MEDIUM';

      const timer = setTimeout(() => {
        if (pendingAction) {
          if (pendingAction.playerId === activePlayerId) {
            const { card } = pendingAction;
            const price = market[card.sector];
            const currentHoldings = bot.portfolio[card.sector as keyof typeof bot.portfolio] || 0;
            
            // EASY BOT: Random decisions
            if (difficulty === 'EASY') {
              const choices: ('SHARE' | 'ACTION' | 'SELL')[] = ['SHARE', 'ACTION', 'SELL'];
              handleChoice(choices[Math.floor(Math.random() * choices.length)]);
            } 
            // MEDIUM BOT: Basic survival logic
            else if (difficulty === 'MEDIUM') {
              if (bot.coins < 3) handleChoice('SELL');
              else if (currentHoldings < 3) handleChoice('SHARE');
              else handleChoice('ACTION');
            }
            // HARD BOT: Professional Strategic Decisions
            else if (difficulty === 'HARD') {
              const myShares = bot.portfolio[card.sector as Exclude<Sector, 'Reksa Dana'>] || 0;
              
              // 1. PROFIT TAKING (High Priority)
              if (price >= 11) {
                handleChoice('SELL');
              }
              // 2. TACTICAL ACTION
              else if (
                // Use Akuisisi if we have enough shares and target has shares
                (card.type === 'AKUISISI' && players.some(p => p.id !== bot.id && (p.portfolio[card.sector as Exclude<Sector, 'Reksa Dana'>] || 0) > 0) && myShares > 0) ||
                // Use Rumor to pump price if we hold many shares or price is low
                (card.type === 'RUMOR' && (price <= 7 || myShares >= 3)) ||
                // Always use Info Bursa for cash and info
                (card.type === 'INFO_BURSA') ||
                // Use Quickbuy if market is rich
                (card.type === 'QUICKBUY' && marketCards.length >= 2)
              ) {
                handleChoice('ACTION');
              }
              // 3. VALUE INVESTING
              else if (price <= 8 || myShares < 2) {
                handleChoice('SHARE');
              }
              // 4. LIQUIDITY
              else if (bot.coins < 5) {
                handleChoice('SELL');
              }
              else {
                handleChoice('SHARE');
              }
            }
          }
        } else if (marketCards.length > 0) {
          // Card Selection Strategy
          let selectedCard = marketCards[0];
          
          if (difficulty === 'HARD') {
            // Professional Selection: Sort by market price + tactical value
            const sortedCards = [...marketCards].sort((a, b) => {
              let scoreA = market[a.sector];
              let scoreB = market[b.sector];
              
              // Bonus weight for powerful actions
              if (a.type === 'AKUISISI') scoreA += 4;
              if (a.type === 'QUICKBUY') scoreA += 3;
              if (b.type === 'AKUISISI') scoreB += 4;
              if (b.type === 'QUICKBUY') scoreB += 3;

              return scoreB - scoreA;
            });
            selectedCard = sortedCards[0];
          } else if (difficulty === 'MEDIUM') {
            selectedCard = marketCards[Math.floor(Math.random() * Math.min(3, marketCards.length))];
          } else {
            selectedCard = marketCards[Math.floor(Math.random() * marketCards.length)];
          }

          takeActionCard(activePlayerId, selectedCard.id);
        }
      }, difficulty === 'HARD' ? 600 : 1200);

      return () => clearTimeout(timer);
    }

    // 2. SELLING PHASE AUTOMATION
    if (phase === 'SELLING' && activePlayerId !== 0 && activePlayerId !== undefined) {
      const bot = players.find(p => p.id === activePlayerId);
      if (!bot) return;
      const difficulty = bot.difficulty || 'MEDIUM';

      const timer = setTimeout(() => {
        if (difficulty === 'HARD') {
          // Hard Bot: Only sell at high prices or to fund next bidding
          const targets = (Object.entries(bot.portfolio) as [Sector, number][])
            .filter(([s, amt]) => amt > 0 && (market[s] >= 11 || bot.coins < 5))
            .sort((a, b) => market[b[0]] - market[a[0]]);

          if (targets.length > 0) {
            const sectorToSell = targets[0][0];
            const amountToSell = bot.portfolio[sectorToSell as keyof typeof bot.portfolio] || 0;
            sellStock(activePlayerId, sectorToSell, amountToSell);
            setTimeout(() => useGameStore.getState().nextTurn(), 400);
            return;
          }
        } else {
          // Normal/Easy Bot: Sell if broke
          if (bot.coins < 5) {
            const sectorsWithStock = Object.entries(bot.portfolio).filter(([_, amount]) => (amount as number) > 0);
            if (sectorsWithStock.length > 0) {
              const sectorToSell = sectorsWithStock[0][0] as Sector;
              const amountToSell = sectorToSell === 'Reksa Dana' ? bot.reksaDana : bot.portfolio[sectorToSell as Exclude<Sector, 'Reksa Dana'>];
              sellStock(activePlayerId, sectorToSell, amountToSell);
              setTimeout(() => useGameStore.getState().nextTurn(), 500);
              return;
            }
          }
        }
        useGameStore.getState().nextTurn();
      }, difficulty === 'HARD' ? 800 : 1500);
      return () => clearTimeout(timer);
    }
  }, [mounted, phase, activePlayerId, pendingAction, marketCards, handleChoice, takeActionCard, players, activePlayerIndex, interaction, sellStock, activePlayer]);

  const calculateScore = (player: any) => {
    if (!player) return 0;
    let total = player.coins;
    Object.entries(player.portfolio).forEach(([sector, amount]) => {
      total += (amount as number) * (market[sector as keyof typeof market] || 0);
    });
    total += player.reksaDana * (market['Reksa Dana'] || 0);
    total -= (player.debt > 0 ? 13 : 0);
    return total;
  };

  const sortedWinners = [...players].sort((a, b) => calculateScore(b) - calculateScore(a));

  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-indigo-500 animate-pulse font-black uppercase tracking-widest text-xs">
          Loading Stocklab Engine...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-12 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-black tracking-tighter uppercase italic text-indigo-500">Stocklab</h1>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="bg-indigo-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full">Round {round}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={() => setShowRules(true)} className="p-1.5 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"><HelpCircle className="w-4 h-4" /></button>
             <button onClick={resetGame} className="p-1.5 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white"><RefreshCcw className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-2 md:p-6 space-y-4">
        {phase === 'END' ? (
          <div className="max-w-2xl mx-auto text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="inline-flex p-4 bg-yellow-500/10 rounded-full mb-4"><Trophy className="w-16 h-16 text-yellow-500" /></div>
            <h2 className="text-4xl font-black uppercase tracking-tight">Permainan Berakhir!</h2>
            <div className="space-y-4">
              {sortedWinners.map((p, i) => (
                <div key={p.id} className={`flex justify-between items-center p-6 rounded-2xl border ${i === 0 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center gap-4">
                    <span className={`text-2xl font-black ${i === 0 ? 'text-yellow-500' : 'text-white/20'}`}>#{i + 1}</span>
                    <div className="text-left"><div className="font-bold text-xl">{p.name}</div><div className="text-xs text-white/40 uppercase tracking-widest">Final Net Worth</div></div>
                  </div>
                  <div className="text-3xl font-black tabular-nums">{calculateScore(p)}</div>
                </div>
              ))}
            </div>
            <button onClick={resetGame} className="px-12 py-4 bg-white text-black rounded-full font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl">Play Again</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-4">
              <UserStats />
              <MarketBoard />
              <PlayerSection />
              <div className="pt-4"><ActionTable /></div>
            </div>
            
            <div className="lg:col-span-4 h-fit lg:sticky lg:top-24">
              <div className="space-y-6">
                <div className="h-[300px] md:h-[400px]"><GameLog /></div>
                
                {/* Bot Difficulty Info */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Brain size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Intelligence System</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-[8px] font-bold text-white/40 uppercase"><Zap size={10} /> Bot 1</div>
                      <span className="text-[9px] font-black text-emerald-500">EASY</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-[8px] font-bold text-white/40 uppercase"><Gauge size={10} /> Bot 2-3</div>
                      <span className="text-[9px] font-black text-amber-500">MEDIUM</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-[8px] font-bold text-white/40 uppercase"><Brain size={10} /> Bot 4</div>
                      <span className="text-[9px] font-black text-red-500">HARD</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3">
                  <Info className="w-5 h-5 text-indigo-400 shrink-0" />
                  <p className="text-[11px] text-white/40 leading-relaxed italic text-pretty">
                    Tip: Perhatikan Bot 4 (Hard), ia akan mencoba menjual saham di harga tertinggi dan menggunakan Akuisisi saat kamu lengah.
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
      <SellingModal />

      {/* Rules Modal */}
      {showRules && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 md:p-12 relative my-auto">
            <button onClick={() => setShowRules(false)} className="absolute top-8 right-8 p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-6 h-6 text-white/40 hover:text-white" /></button>
            <div className="space-y-8">
              <div className="space-y-2 text-center md:text-left"><h2 className="text-sm font-black uppercase tracking-[0.4em] text-indigo-500">Panduan Bermain</h2><p className="text-4xl font-black text-white tracking-tight">Aturan Stocklab</p></div>
              <div className="grid gap-4 md:gap-6">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 p-6 bg-white/5 rounded-3xl border border-white/5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl shrink-0">1</div>
                  <div className="space-y-1"><h4 className="font-bold text-lg">Lelang & Aksi</h4><p className="text-white/50 text-sm leading-relaxed">Bid koin untuk urutan jalan, lalu ambil kartu untuk Saham, Aksi, atau Uang.</p></div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 p-6 bg-white/5 rounded-3xl border border-white/5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl shrink-0">2</div>
                  <div className="space-y-1"><h4 className="font-bold text-lg">Split & Crash</h4><p className="text-white/50 text-sm leading-relaxed">Harga &gt; 12 memicu Split (Saham x2), Harga &lt; 2 memicu Crash (Saham hangus).</p></div>
                </div>
              </div>
              <button onClick={() => setShowRules(false)} className="w-full py-5 bg-white text-black rounded-2xl font-black text-lg uppercase tracking-widest transition-all hover:scale-[1.02] shadow-xl shadow-white/10">Saya Mengerti, Ayo Main!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
