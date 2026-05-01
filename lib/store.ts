import { create } from 'zustand';
import { GameState, Player, Sector, ActionCard, EconomyCard, Phase, ActionType } from './types';

const INITIAL_PRICE = 5;
const TOTAL_ROUNDS = 6;
const NUM_PLAYERS = 5;

const SECTORS: Exclude<Sector, 'Reksadana'>[] = ['Keuangan', 'Perkebunan', 'Pertambangan', 'Properti'];

const generateActionDeck = (): ActionCard[] => {
  const types: ActionType[] = [
    'INFO_BURSA', 'RUMOR_POSITIF', 'RUMOR_NEGATIF', 
    'DIVIDEN', 'PAJAK', 'SUSPEND', 'RIGHT_ISSUE'
  ];
  const deck: ActionCard[] = [];
  
  // ~60 cards total
  SECTORS.forEach(sector => {
    types.forEach(type => {
      const count = type === 'DIVIDEN' || type === 'PAJAK' ? 3 : 2;
      for (let i = 0; i < count; i++) {
        deck.push({
          id: `${type}-${sector}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          sector,
          title: `${sector} ${type.replace(/_/g, ' ')}`,
          description: getCardDescription(type, sector),
        });
      }
    });
  });
  return deck.sort(() => Math.random() - 0.5);
};

const getCardDescription = (type: ActionType, sector: string): string => {
  switch (type) {
    case 'INFO_BURSA': return 'Intip kartu ekonomi mendatang sektor ini.';
    case 'RUMOR_POSITIF': return `Naikkan harga ${sector} sebesar 2 poin.`;
    case 'RUMOR_NEGATIF': return `Turunkan harga ${sector} sebesar 2 poin.`;
    case 'DIVIDEN': return `Semua pemegang saham ${sector} dapat 1 koin/lembar.`;
    case 'PAJAK': return 'Semua pemain lain bayar 2 koin ke Bank.';
    case 'SUSPEND': return `Harga ${sector} tidak akan berubah di fase ekonomi ronde ini.`;
    case 'RIGHT_ISSUE': return 'Beli 1 saham ekstra dari Bank seharga harga pasar saat ini.';
    default: return '';
  }
};

const generateEconomyDeck = (): Record<Exclude<Sector, 'Reksadana'>, EconomyCard[]> => {
  const deck: Record<Exclude<Sector, 'Reksadana'>, EconomyCard[]> = {} as any;
  SECTORS.forEach(s => {
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
  handleChoice: (choice: 'SHARE' | 'ACTION' | 'SELL') => void;
  executeActionEffect: (playerId: number, card: ActionCard) => void;
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
    portfolio: { Keuangan: 0, Perkebunan: 0, Pertambangan: 0, Properti: 0 },
    reksadana: 0,
    debt: 0,
    isBankrupt: false,
  })),
  market: { Keuangan: INITIAL_PRICE, Perkebunan: INITIAL_PRICE, Pertambangan: INITIAL_PRICE, Properti: INITIAL_PRICE, Reksadana: INITIAL_PRICE },
  turnOrder: [],
  activePlayerIndex: 0,
  actionDeck: generateActionDeck(),
  economyDeck: generateEconomyDeck(),
  marketCards: [],
  currentBids: {},
  suspendedSectors: [],
  pendingAction: null,
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

    const deck = [...state.actionDeck];
    const numCards = NUM_PLAYERS * 2;
    const drawn = deck.splice(0, numCards);

    return {
      players: newPlayers,
      turnOrder: sortedOrder,
      activePlayerIndex: 0,
      phase: 'ACTION',
      currentBids: {},
      suspendedSectors: [],
      actionDeck: deck,
      marketCards: drawn,
      logs: [`Bidding selesai. Urutan jalan: ${sortedOrder.map(id => state.players.find(p => p.id === id)?.name).join(', ')}`, ...state.logs]
    };
  }),

  drawMarketCards: () => set((state) => {
    const deck = [...state.actionDeck];
    const numCards = NUM_PLAYERS * 2;
    const drawn = deck.splice(0, numCards);
    return { actionDeck: deck, marketCards: drawn };
  }),

  takeActionCard: (playerId, cardId) => set((state) => {
    const card = state.marketCards.find(c => c.id === cardId);
    if (!card || state.phase !== 'ACTION' || state.pendingAction) return state;

    const activePlayerId = state.turnOrder[state.activePlayerIndex];
    if (playerId !== activePlayerId) return state;

    const newMarketCards = state.marketCards.filter(c => c.id !== cardId);
    
    return { 
      marketCards: newMarketCards,
      pendingAction: { playerId, card }
    };
  }),

  handleChoice: (choice) => {
    const { pendingAction, executeActionEffect, players, market } = get();
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
        logs: [`${player.name} menyimpan ${card.title} sebagai saham.`, ...state.logs]
      }));
    } else if (choice === 'SELL') {
      const price = market[card.sector];
      set((state) => ({
        players: state.players.map(p => p.id === playerId ? {
          ...p,
          coins: p.coins + price
        } : p),
        pendingAction: null,
        logs: [`${player.name} menjual ${card.title} langsung seharga ${price} koin.`, ...state.logs]
      }));
    } else {
      executeActionEffect(playerId, card);
      set((state) => ({
        pendingAction: null,
      }));
    }

    // Advance turn to NEXT player in round-robin fashion for market cards
    set((state) => {
      let nextIndex = state.activePlayerIndex + 1;
      let nextPhase = state.phase;

      if (nextIndex >= NUM_PLAYERS) {
        nextIndex = 0;
      }

      // If market is empty, phase changes to SELLING
      if (state.marketCards.length === 0 && !state.pendingAction) {
        nextPhase = 'SELLING';
        nextIndex = 0;
        return { 
          activePlayerIndex: 0, 
          phase: 'SELLING', 
          logs: ['Semua kartu market telah diambil. Fase: PENJUALAN.', ...state.logs] 
        };
      }

      return { activePlayerIndex: nextIndex, phase: nextPhase };
    });
  },

  executeActionEffect: (playerId, card) => {
    const { players, market } = get();
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    set((state) => {
      const newMarket = { ...state.market };
      let newPlayers = [...state.players];
      const newSuspended = [...state.suspendedSectors];
      let logMsg = `${player.name} menggunakan aksi: ${card.title}`;

      switch (card.type) {
        case 'INFO_BURSA': {
          const nextRoundIndex = state.round - 1; 
          const econCard = state.economyDeck[card.sector][nextRoundIndex];
          logMsg += ` (Ekonomi ${card.sector} mendatang: ${econCard.value > 0 ? '+' : ''}${econCard.value})`;
          break;
        }
        case 'RUMOR_POSITIF':
          newMarket[card.sector] = Math.min(12, newMarket[card.sector] + 2);
          logMsg += ` (Harga ${card.sector} naik ke ${newMarket[card.sector]})`;
          break;
        case 'RUMOR_NEGATIF':
          newMarket[card.sector] = Math.max(1, newMarket[card.sector] - 2);
          logMsg += ` (Harga ${card.sector} turun ke ${newMarket[card.sector]})`;
          break;
        case 'DIVIDEN':
          newPlayers = newPlayers.map(p => ({
            ...p,
            coins: p.coins + (p.portfolio[card.sector] || 0)
          }));
          logMsg += ` (Dividen dibagikan untuk pemegang saham ${card.sector})`;
          break;
        case 'PAJAK':
          newPlayers = newPlayers.map(p => {
            if (p.id === playerId) return p;
            const tax = Math.min(p.coins, 2);
            return { ...p, coins: p.coins - tax };
          });
          // In real OJK, tax usually goes to bank, but let's follow the log or variations.
          // Standard OJK: Pajak goes to Bank.
          logMsg += ` (Semua pemain lain membayar pajak 2 koin ke Bank)`;
          break;
        case 'SUSPEND':
          if (!newSuspended.includes(card.sector)) {
            newSuspended.push(card.sector);
          }
          logMsg += ` (${card.sector} terkena SUSPEND! Harga tidak akan berubah di fase ekonomi ronde ini)`;
          break;
        case 'RIGHT_ISSUE': {
          const price = newMarket[card.sector];
          if (player.coins >= price) {
            newPlayers = newPlayers.map(p => p.id === playerId ? {
              ...p,
              coins: p.coins - price,
              portfolio: { ...p.portfolio, [card.sector]: p.portfolio[card.sector] + 1 }
            } : p);
            logMsg += ` (Membeli 1 saham ${card.sector} tambahan seharga ${price})`;
          } else {
            logMsg += ` (Gagal Right Issue: Koin tidak cukup)`;
          }
          break;
        }
      }

      return { market: newMarket, players: newPlayers, suspendedSectors: newSuspended, logs: [logMsg, ...state.logs] };
    });
  },

  sellStock: (playerId, sector, amount) => set((state) => {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return state;

    const price = state.market[sector];
    
    if (sector === 'Reksadana') {
      if (player.reksadana < amount) return state;
      const newPlayers = state.players.map(p => p.id === playerId ? {
        ...p,
        coins: p.coins + (amount * price),
        reksadana: p.reksadana - amount
      } : p);
      return { players: newPlayers, logs: [`${player.name} menjual ${amount} unit Reksadana seharga ${price}.`, ...state.logs] };
    } else {
      if (player.portfolio[sector as Exclude<Sector, 'Reksadana'>] < amount) return state;
      const newPlayers = state.players.map(p => p.id === playerId ? {
        ...p,
        coins: p.coins + (amount * price),
        portfolio: { ...p.portfolio, [sector as Exclude<Sector, 'Reksadana'>]: p.portfolio[sector as Exclude<Sector, 'Reksadana'>] - amount }
      } : p);
      return { players: newPlayers, logs: [`${player.name} menjual ${amount} saham ${sector} seharga ${price}.`, ...state.logs] };
    }
  }),

  resolveEconomy: () => set((state) => {
    const newMarket = { ...state.market };
    let newPlayers = [...state.players];
    const logMsgs: string[] = [];

    SECTORS.forEach(s => {
      if (state.suspendedSectors.includes(s)) {
        logMsgs.push(`${s} ditangguhkan (SUSPEND), harga tetap.`);
        return;
      }

      const card = state.economyDeck[s][state.round - 1];
      if (card) {
        newMarket[s] = Math.max(0, newMarket[s] + card.value);
        logMsgs.push(`Ekonomi ${s}: ${card.value > 0 ? '+' : ''}${card.value}`);
      }
    });

    // Update Reksadana (Avg of all 4)
    const totalSectors = newMarket.Keuangan + newMarket.Perkebunan + newMarket.Pertambangan + newMarket.Properti;
    newMarket.Reksadana = Math.floor(totalSectors / 4);

    // Apply Split/Crash
    SECTORS.forEach(s => {
      if (newMarket[s] > 12) {
        // Stock Split
        newMarket[s] = 6;
        newPlayers = newPlayers.map(p => ({
          ...p,
          portfolio: { ...p.portfolio, [s]: p.portfolio[s] * 2 }
        }));
        logMsgs.push(`STOCK SPLIT di ${s}! Jumlah saham pemain dikali dua.`);
      } else if (newMarket[s] < 2) {
        // Stock Crash
        newMarket[s] = 5;
        newPlayers = newPlayers.map(p => ({
          ...p,
          portfolio: { ...p.portfolio, [s]: 0 }
        }));
        logMsgs.push(`STOCK CRASH di ${s}! Semua investasi pemain di sektor ini hangus.`);
      }
    });

    const isLastRound = state.round === TOTAL_ROUNDS;
    
    return {
      market: newMarket,
      players: newPlayers,
      round: isLastRound ? state.round : state.round + 1,
      phase: isLastRound ? 'END' : 'BIDDING',
      suspendedSectors: [],
      logs: [...logMsgs.reverse(), `--- Ronde ${state.round} Berakhir ---`, ...state.logs]
    };
  }),

  takeDebt: (playerId) => set((state) => {
    const newPlayers = state.players.map(p => p.id === playerId ? {
      ...p,
      coins: p.coins + 10,
      debt: 10
    } : p);
    return { players: newPlayers, logs: [`${state.players.find(p => p.id === playerId)?.name} mengambil hutang 10 koin.`, ...state.logs] };
  }),

  resetGame: () => set({
    round: 1,
    phase: 'BIDDING',
    players: Array.from({ length: NUM_PLAYERS }, (_, i) => ({
      id: i,
      name: i === 0 ? 'You' : `Bot ${i}`,
      coins: 15,
      portfolio: { Keuangan: 0, Perkebunan: 0, Pertambangan: 0, Properti: 0 },
      reksadana: 0,
      debt: 0,
      isBankrupt: false,
    })),
    market: { Keuangan: INITIAL_PRICE, Perkebunan: INITIAL_PRICE, Pertambangan: INITIAL_PRICE, Properti: INITIAL_PRICE, Reksadana: INITIAL_PRICE },
    turnOrder: [],
    activePlayerIndex: 0,
    actionDeck: generateActionDeck(),
    economyDeck: generateEconomyDeck(),
    marketCards: [],
    currentBids: {},
    suspendedSectors: [],
    pendingAction: null,
    logs: ['Game dimuat ulang! Ronde 1: Fase Lelang (Bidding).'],
  }),
}));
