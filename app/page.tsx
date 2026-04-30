"use client";

import React, { useReducer, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  User, 
  Cpu, 
  RefreshCw, 
  ShoppingBag, 
  DollarSign,
  AlertTriangle,
  Info
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Constants & Types ---
const MAX_ROUNDS = 15;
const SECTORS = ["Banking", "Property", "Mining", "Agriculture"] as const;
type Sector = (typeof SECTORS)[number];

type CardType = "PRICE_CHANGE" | "CRASH" | "DIVIDEND";

interface ActionCard {
  id: string;
  sector: Sector | "All";
  type: CardType;
  value: number;
  label: string;
}

interface Portfolio {
  Banking: number;
  Property: number;
  Mining: number;
  Agriculture: number;
}

interface EntityState {
  id: string;
  name: string;
  isBot: boolean;
  cash: number;
  bidCoins: number;
  portfolio: Portfolio;
}

type Phase = "REVEAL" | "BIDDING" | "EXECUTION" | "TRADING" | "ROUND_END" | "GAME_OVER";

interface GameState {
  round: number;
  phase: Phase;
  market: Record<Sector, number>;
  players: EntityState[];
  currentCard: ActionCard | null;
  bids: Record<string, number>;
  winnerId: string | null;
  history: string[];
}

type Action =
  | { type: "START_GAME" }
  | { type: "REVEAL_CARD"; card: ActionCard }
  | { type: "PLACE_BIDS"; bids: Record<string, number> }
  | { type: "EXECUTE_EFFECT" }
  | { type: "TRADE"; entityId: string; sector: Sector; amount: number; isBuy: boolean }
  | { type: "NEXT_PHASE" }
  | { type: "NEXT_ROUND" };

// --- Initial State ---
const initialPortfolio: Portfolio = {
  Banking: 0,
  Property: 0,
  Mining: 0,
  Agriculture: 0,
};

const createInitialPlayers = (): EntityState[] => {
  const players: EntityState[] = [
    { id: 'player-1', isBot: false, name: 'You', cash: 500, bidCoins: 10, portfolio: { ...initialPortfolio } },
  ];
  for (let i = 1; i <= 4; i++) {
    players.push({ id: `bot-${i}`, isBot: true, name: `Bot ${i}`, cash: 500, bidCoins: 10, portfolio: { ...initialPortfolio } });
  }
  return players;
};

const initialState: GameState = {
  round: 1,
  phase: "REVEAL",
  market: {
    Banking: 100,
    Property: 100,
    Mining: 100,
    Agriculture: 100,
  },
  players: createInitialPlayers(),
  currentCard: null,
  bids: {},
  winnerId: null,
  history: ["Welcome to Stocklab!"],
};

// --- Game Logic Helpers ---
const generateCard = (): ActionCard => {
  const sector = SECTORS[Math.floor(Math.random() * SECTORS.length)];
  const rand = Math.random();
  
  if (rand < 0.6) {
    const vals = [10, 20, 30, -10, -20];
    const val = vals[Math.floor(Math.random() * vals.length)];
    return {
      id: Math.random().toString(36).substr(2, 9),
      sector,
      type: "PRICE_CHANGE",
      value: val,
      label: `${sector} ${val > 0 ? "+" : ""}${val}`,
    };
  } else if (rand < 0.8) {
    return {
      id: Math.random().toString(36).substr(2, 9),
      sector,
      type: "CRASH",
      value: -50,
      label: `${sector} CRASH -50%`,
    };
  } else {
    return {
      id: Math.random().toString(36).substr(2, 9),
      sector,
      type: "DIVIDEND",
      value: 20,
      label: `${sector} Dividend $20/share`,
    };
  }
};

// --- Reducer ---
function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "REVEAL_CARD":
      return {
        ...state,
        currentCard: action.card,
        phase: "BIDDING",
        history: [`Round ${state.round}: Card revealed - ${action.card.label}`, ...state.history],
      };

    case "PLACE_BIDS": {
      if (action.type !== "PLACE_BIDS") return state; // Type guard

      const { bids } = action;
      
      let highestBid = -1;
      let winnerId: string | null = null;
      let isTie = false;
      
      Object.entries(bids).forEach(([id, bid]) => {
        if (bid > highestBid) {
          highestBid = bid;
          winnerId = id;
          isTie = false;
        } else if (bid === highestBid) {
          isTie = true;
        }
      });

      if (isTie) winnerId = null; // No winner in case of a tie

      const newPlayers = state.players.map(p => {
        const playerBid = bids[p.id];
        return {
          ...p,
          bidCoins: p.bidCoins - (playerBid || 0),
        };
      });

      const winnerName = winnerId ? state.players.find(p => p.id === winnerId)?.name : null;

      return {
        ...state,
        bids,
        winnerId,
        players: newPlayers,
        phase: "EXECUTION",
        history: [`Bidding finished. ${winnerName ? `${winnerName} wins the card!` : 'Tie! No one wins.'}`, ...state.history],
      };
    }

    case "EXECUTE_EFFECT": {
      if (!state.currentCard || !state.winnerId) {
        return { ...state, phase: "TRADING", history: ["No winner, skipping effect.", ...state.history] };
      }

      const { sector, type, value } = state.currentCard;
      let newMarket = { ...state.market };
      let newPlayers = [...state.players];
      const winnerIndex = newPlayers.findIndex(p => p.id === state.winnerId);
      const winnerName = winnerIndex !== -1 ? newPlayers[winnerIndex].name : 'Nobody';

      let historyMessage = `Effect from "${state.currentCard.label}" applied.`;

      if (type === "PRICE_CHANGE") {
        newMarket[sector as Sector] = Math.max(10, newMarket[sector as Sector] + value);
        historyMessage = `${winnerName} won. ${sector} price changed by ${value}.`;
      } else if (type === "CRASH") {
        newMarket[sector as Sector] = Math.floor(newMarket[sector as Sector] * 0.5);
        historyMessage = `${winnerName} won. ${sector} price CRASHED.`;
      } else if (type === "DIVIDEND" && winnerIndex !== -1) {
        const winner = newPlayers[winnerIndex];
        const shares = winner.portfolio[sector as Sector];
        const totalDividend = shares * value;
        newPlayers[winnerIndex] = {
          ...winner,
          cash: winner.cash + totalDividend
        };
        historyMessage = `${winnerName} received $${totalDividend} in dividends for ${sector}.`;
      }

      return {
        ...state,
        market: newMarket,
        players: newPlayers,
        phase: "TRADING",
        history: [historyMessage, ...state.history],
      };
    }

    case "TRADE": {
      if (action.type !== "TRADE") return state;
      const { entityId, sector, amount, isBuy } = action;
      const playerIndex = state.players.findIndex(p => p.id === entityId);
      if (playerIndex === -1) return state;
      
      const target = state.players[playerIndex];
      const price = state.market[sector];
      const totalCost = price * amount;

      const newPlayers = [...state.players];

      if (isBuy) {
        if (target.cash < totalCost) return state;
        newPlayers[playerIndex] = {
          ...target,
          cash: target.cash - totalCost,
          portfolio: {
            ...target.portfolio,
            [sector]: target.portfolio[sector] + amount,
          },
        };
        return {
          ...state,
          players: newPlayers,
          history: [`${target.name} bought ${amount} shares of ${sector}`, ...state.history],
        };
      } else {
        if (target.portfolio[sector] < amount) return state;
        newPlayers[playerIndex] = {
          ...target,
          cash: target.cash + totalCost,
          portfolio: {
            ...target.portfolio,
            [sector]: target.portfolio[sector] - amount,
          },
        };
        return {
          ...state,
          players: newPlayers,
          history: [`${target.name} sold ${amount} shares of ${sector}`, ...state.history],
        };
      }
    }

    case "NEXT_PHASE":
        if (state.phase === "TRADING") return { ...state, phase: "ROUND_END" };
        return state;

    case "NEXT_ROUND":
      if (state.round >= MAX_ROUNDS) {
        return { ...state, phase: "GAME_OVER" };
      }
      return {
        ...state,
        round: state.round + 1,
        phase: "REVEAL",
        currentCard: null,
        bids: {},
        winnerId: null,
      };

    case "START_GAME":
        return initialState;

    default:
      return state;
  }
}

// --- Components ---

export default function StocklabGame() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [playerBid, setPlayerBid] = useState(0);
  const [tradeAmount, setTradeAmount] = useState(1);

  // Bot AI Logic
  useEffect(() => {
    const bots = state.players.filter(p => p.isBot);

    if (state.phase === "BIDDING") {
      const timer = setTimeout(() => {
        // Automatically wait for player interaction
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (state.phase === "TRADING") {
        const timer = setTimeout(() => {
            bots.forEach(bot => {
                SECTORS.forEach(sector => {
                    const price = state.market[sector];
                    const shares = bot.portfolio[sector];
                    if (price < 80 && bot.cash > price * 5) {
                        dispatch({ type: "TRADE", entityId: bot.id, sector, amount: 2, isBuy: true });
                    }
                    if (price > 150 && shares > 0) {
                        dispatch({ type: "TRADE", entityId: bot.id, sector, amount: shares, isBuy: false });
                    }
                });
            });
            setTimeout(() => dispatch({ type: "NEXT_PHASE" }), 1000);
        }, 1500);
        return () => clearTimeout(timer);
    }
  }, [state.phase, state.market, state.players, state.currentCard]);

  const handleBid = () => {
    const bids: Record<string, number> = { 'player-1': playerBid };
    
    state.players.filter(p => p.isBot).forEach(bot => {
        let botBid = 0;
        if (state.currentCard) {
            const sector = state.currentCard.sector as Sector;
            const sharesOwned = bot.portfolio[sector];
            if (sharesOwned > 5) botBid = Math.min(bot.bidCoins, 3);
            else if (sharesOwned > 0) botBid = Math.min(bot.bidCoins, 2);
            else botBid = Math.random() > 0.6 ? 1 : 0;
        }
        bids[bot.id] = botBid;
    });

    dispatch({ type: "PLACE_BIDS", bids });
    setPlayerBid(0);
  };

  const calculateTotalWealth = (entity: EntityState) => {
    if (!entity) return 0;
    const portfolioValue = SECTORS.reduce((acc, sector) => acc + entity.portfolio[sector] * state.market[sector], 0);
    return entity.cash + portfolioValue;
  };

  const userPlayer = state.players.find(p => p.id === 'player-1') || state.players[0];
  const playerWealth = calculateTotalWealth(userPlayer);
  const botsWealth = state.players.filter(p => p.isBot).map(bot => calculateTotalWealth(bot));
  const maxBotWealth = Math.max(...botsWealth, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 pb-24 md:pb-4 flex flex-col gap-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">STOCKLAB</h1>
          <p className="text-xs text-slate-400">Round {state.round} / {MAX_ROUNDS}</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[10px] uppercase text-slate-500 font-bold">Your Wealth</p>
            <p className="text-lg font-mono text-emerald-400">${playerWealth}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase text-slate-500 font-bold">Bot Wealth</p>
            <p className="text-lg font-mono text-red-400">${maxBotWealth}</p>
          </div>
        </div>
      </div>

      {/* Market Dashboard */}
      <div className="grid grid-cols-2 gap-3">
        {SECTORS.map((sector) => (
          <motion.div 
            key={sector}
            layout
            className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex flex-col gap-1"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-400">{sector}</span>
              <TrendingUp size={14} className={cn(state.market[sector] > 100 ? "text-emerald-500" : "text-slate-600")} />
            </div>
            <div className="flex items-baseline gap-2">
              <motion.span 
                key={state.market[sector]}
                initial={{ scale: 1.2, color: "#10b981" }}
                animate={{ scale: 1, color: "#f8fafc" }}
                className="text-2xl font-mono font-bold"
              >
                ${state.market[sector]}
              </motion.span>
              <span className="text-[10px] text-slate-500">
                {userPlayer.portfolio[sector]} shares
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Card Area */}
      <div className="flex-1 flex flex-col justify-center items-center py-6 relative">
        <AnimatePresence mode="wait">
          {state.phase === "REVEAL" && (
            <motion.button
              key="reveal-btn"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => dispatch({ type: "REVEAL_CARD", card: generateCard() })}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-blue-900/40 flex items-center gap-2 group"
            >
              <RefreshCw className="group-hover:rotate-180 transition-transform duration-500" />
              REVEAL ACTION CARD
            </motion.button>
          )}

          {state.currentCard && state.phase !== "REVEAL" && (
            <motion.div
              key={state.currentCard.id}
              initial={{ rotateY: 180, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              className={cn(
                "w-64 h-80 rounded-2xl border-4 flex flex-col items-center justify-center gap-4 shadow-2xl p-6 text-center",
                state.currentCard.type === "PRICE_CHANGE" ? "bg-slate-800 border-blue-500" :
                state.currentCard.type === "CRASH" ? "bg-red-950 border-red-600" :
                "bg-emerald-950 border-emerald-500"
              )}
            >
              <div className="p-4 bg-white/10 rounded-full">
                {state.currentCard.type === "PRICE_CHANGE" && <TrendingUp size={48} className="text-blue-400" />}
                {state.currentCard.type === "CRASH" && <AlertTriangle size={48} className="text-red-500" />}
                {state.currentCard.type === "DIVIDEND" && <DollarSign size={48} className="text-emerald-400" />}
              </div>
              <h2 className="text-xl font-black uppercase tracking-tighter italic">
                {state.currentCard.type}
              </h2>
              <p className="text-2xl font-bold">{state.currentCard.label}</p>
              <div className="mt-4 text-[10px] text-white/50 uppercase font-bold tracking-widest">
                Sector: {state.currentCard.sector}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls / Interaction Area */}
      <div className="bg-slate-900/80 backdrop-blur-md p-4 rounded-t-3xl border-t border-slate-800 fixed bottom-0 left-0 right-0 max-w-2xl mx-auto shadow-2xl">
        <AnimatePresence mode="wait">
          {state.phase === "BIDDING" && (
            <motion.div 
              key="bidding-ctrl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              <div className="flex justify-between items-center px-2">
                <span className="text-sm font-bold flex items-center gap-2">
                  <Coins className="text-yellow-500" size={18} />
                    Bid Coins: {userPlayer.bidCoins}
                </span>
                <span className="text-xl font-mono font-bold text-yellow-500">{playerBid}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                  max={userPlayer.bidCoins} 
                value={playerBid}
                onChange={(e) => setPlayerBid(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <button 
                onClick={handleBid}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-3 rounded-xl transition-colors shadow-lg"
              >
                CONFIRM BID
              </button>
            </motion.div>
          )}

          {state.phase === "EXECUTION" && (
            <motion.div 
                key="exec-ctrl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-3 py-4"
            >
                <p className="text-lg font-bold">
                      {state.winnerId === 'player-1' ? 'YOU WON!' : 
                       state.winnerId ? `${state.players.find(p => p.id === state.winnerId)?.name} WON!` : 'TIE!'}
                </p>
                <button 
                    onClick={() => dispatch({ type: "EXECUTE_EFFECT" })}
                    className="bg-emerald-600 px-8 py-2 rounded-lg font-bold"
                >
                    CONTINUE
                </button>
            </motion.div>
          )}

          {state.phase === "TRADING" && (
            <motion.div 
              key="trading-ctrl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {SECTORS.map(sector => (
                    <div key={sector} className="flex flex-col gap-2 min-w-[140px]">
                        <p className="text-[10px] font-bold text-slate-500 uppercase px-2">{sector}</p>
                        <div className="flex gap-1">
                            <button 
                                  onClick={() => dispatch({ type: "TRADE", entityId: "player-1", sector, amount: 1, isBuy: true })}
                                  disabled={userPlayer.cash < state.market[sector]}
                                className="flex-1 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-600/50 text-emerald-400 hover:text-white text-xs py-2 rounded-lg transition-all disabled:opacity-30"
                            >
                                BUY
                            </button>
                            <button 
                                  onClick={() => dispatch({ type: "TRADE", entityId: "player-1", sector, amount: 1, isBuy: false })}
                                  disabled={userPlayer.portfolio[sector] <= 0}
                                className="flex-1 bg-red-600/20 hover:bg-red-600 border border-red-600/50 text-red-400 hover:text-white text-xs py-2 rounded-lg transition-all disabled:opacity-30"
                            >
                                SELL
                            </button>
                        </div>
                    </div>
                ))}
              </div>
              <div className="flex justify-between items-center px-2">
                <span className="text-sm font-bold flex items-center gap-2">
                  <DollarSign className="text-emerald-500" size={18} />
                    Cash: ${userPlayer.cash}
                </span>
                  <span className="text-[10px] text-slate-500 italic">Bots are thinking...</span>
              </div>
            </motion.div>
          )}

          {state.phase === "ROUND_END" && (
            <motion.div 
                key="end-round-ctrl"
                className="py-4"
            >
                <button 
                    onClick={() => dispatch({ type: "NEXT_ROUND" })}
                    className="w-full bg-white text-slate-950 font-black py-3 rounded-xl shadow-lg"
                >
                    NEXT ROUND
                </button>
            </motion.div>
          )}

          {state.phase === "GAME_OVER" && (
            <motion.div 
                key="game-over"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-4 py-6"
            >
                <h2 className="text-3xl font-black">GAME OVER</h2>
                <div className="text-center">
                      <p className={cn("text-2xl font-bold", playerWealth > maxBotWealth ? "text-emerald-400" : "text-red-400")}>
                          {playerWealth > maxBotWealth ? "YOU WON!" : "BOTS WON!"}
                    </p>
                      <p className="text-slate-400 italic">Final Wealth: You ${playerWealth} vs Best Bot ${maxBotWealth}</p>
                </div>
                <button 
                    onClick={() => dispatch({ type: "START_GAME" })}
                    className="bg-blue-600 px-8 py-3 rounded-xl font-bold"
                >
                    PLAY AGAIN
                </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History Log (Desktop/Large Mobile) */}
      <div className="hidden md:block fixed right-4 top-24 bottom-24 w-64 bg-slate-900/50 border border-slate-800 rounded-2xl p-4 overflow-y-auto">
        <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
            <Info size={14} /> History Log
        </h3>
        <div className="flex flex-col gap-2">
            {state.history.slice(0, 10).map((log, i) => (
                <p key={i} className="text-[11px] text-slate-400 border-l border-slate-700 pl-2 py-1">{log}</p>
            ))}
        </div>
      </div>
    </div>
  );
}
