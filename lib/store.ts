import { create } from 'zustand';
import { GameState, Player, Sector, ActionCard, EconomyCard, Phase, ActionType } from './types';

const INITIAL_PRICE = 5;
const TOTAL_ROUNDS = 6;
const NUM_PLAYERS = 5;

const generateActionDeck = (): ActionCard[] => {
  const types: ActionType[] = ['INFO_BURSA', 'RUMOR', 'DIVIDEND', 'TRADING_FEE', 'MARKET_BOOM_CRASH'];
  const sectors: Sector[] = ['Agri', 'Mining', 'Consumer', 'Financial'];
  const deck: ActionCard[] = [];
  
  // 60 cards total, distributed across sectors and types
  sectors.forEach(sector => {
    types.forEach(type => {
      for (let i = 0; i < 3; i++) {
        deck.push({
          id: `${type}-${sector}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          sector,
          title: `${sector} ${type.replace(/_/g, ' ')}`,
          description: getCardDescription(type),
        });
      }
    });
  });
  return deck.sort(() => Math.random() - 0.5);
};

const getCardDescription = (type: ActionType): string => {
  switch (type) {
    case 'INFO_BURSA': return 'Lihat kartu ekonomi mendatang.';
    case 'RUMOR': return 'Naik/turunkan harga sektor sebesar 2 poin.';
    case 'DIVIDEND': return 'Semua pemegang saham sektor ini dapat 1 koin/lembar.';
    case 'TRADING_FEE': return 'Pemain lain bayar 2 koin ke kamu.';
    case 'MARKET_BOOM_CRASH': return 'Semua sektor +/- 3 poin.';
    default: return '';
  }
};

const generateEconomyDeck = (): Record<Sector, EconomyCard[]> => {
  const sectors: Sector[] = ['Agri', 'Mining', 'Consumer', 'Financial'];
  const deck: any = {};
  sectors.forEach(s => {
    // 6 cards per sector
    const values = [+2, +1, 0, -1, -2, +3].sort(() => Math.random() - 0.5);
    deck[s] = values.map(v => ({ sector: s, value: v }));
  });
  return deck;
};

interface GameActions {
  submitBid: (playerId: number, amount: number) => void;
  resolveBidding: () => void;
  drawMarketCards: () => void;
  takeActionCard: (playerId: number, cardId: string) => void;
  handleChoice: (choice: 'SHARE' | 'ACTION' | 'SELL', rumorChange?: number) => void;
  executeActionEffect: (playerId: number, card: ActionCard, rumorChange?: number) => void;
  sellStock: (playerId: number, sector: Sector, amount: number) => void;
  resolveEconomy: () => void;
  takeDebt: (playerId: number) => void;
  addLog: (message: string) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  round: 1,
  phase: 'BIDDING',
  players: Array.from({ length: NUM_PLAYERS }, (_, i) => ({
    id: i,
    name: i === 0 ? 'You' : `Bot ${i}`,
    coins: 15,
    portfolio: { Agri: 0, Mining: 0, Consumer: 0, Financial: 0, MutualFund: 0 },
    debt: 0,
    isBankrupt: false,
  })),
  market: { Agri: INITIAL_PRICE, Mining: INITIAL_PRICE, Consumer: INITIAL_PRICE, Financial: INITIAL_PRICE, MutualFund: INITIAL_PRICE },
  turnOrder: [],
  activePlayerIndex: 0,
  actionDeck: generateActionDeck(),
  economyDeck: generateEconomyDeck(),
  marketCards: [],
  currentBids: {},
  pendingAction: null,
  cardsTakenInTurn: 0,
  logs: ['Game started! Round 1: Bidding Phase.'],

  addLog: (message) => set((state) => ({ logs: [message, ...state.logs].slice(0, 50) })),

  submitBid: (playerId, amount) => set((state) => {
    const player = state.players.find(p => p.id === playerId);
    if (!player || player.coins < amount) return state;
    return { currentBids: { ...state.currentBids, [playerId]: amount } };
  }),

  resolveBidding: () => set((state) => {
    const bids = Object.entries(state.currentBids).map(([id, amount]) => ({ id: parseInt(id), amount }));
    if (bids.length < NUM_PLAYERS) return state;

    const newPlayers = state.players.map(p => ({
      ...p,
      coins: p.coins - (state.currentBids[p.id] || 0)
    }));

    const sortedOrder = bids
      .sort((a, b) => b.amount - a.amount || a.id - b.id)
      .map(b => b.id);

    return {
      players: newPlayers,
      turnOrder: sortedOrder,
      activePlayerIndex: 0,
      phase: 'ACTION',
      currentBids: {},
      cardsTakenInTurn: 0,
      logs: [`Bidding resolved. Turn order: ${sortedOrder.map(id => `P${id+1}`).join(', ')}`, ...state.logs]
    };
  }),

  drawMarketCards: () => set((state) => {
    const deck = [...state.actionDeck];
    const drawn = deck.splice(0, 10);
    return { actionDeck: deck, marketCards: drawn };
  }),

  takeActionCard: (playerId, cardId) => set((state) => {
    const card = state.marketCards.find(c => c.id === cardId);
    if (!card || state.phase !== 'ACTION' || state.pendingAction) return state;

    const activePlayerId = state.turnOrder[state.activePlayerIndex];
    if (playerId !== activePlayerId) return state;

    const newMarketCards = state.marketCards.filter(c => c.id !== cardId);
    
    // If it's a bot, we'll handle its choice in a separate effect or timeout
    // but for now let's just set pendingAction.
    return { 
      marketCards: newMarketCards,
      pendingAction: { playerId, card }
    };
  }),

  handleChoice: (choice, rumorChange) => {
    const { pendingAction, executeActionEffect, players, market, addLog } = get();
    if (!pendingAction) return;

    const { playerId, card } = pendingAction;
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    if (choice === 'SHARE') {
      set((state) => ({
        players: state.players.map(p => p.id === playerId ? {
          ...p,
          portfolio: { ...p.portfolio, [card.sector]: p.portfolio[card.sector] + 1 }
        } : p),
        pendingAction: null,
        cardsTakenInTurn: state.cardsTakenInTurn + 1,
        logs: [`${player.name} converted ${card.title} to a share.`, ...state.logs]
      }));
    } else if (choice === 'SELL') {
      const price = market[card.sector];
      set((state) => ({
        players: state.players.map(p => p.id === playerId ? {
          ...p,
          coins: p.coins + price
        } : p),
        pendingAction: null,
        cardsTakenInTurn: state.cardsTakenInTurn + 1,
        logs: [`${player.name} sold ${card.title} for ${price} coins.`, ...state.logs]
      }));
    } else {
      executeActionEffect(playerId, card, rumorChange);
      set((state) => ({
        pendingAction: null,
        cardsTakenInTurn: state.cardsTakenInTurn + 1,
      }));
    }

    // Advance turn if needed
    set((state) => {
      let nextIndex = state.activePlayerIndex;
      let nextPhase = state.phase;
      let finalCardsTaken = state.cardsTakenInTurn;

      if (finalCardsTaken >= 2) {
        nextIndex = state.activePlayerIndex + 1;
        finalCardsTaken = 0;
        if (nextIndex >= NUM_PLAYERS) {
          nextPhase = 'SELLING';
          nextIndex = 0;
          return { activePlayerIndex: nextIndex, phase: nextPhase, cardsTakenInTurn: 0, logs: ['All players finished actions. Phase: SELLING.', ...state.logs] };
        }
      }
      return { activePlayerIndex: nextIndex, phase: nextPhase, cardsTakenInTurn: finalCardsTaken };
    });
  },

  executeActionEffect: (playerId, card, rumorChange) => {
    const { players, market, addLog } = get();
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    set((state) => {
      let newMarket = { ...state.market };
      let newPlayers = [...state.players];
      let logMsg = `${player.name} played action: ${card.title}`;

      switch (card.type) {
        case 'INFO_BURSA':
          const nextRound = state.round; // round is 1-based, so current index is round-1, next is round
          const nextEconomy = Object.entries(state.economyDeck).map(([sector, cards]) => {
            const nextCard = cards[nextRound];
            return nextCard ? `${sector}: ${nextCard.value > 0 ? '+' : ''}${nextCard.value}` : null;
          }).filter(Boolean).join(', ');
          
          logMsg += ` (Upcoming Economy: ${nextEconomy})`;
          break;
        case 'RUMOR':
          const change = rumorChange || 2;
          newMarket[card.sector] = Math.max(0, newMarket[card.sector] + change);
          logMsg += ` (${card.sector} price ${change > 0 ? '+' : ''}${change})`;
          break;
        case 'DIVIDEND':
          newPlayers = newPlayers.map(p => ({
            ...p,
            coins: p.coins + (p.portfolio[card.sector] || 0)
          }));
          logMsg += ` (Dividend paid for ${card.sector})`;
          break;
        case 'TRADING_FEE':
          let totalFeesCollected = 0;
          newPlayers = newPlayers.map(p => {
            if (p.id === playerId) return p;
            const fee = Math.min(p.coins, 2);
            totalFeesCollected += fee;
            return { ...p, coins: p.coins - fee };
          });
          newPlayers = newPlayers.map(p => p.id === playerId ? { ...p, coins: p.coins + totalFeesCollected } : p);
          logMsg += ` (Collected ${totalFeesCollected} coins in trading fees from others)`;
          break;
        case 'MARKET_BOOM_CRASH':
          const marketChange = rumorChange || 3;
          (Object.keys(newMarket) as Sector[]).forEach(s => {
            newMarket[s] = Math.max(0, newMarket[s] + marketChange);
          });
          logMsg += ` (Market wide ${marketChange > 0 ? 'Boom' : 'Crash'} ${marketChange > 0 ? '+' : ''}${marketChange})`;
          break;
      }

      return { market: newMarket, players: newPlayers, logs: [logMsg, ...state.logs] };
    });
  },

  sellStock: (playerId, sector, amount) => set((state) => {
    const player = state.players.find(p => p.id === playerId);
    if (!player || player.portfolio[sector] < amount) return state;

    const price = state.market[sector];
    const newPlayers = state.players.map(p => p.id === playerId ? {
      ...p,
      coins: p.coins + (amount * price),
      portfolio: { ...p.portfolio, [sector]: p.portfolio[sector] - amount }
    } : p);

    return { players: newPlayers, logs: [`${player.name} sold ${amount} shares of ${sector}. Cash added to bidding power.`, ...state.logs] };
  }),

  resolveEconomy: () => set((state) => {
    const newMarket = { ...state.market };
    const sectors: (keyof typeof state.economyDeck)[] = ['Agri', 'Mining', 'Consumer', 'Financial'];
    
    sectors.forEach(s => {
      const card = state.economyDeck[s][state.round - 1];
      if (card) {
        newMarket[s] = Math.max(1, newMarket[s] + card.value);
      }
    });

    // Update Mutual Fund (Avg of all 4 sectors)
    const totalSectors = newMarket.Agri + newMarket.Mining + newMarket.Consumer + newMarket.Financial;
    newMarket.MutualFund = Math.floor(totalSectors / 4);

    // Apply Split/Crash
    let players = [...state.players];
    sectors.forEach(s => {
      if (newMarket[s] > 12) {
        // Split
        newMarket[s] = 6;
        players = players.map(p => ({
          ...p,
          portfolio: { ...p.portfolio, [s]: p.portfolio[s] * 2 }
        }));
      } else if (newMarket[s] < 2) {
        // Crash
        newMarket[s] = 5;
        players = players.map(p => ({
          ...p,
          portfolio: { ...p.portfolio, [s]: 0 }
        }));
      }
    });

    const isLastRound = state.round === TOTAL_ROUNDS;
    
    return {
      market: newMarket,
      players: players,
      round: isLastRound ? state.round : state.round + 1,
      phase: isLastRound ? 'END' : 'BIDDING',
      logs: [`Economy Phase Round ${state.round} resolved.`, ...state.logs]
    };
  }),

  takeDebt: (playerId) => set((state) => {
    const newPlayers = state.players.map(p => p.id === playerId ? {
      ...p,
      coins: p.coins + 10,
      debt: 10
    } : p);
    return { players: newPlayers };
  }),

  resetGame: () => set({
    round: 1,
    phase: 'BIDDING',
    players: Array.from({ length: NUM_PLAYERS }, (_, i) => ({
      id: i,
      name: i === 0 ? 'You' : `Bot ${i}`,
      coins: 15,
      portfolio: { Agri: 0, Mining: 0, Consumer: 0, Financial: 0, MutualFund: 0 },
      debt: 0,
      isBankrupt: false,
    })),
    market: { Agri: INITIAL_PRICE, Mining: INITIAL_PRICE, Consumer: INITIAL_PRICE, Financial: INITIAL_PRICE, MutualFund: INITIAL_PRICE },
    turnOrder: [],
    activePlayerIndex: 0,
    actionDeck: generateActionDeck(),
    economyDeck: generateEconomyDeck(),
    marketCards: [],
    currentBids: {},
    pendingAction: null,
    cardsTakenInTurn: 0,
    logs: ['Game reset! Round 1: Bidding Phase.'],
  }),
}));
