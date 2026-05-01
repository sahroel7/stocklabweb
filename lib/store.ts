import { create } from 'zustand';
import { GameState, Player, Sector, ActionCard, EconomyCard, Phase, ActionType, GlobalEvent } from './types';
import { generateEconomyDeck, applyEconomyPhase, INITIAL_PRICE } from './economyLogic';

const TOTAL_ROUNDS = 6;
const NUM_PLAYERS = 5;

const SECTORS: Exclude<Sector, 'Reksadana'>[] = ['Keuangan', 'Perkebunan', 'Pertambangan', 'Properti'];

const generateActionDeck = (): ActionCard[] => {
  const types: ActionType[] = [
    'INFO_BURSA', 'RUMOR_POSITIF', 'RUMOR_NEGATIF', 
    'DIVIDEN', 'PAJAK', 'SUSPEND', 'RIGHT_ISSUE',
    'QUICKBOY', 'AKUISISI', 'TRADING_FEE', 'STOCK_SPLIT'
  ];
  const deck: ActionCard[] = [];
  
  SECTORS.forEach(sector => {
    types.forEach(type => {
      let count = 2;
      if (type === 'DIVIDEN' || type === 'PAJAK' || type === 'QUICKBOY' || type === 'RUMOR_POSITIF' || type === 'RUMOR_NEGATIF') count = 3;
      
      for (let i = 0; i < count; i++) {
        deck.push({
          id: `${type}-${sector}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          sector,
          title: getCardTitle(type, sector),
          description: getCardDescription(type, sector),
          color: getCardColor(type),
        });
      }
    });
  });
  return deck.sort(() => Math.random() - 0.5);
};

const getCardTitle = (type: ActionType, sector: string): string => {
  switch (type) {
    case 'QUICKBOY': return 'Quickboy';
    case 'AKUISISI': return 'Akuisisi';
    case 'TRADING_FEE': return 'Trading Fee';
    case 'STOCK_SPLIT': return 'Stock Split';
    default: return `${sector} ${type.replace(/_/g, ' ')}`;
  }
};

const getCardColor = (type: ActionType): string => {
  switch (type) {
    case 'DIVIDEN':
    case 'RIGHT_ISSUE':
    case 'STOCK_SPLIT': return 'bg-emerald-600';
    case 'PAJAK':
    case 'TRADING_FEE': return 'bg-red-600';
    case 'QUICKBOY':
    case 'AKUISISI': return 'bg-indigo-600';
    case 'INFO_BURSA': return 'bg-amber-500';
    case 'SUSPEND': return 'bg-zinc-700';
    default: return 'bg-blue-600';
  }
};

const getCardDescription = (type: ActionType, sector: string): string => {
  switch (type) {
    case 'INFO_BURSA': return `Intip kartu ekonomi ${sector} mendatang.`;
    case 'RUMOR_POSITIF': return `Naikkan harga ${sector} sebesar 2 poin.`;
    case 'RUMOR_NEGATIF': return `Turunkan harga ${sector} sebesar 2 poin.`;
    case 'DIVIDEN': return `Setiap pemain dapat 1 koin per saham ${sector}.`;
    case 'PAJAK': return 'Semua pemain lain bayar 2 koin ke Bank.';
    case 'SUSPEND': return `Hentikan perdagangan ${sector} (harga & transaksi kunci).`;
    case 'RIGHT_ISSUE': return 'Beli 1 saham ekstra dari emiten seharga harga pasar.';
    case 'QUICKBOY': return 'Ambil dan simpan 2 kartu bursa sekaligus.';
    case 'AKUISISI': return `Ambil 1 saham ${sector} dari pemain lain jika sahammu >= sahamnya.`;
    case 'TRADING_FEE': return `Pemain lain bayar 1 koin kepadamu saat jual saham ${sector}.`;
    case 'STOCK_SPLIT': return `Lakukan Stock Split pada ${sector} sekarang juga.`;
    default: return '';
  }
};

const generateEventDeck = (): GlobalEvent[] => {
  const events: GlobalEvent[] = [
    { type: 'KRISIS_GLOBAL', title: 'Krisis Global', description: 'Krisis melanda! Semua harga sektor turun 1 poin.' },
    { type: 'EKONOMI_BOOM', title: 'Ekonomi Boom', description: 'Ekonomi menguat! Semua harga sektor naik 1 poin.' },
    { type: 'SUKU_BUNGA', title: 'Suku Bunga Naik', description: 'Inflasi terkendali. Harga semua sektor tetap (Stabil).' },
    { type: 'STABIL', title: 'Pasar Stabil', description: 'Tidak ada peristiwa global khusus ronde ini.' },
    { type: 'KRISIS_GLOBAL', title: 'Krisis Global', description: 'Krisis melanda! Semua harga sektor turun 1 poin.' },
    { type: 'EKONOMI_BOOM', title: 'Ekonomi Boom', description: 'Ekonomi menguat! Semua harga sektor naik 1 poin.' },
  ];
  return events.sort(() => Math.random() - 0.5);
};

interface GameActions {
  submitBid: (playerId: number, amount: number) => void;
  resolveBidding: () => void;
  drawMarketCards: () => void;
  takeActionCard: (playerId: number, cardId: string) => void;
  handleChoice: (choice: 'SHARE' | 'ACTION' | 'SELL') => void;
  executeActionEffect: (playerId: number, card: ActionCard) => void;
  sellStock: (playerId: number, sector: Sector, amount: number) => void;
  nextTurn: () => void;
  resolveEconomy: () => void;
  finishEconomyPhase: () => void;
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
  eventDeck: generateEventDeck(),
  currentEconomyCards: null,
  marketCards: [],
  currentBids: {},
  suspendedSectors: [],
  pendingAction: null,
  extraTurns: 0,
  tradingFeeOwners: { Keuangan: null, Perkebunan: null, Pertambangan: null, Properti: null },
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
// --- TURN MANAGEMENT ---
set((state) => {
  // 1. If market is empty, phase changes to SELLING immediately
  if (state.marketCards.length === 0 && !state.pendingAction) {
    return { 
      activePlayerIndex: 0, 
      phase: 'SELLING', 
      extraTurns: 0, // Clear any remaining extra turns
      logs: ['Semua kartu market telah diambil. Fase: PENJUALAN.', ...state.logs] 
    };
  }

  // 2. If player has extra turns (Quickboy), stay on same player
  if (state.extraTurns > 0) {
    return { extraTurns: state.extraTurns - 1 };
  }

  // 3. Normal turn rotation
  let nextIndex = state.activePlayerIndex + 1;
  if (nextIndex >= NUM_PLAYERS) {
    nextIndex = 0;
  }

  return { activePlayerIndex: nextIndex };
});
},


  executeActionEffect: (playerId, card) => {
    const { players } = get();
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    set((state) => {
      const newMarket = { ...state.market };
      let newPlayers = [...state.players];
      const newSuspended = [...state.suspendedSectors];
      const newFees = { ...state.tradingFeeOwners };
      let newExtraTurns = state.extraTurns;
      let logMsg = `${player.name} menggunakan aksi: ${card.title}`;

      switch (card.type) {
        case 'QUICKBOY':
          newExtraTurns += 2; // Allows taking 2 more cards sequentially
          logMsg += ` (Dapat mengambil 2 kartu tambahan sekarang)`;
          break;

        case 'STOCK_SPLIT':
          newPlayers = newPlayers.map(p => ({
            ...p,
            portfolio: { ...p.portfolio, [card.sector]: (p.portfolio[card.sector] || 0) * 2 }
          }));
          logMsg += ` (Melakukan STOCK SPLIT pada ${card.sector}! Jumlah sahammu dilipatgandakan)`;
          break;

        case 'TRADING_FEE':
          newFees[card.sector] = playerId;
          logMsg += ` (Memegang hak Trading Fee untuk sektor ${card.sector})`;
          break;

        case 'AKUISISI': {
          const target = [...newPlayers]
            .filter(p => p.id !== playerId)
            .sort((a, b) => (b.portfolio[card.sector] || 0) - (a.portfolio[card.sector] || 0))[0];
          
          const playerShares = player.portfolio[card.sector] || 0;
          const targetShares = target?.portfolio[card.sector] || 0;

          if (target && targetShares > 0 && playerShares >= targetShares) {
            newPlayers = newPlayers.map(p => {
              if (p.id === playerId) {
                return { ...p, portfolio: { ...p.portfolio, [card.sector]: (p.portfolio[card.sector] || 0) + 1 } };
              }
              if (p.id === target.id) {
                return { ...p, portfolio: { ...p.portfolio, [card.sector]: (p.portfolio[card.sector] || 0) - 1 } };
              }
              return p;
            });
            logMsg += ` (Berhasil mengakuisisi 1 saham ${card.sector} dari ${target.name})`;
          } else {
            logMsg += ` (Gagal Akuisisi: Saham kamu harus lebih banyak atau sama dengan target)`;
          }
          break;
        }
        
        case 'PAJAK':
          newPlayers = newPlayers.map(p => {
            if (p.id === playerId) return p;
            const tax = Math.min(p.coins, 2);
            return { ...p, coins: p.coins - tax };
          });
          logMsg += ` (Semua pemain lain membayar pajak 2 koin ke Bank)`;
          break;

        case 'INFO_BURSA': {
          const nextRoundIndex = state.round - 1; 
          const econCard = state.economyDeck[card.sector][nextRoundIndex];
          const valueStr = econCard.type === 'PRICE_CHANGE' ? ` (${econCard.value > 0 ? '+' : ''}${econCard.value})` : '';
          logMsg += ` (Ekonomi ${card.sector} mendatang: ${econCard.title}${valueStr})`;
          break;
        }
        case 'RUMOR_POSITIF':
          newMarket[card.sector] = Math.min(15, newMarket[card.sector] + 2);
          logMsg += ` (Harga ${card.sector} naik ke ${newMarket[card.sector]})`;
          break;
        case 'RUMOR_NEGATIF':
          newMarket[card.sector] = Math.max(0, newMarket[card.sector] - 2);
          logMsg += ` (Harga ${card.sector} turun ke ${newMarket[card.sector]})`;
          break;
        case 'DIVIDEN':
          newPlayers = newPlayers.map(p => ({
            ...p,
            coins: p.coins + (p.portfolio[card.sector] || 0)
          }));
          logMsg += ` (Setiap pemain mendapat 1 koin per saham ${card.sector})`;
          break;
        case 'SUSPEND':
          if (!newSuspended.includes(card.sector)) {
            newSuspended.push(card.sector);
          }
          logMsg += ` (${card.sector} SUSPEND! Perdagangan dihentikan)`;
          break;
        case 'RIGHT_ISSUE': {
          const price = newMarket[card.sector];
          if (player.coins >= price) {
            newPlayers = newPlayers.map(p => p.id === playerId ? {
              ...p,
              coins: p.coins - price,
              portfolio: { ...p.portfolio, [card.sector]: (p.portfolio[card.sector] || 0) + 1 }
            } : p);
            logMsg += ` (Membeli 1 saham ${card.sector} tambahan seharga ${price})`;
          } else {
            logMsg += ` (Gagal Right Issue: Koin tidak cukup)`;
          }
          break;
        }
      }

      return { 
        market: newMarket, 
        players: newPlayers, 
        suspendedSectors: newSuspended, 
        tradingFeeOwners: newFees,
        extraTurns: newExtraTurns,
        logs: [logMsg, ...state.logs] 
      };
    });
  },

  sellStock: (playerId, sector, amount) => set((state) => {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return state;

    const price = state.market[sector];
    const feeOwnerId = state.tradingFeeOwners[sector as Exclude<Sector, 'Reksadana'>];
    let actualGain = amount * price;
    let feePaid = 0;

    // Apply Trading Fee if someone else owns it
    if (feeOwnerId !== null && feeOwnerId !== undefined && feeOwnerId !== playerId) {
      feePaid = 1; // 1 koin per transaksi
      actualGain -= feePaid;
    }
    
    if (sector === 'Reksadana') {
      if (player.reksadana < amount) return state;
      const newPlayers = state.players.map(p => {
        if (p.id === playerId) {
          return { ...p, coins: p.coins + actualGain, reksadana: p.reksadana - amount };
        }
        if (p.id === feeOwnerId) {
          return { ...p, coins: p.coins + feePaid };
        }
        return p;
      });
      return { players: newPlayers, logs: [`${player.name} menjual ${amount} unit Reksadana. ${feePaid > 0 ? `(Bayar fee 1 koin ke ${state.players.find(p => p.id === feeOwnerId)?.name})` : ''}`, ...state.logs] };
    } else {
      const s = sector as Exclude<Sector, 'Reksadana'>;
      if (player.portfolio[s] < amount) return state;
      const newPlayers = state.players.map(p => {
        if (p.id === playerId) {
          return { ...p, coins: p.coins + actualGain, portfolio: { ...p.portfolio, [s]: p.portfolio[s] - amount } };
        }
        if (p.id === feeOwnerId) {
          return { ...p, coins: p.coins + feePaid };
        }
        return p;
      });
      return { players: newPlayers, logs: [`${player.name} menjual ${amount} saham ${sector}. ${feePaid > 0 ? `(Bayar fee 1 koin ke ${state.players.find(p => p.id === feeOwnerId)?.name})` : ''}`, ...state.logs] };
    }
  }),

  nextTurn: () => set((state) => {
    let nextIndex = state.activePlayerIndex + 1;
    
    if (state.phase === 'ACTION') {
      if (nextIndex >= NUM_PLAYERS) nextIndex = 0;
      
      if (state.marketCards.length === 0 && !state.pendingAction) {
        return { 
          activePlayerIndex: 0, 
          phase: 'SELLING', 
          logs: ['Semua kartu telah diambil. Fase: PENJUALAN.', ...state.logs] 
        };
      }
      return { activePlayerIndex: nextIndex };
    }

    if (state.phase === 'SELLING') {
      if (nextIndex >= NUM_PLAYERS) {
        const sectors: Record<string, EconomyCard> = {};
        SECTORS.forEach(s => {
          sectors[s] = state.economyDeck[s][state.round - 1];
        });
        const event = state.eventDeck[state.round - 1] || null;

        return {
          phase: 'ECONOMY',
          currentEconomyCards: { sectors: sectors as any, event },
          activePlayerIndex: 0,
          logs: [`Semua pemain selesai menjual. Memasuki Fase Ekonomi Ronde ${state.round}.`, ...state.logs]
        };
      }
      return { activePlayerIndex: nextIndex };
    }

    return state;
  }),

  resolveEconomy: () => {
    get().nextTurn();
  },

  finishEconomyPhase: () => set((state) => {
    if (!state.currentEconomyCards) return state;

    const { sectors, event } = state.currentEconomyCards;
    
    const { newMarket, newPlayers, logMsgs } = applyEconomyPhase(
      state.market,
      state.players,
      sectors as Record<Exclude<Sector, 'Reksadana'>, EconomyCard>,
      state.turnOrder,
      state.suspendedSectors,
      event
    );

    const isLastRound = state.round === TOTAL_ROUNDS;

    return {
      market: newMarket,
      players: newPlayers,
      round: isLastRound ? state.round : state.round + 1,
      phase: isLastRound ? 'END' : 'BIDDING',
      suspendedSectors: [],
      currentEconomyCards: null,
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
    eventDeck: generateEventDeck(),
    currentEconomyCards: null,
    marketCards: [],
    currentBids: {},
    suspendedSectors: [],
    pendingAction: null,
    extraTurns: 0,
    tradingFeeOwners: { Keuangan: null, Perkebunan: null, Pertambangan: null, Properti: null },
    logs: ['Game dimuat ulang! Ronde 1: Fase Lelang (Bidding).'],
  }),
}));
