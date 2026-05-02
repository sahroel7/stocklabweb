import { create } from 'zustand';
import { GameState, Player, Sector, ActionCard, EconomyCard, Phase, ActionType } from './types';
import { generateEconomyDeck, applyEconomyPhase, INITIAL_PRICE } from './economyLogic';

const TOTAL_ROUNDS = 6;
const NUM_PLAYERS = 5;

const SECTORS: Exclude<Sector, 'Reksa Dana'>[] = ['Keuangan', 'Agrikultur', 'Tambang', 'Konsumer'];

const generateActionDeck = (): ActionCard[] => {
  const types: ActionType[] = [
    'INFO_BURSA', 'RUMOR', 'QUICKBUY', 'TRADING_FEE', 'AKUISISI'
  ];
  const deck: ActionCard[] = [];
  
  SECTORS.forEach(sector => {
    types.forEach(type => {
      // 3 cards of each type per sector = 15 cards per sector
      // 4 sectors * 15 cards = 60 cards total
      const count = 3;
      
      for (let i = 0; i < count; i++) {
        deck.push({
          id: `${type}-${sector}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          sector,
          title: getCardTitle(type, sector),
          description: getCardDescription(type, sector),
          color: getSectorColor(sector),
        });
      }
    });
  });
  return deck.sort(() => Math.random() - 0.5);
};

const getCardTitle = (type: ActionType, sector: string): string => {
  switch (type) {
    case 'INFO_BURSA': return 'Info Bursa';
    case 'RUMOR': return 'Rumor';
    case 'QUICKBUY': return 'Quickbuy';
    case 'TRADING_FEE': return 'Trading Fee';
    case 'AKUISISI': return 'Akuisisi';
    default: return type;
  }
};

const getSectorColor = (sector: Exclude<Sector, 'Reksa Dana'>): string => {
  switch (sector) {
    case 'Tambang': return 'bg-red-600';
    case 'Agrikultur': return 'bg-green-600';
    case 'Konsumer': return 'bg-blue-600';
    case 'Keuangan': return 'bg-yellow-600';
    default: return 'bg-zinc-600';
  }
};

const getCardDescription = (type: ActionType, sector: string): string => {
  switch (type) {
    case 'INFO_BURSA': return `Intip 2 kartu ekonomi mendatang & dapat 2 koin.`;
    case 'RUMOR': return `Ubah harga saham (+/- 2 untuk 1 saham, atau +/- 1 untuk 2 saham).`;
    case 'QUICKBUY': return 'Ambil dan simpan 2 kartu bursa sekaligus.';
    case 'TRADING_FEE': return `Jual 1 jenis saham langsung. Bayar 1 koin per saham sektor ini yang dimiliki saat mengambil.`;
    case 'AKUISISI': return `Ambil 1 saham dari pemain lain. Kamu harus punya saham sektor ini >= target. Target dapat 0.5x harga saham.`;
    default: return '';
  }
};

interface GameActions {
  submitBid: (playerId: number, amount: number) => void;
  resolveBidding: () => void;
  drawMarketCards: () => void;
  takeActionCard: (playerId: number, cardId: string) => void;
  handleChoice: (choice: 'SHARE' | 'ACTION' | 'SELL') => void;
  executeActionEffect: (playerId: number, card: ActionCard) => void;
  peekSectors: (playerId: number, sectors: Sector[]) => void;
  useRumor: (playerId: number, effects: { sector: Sector, amount: number }[]) => void;
  handleAkuisisiResponse: (playerId: number, targetId: number) => void;
  clearPeekResults: () => void;
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
    portfolio: { Keuangan: 0, Agrikultur: 0, Tambang: 0, Konsumer: 0 },
    reksaDana: 0,
    debt: 0,
    isBankrupt: false,
  })),
  market: { Keuangan: INITIAL_PRICE, Agrikultur: INITIAL_PRICE, Tambang: INITIAL_PRICE, Konsumer: INITIAL_PRICE, 'Reksa Dana': INITIAL_PRICE },
  turnOrder: [],
  activePlayerIndex: 0,
  actionDeck: generateActionDeck(),
  economyDeck: generateEconomyDeck(),
  currentEconomyCards: null,
  marketCards: [],
  currentBids: {},
  suspendedSectors: [],
  pendingAction: null,
  extraTurns: 0,
  tradingFeeOwners: { Keuangan: null, Agrikultur: null, Tambang: null, Konsumer: null },
  logs: ['Game started! Round 1: Bidding Phase.'],
  interaction: null,
  peekResults: null,

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

    let cost = 0;
    if ((choice === 'SHARE' || choice === 'ACTION') && card.type === 'TRADING_FEE') {
      const sharesOwned = player.portfolio[card.sector] || 0;
      cost = sharesOwned + 1;
      if (player.coins < cost) {
        set((state) => ({ logs: [`Gagal: ${player.name} tidak cukup koin untuk Trading Fee (Butuh ${cost}).`, ...state.logs] }));
      }
    }

    if (choice === 'SHARE') {
      set((state) => ({
        players: state.players.map(p => p.id === playerId ? {
          ...p,
          coins: p.coins - cost,
          portfolio: { ...p.portfolio, [card.sector]: p.portfolio[card.sector] + 1 }
        } : p),
        pendingAction: null,
        logs: [`${player.name} menyimpan Saham ${card.sector} (${card.title}) sebagai saham. ${cost > 0 ? `(Bayar fee ${cost} koin)` : ''}`, ...state.logs]
      }));
      get().nextTurn();
    } else if (choice === 'SELL') {
      const price = market[card.sector];
      set((state) => ({
        players: state.players.map(p => p.id === playerId ? {
          ...p,
          coins: p.coins + price
        } : p),
        pendingAction: null,
        logs: [`${player.name} menjual Saham ${card.sector} (${card.title}) langsung seharga ${price} koin.`, ...state.logs]
      }));
      get().nextTurn();
    } else {
      if (cost > 0) {
        set((state) => ({
          players: state.players.map(p => p.id === playerId ? { ...p, coins: p.coins - cost } : p)
        }));
      }
      executeActionEffect(playerId, card);
      // pendingAction is cleared inside executeActionEffect or after interaction
    }
  },

  executeActionEffect: (playerId, card) => {
    const { players, market, economyDeck, round } = get();
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    let logMsg = `${player.name} menggunakan aksi: ${card.title}`;
    const isBot = playerId !== 0;

    switch (card.type) {
      case 'QUICKBUY':
        set((state) => ({
          extraTurns: 2,
          pendingAction: null,
          logs: [`${logMsg} (Dapat mengambil 2 kartu tambahan sekarang)`, ...state.logs]
        }));
        get().nextTurn(); // Call nextTurn to handle extraTurns correctly
        break;

      case 'TRADING_FEE': {
        if (isBot) {
          const bestSector = (Object.entries(player.portfolio) as [Sector, number][])
            .filter(([s, count]) => count > 0)
            .sort((a, b) => market[b[0]] - market[a[0]])[0];
          
          if (bestSector) {
            const [s, count] = bestSector;
            const price = market[s];
            const gain = count * price;
            set((state) => ({
              players: state.players.map(p => p.id === playerId ? {
                ...p,
                coins: p.coins + gain,
                portfolio: { ...p.portfolio, [s]: 0 }
              } : p),
              pendingAction: null,
              logs: [`${logMsg} (Menjual semua Saham ${s} seharga ${gain} koin)`, ...state.logs]
            }));
          } else {
             set((state) => ({ pendingAction: null, logs: [`${logMsg} (Gagal: Tidak ada saham untuk dijual)`, ...state.logs] }));
          }
          get().nextTurn();
        } else {
          set({ interaction: { type: 'SELECT_STOCK', count: 1 }, pendingAction: { playerId, card } });
        }
        break;
      }

      case 'AKUISISI': {
        const otherPlayersWithShares = players
          .filter(p => p.id !== playerId && (p.portfolio[card.sector] || 0) > 0)
          .sort((a, b) => (b.portfolio[card.sector] || 0) - (a.portfolio[card.sector] || 0));
        
        const target = otherPlayersWithShares[0];
        const playerShares = player.portfolio[card.sector] || 0;
        const targetShares = target?.portfolio[card.sector] || 0;

        if (target && playerShares >= targetShares) {
          if (isBot) {
            get().handleAkuisisiResponse(playerId, target.id);
          } else {
            set({ interaction: { type: 'SELECT_PLAYER', count: 1, data: card.sector }, pendingAction: { playerId, card } });
          }
        } else {
          set((state) => ({ pendingAction: null, logs: [`${logMsg} (Gagal Akuisisi: Saham kamu harus >= target)`, ...state.logs] }));
          get().nextTurn();
        }
        break;
      }
      
      case 'INFO_BURSA': {
        if (isBot) {
          get().peekSectors(playerId, SECTORS.slice(0, 2));
        } else {
          set({ interaction: { type: 'SELECT_SECTOR', count: 2 }, pendingAction: { playerId, card } });
        }
        break;
      }

      case 'RUMOR': {
        if (isBot) {
          get().useRumor(playerId, [{ sector: card.sector, amount: 2 }]);
        } else {
          set({ interaction: { type: 'RUMOR_CHOICE', count: 1, data: card.sector }, pendingAction: { playerId, card } });
        }
        break;
      }
    }
  },

  peekSectors: (playerId, sectors) => {
    const { economyDeck, round, players } = get();
    const results = sectors.map(s => ({
      sector: s,
      card: economyDeck[s as Exclude<Sector, 'Reksa Dana'>][round - 1]
    }));

    set((state) => ({
      players: state.players.map(p => p.id === playerId ? { ...p, coins: p.coins + 2 } : p),
      peekResults: playerId === 0 ? results : null,
      interaction: null,
      pendingAction: null,
      logs: [`${state.players.find(p => p.id === playerId)?.name} menggunakan Info Bursa & mendapat 2 koin.`, ...state.logs]
    }));
    get().nextTurn();
  },

  useRumor: (playerId, effects) => {
    set((state) => {
      const newMarket = { ...state.market };
      effects.forEach(eff => {
        // Rumor cannot cause crash (<2) or split (>12)
        newMarket[eff.sector] = Math.max(2, Math.min(12, newMarket[eff.sector] + eff.amount));
      });
      return { 
        market: newMarket, 
        interaction: null, 
        pendingAction: null,
        logs: [`${state.players.find(p => p.id === playerId)?.name} menggunakan Rumor.`, ...state.logs] 
      };
    });
    get().nextTurn();
  },

  handleAkuisisiResponse: (playerId, targetId) => {
    const { players, market, pendingAction } = get();
    const sector = pendingAction?.card.sector as Exclude<Sector, 'Reksa Dana'>;
    const target = players.find(p => p.id === targetId);
    
    if (target && sector) {
      const compensation = Math.floor(market[sector] / 2);
      set((state) => ({
        players: state.players.map(p => {
          if (p.id === playerId) return { ...p, portfolio: { ...p.portfolio, [sector]: (p.portfolio[sector] || 0) + 1 } };
          if (p.id === targetId) return { ...p, coins: p.coins + compensation, portfolio: { ...p.portfolio, [sector]: (p.portfolio[sector] || 0) - 1 } };
          return p;
        }),
        interaction: null,
        pendingAction: null,
        logs: [`${state.players.find(p => p.id === playerId)?.name} mengakuisisi 1 Saham ${sector} dari ${target.name}.`, ...state.logs]
      }));
    } else {
      set({ interaction: null, pendingAction: null });
    }
    get().nextTurn();
  },

  clearPeekResults: () => set({ peekResults: null }),

  sellStock: (playerId, sector, amount) => set((state) => {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return state;

    const price = state.market[sector];
    const actualGain = amount * price;
    
    const newPlayers = state.players.map(p => {
      if (p.id === playerId) {
        if (sector === 'Reksa Dana') {
          return { ...p, coins: p.coins + actualGain, reksaDana: p.reksaDana - amount };
        }
        const s = sector as Exclude<Sector, 'Reksa Dana'>;
        return { ...p, coins: p.coins + actualGain, portfolio: { ...p.portfolio, [s]: p.portfolio[s] - amount } };
      }
      return p;
    });

    // If it was a SELECT_STOCK interaction for Trading Fee
    const isInteraction = state.interaction?.type === 'SELECT_STOCK';

    if (isInteraction) {
      setTimeout(() => get().nextTurn(), 0);
    }

    return { 
      players: newPlayers, 
      interaction: isInteraction ? null : state.interaction,
      pendingAction: isInteraction ? null : state.pendingAction,
      logs: [`${player.name} menjual ${amount} ${sector === 'Reksa Dana' ? sector : `Saham ${sector}`}.`, ...state.logs] 
    };
  }),

  nextTurn: () => set((state) => {
    // 1. If market is empty, phase changes to SELLING immediately
    if (state.phase === 'ACTION' && state.marketCards.length === 0 && !state.pendingAction) {
      return { 
        activePlayerIndex: 0, 
        phase: 'SELLING', 
        extraTurns: 0, // Clear any remaining extra turns
        logs: ['Semua kartu market telah diambil. Fase: PENJUALAN.', ...state.logs] 
      };
    }

    // 2. If player has extra turns (Quickbuy), stay on same player
    if (state.extraTurns > 0) {
      return { extraTurns: state.extraTurns - 1 };
    }

    let nextIndex = state.activePlayerIndex + 1;
    
    if (state.phase === 'ACTION') {
      if (nextIndex >= NUM_PLAYERS) nextIndex = 0;
      return { activePlayerIndex: nextIndex };
    }

    if (state.phase === 'SELLING') {
      if (nextIndex >= NUM_PLAYERS) {
        const sectors: Record<string, EconomyCard> = {};
        SECTORS.forEach(s => {
          sectors[s] = state.economyDeck[s][state.round - 1];
        });

        return {
          phase: 'ECONOMY',
          currentEconomyCards: { sectors: sectors as any },
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

    const { sectors } = state.currentEconomyCards;
    
    const { newMarket, newPlayers, logMsgs } = applyEconomyPhase(
      state.market,
      state.players,
      sectors as Record<Exclude<Sector, 'Reksa Dana'>, EconomyCard>,
      state.turnOrder,
      state.suspendedSectors
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
      portfolio: { Keuangan: 0, Agrikultur: 0, Tambang: 0, Konsumer: 0 },
      reksaDana: 0,
      debt: 0,
      isBankrupt: false,
    })),
    market: { Keuangan: INITIAL_PRICE, Agrikultur: INITIAL_PRICE, Tambang: INITIAL_PRICE, Konsumer: INITIAL_PRICE, 'Reksa Dana': INITIAL_PRICE },
    turnOrder: [],
    activePlayerIndex: 0,
    actionDeck: generateActionDeck(),
    economyDeck: generateEconomyDeck(),
    currentEconomyCards: null,
    marketCards: [],
    currentBids: {},
    suspendedSectors: [],
    pendingAction: null,
    extraTurns: 0,
    tradingFeeOwners: { Keuangan: null, Agrikultur: null, Tambang: null, Konsumer: null },
    logs: ['Game dimuat ulang! Ronde 1: Fase Lelang (Bidding).'],
  }),
}));
