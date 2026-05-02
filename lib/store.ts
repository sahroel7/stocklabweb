import { create } from 'zustand';
import { GameState, Player, Sector, ActionCard, EconomyCard, Phase, ActionType } from './types';
import { generateEconomyDeck, applyEconomyPhase, INITIAL_PRICE } from './economyLogic';

const TOTAL_ROUNDS = 6;
const NUM_PLAYERS = 5;

const SECTORS: Sector[] = ['Keuangan', 'Agrikultur', 'Tambang', 'Konsumer', 'Reksa Dana'];

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

const getSectorColor = (sector: Sector): string => {
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

const generateActionDeck = (): ActionCard[] => {
  const stockSectors: Exclude<Sector, 'Reksa Dana'>[] = ['Keuangan', 'Agrikultur', 'Tambang', 'Konsumer'];
  const types: ActionType[] = ['INFO_BURSA', 'RUMOR', 'QUICKBUY', 'TRADING_FEE', 'AKUISISI'];
  const deck: ActionCard[] = [];
  
  stockSectors.forEach(sector => {
    types.forEach(type => {
      for (let i = 0; i < 3; i++) {
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

  const rdTypes: ActionType[] = ['QUICKBUY', 'TRADING_FEE'];
  rdTypes.forEach(type => {
     for (let i = 0; i < 4; i++) {
        deck.push({
          id: `${type}-RD-${i}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          sector: 'Reksa Dana',
          title: getCardTitle(type, 'Reksa Dana'),
          description: getCardDescription(type, 'Reksa Dana'),
          color: getSectorColor('Reksa Dana'),
        });
     }
  });

  return deck.sort(() => Math.random() - 0.5);
};

const generateSectorOrder = (): Sector[] => {
  const stockSectors: Sector[] = ['Keuangan', 'Agrikultur', 'Tambang', 'Konsumer'];
  const shuffledStocks = stockSectors.sort(() => Math.random() - 0.5);
  const order: Sector[] = [...shuffledStocks];
  order.splice(2, 0, 'Reksa Dana');
  return order;
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
  initializeGame: () => void;
  setGameMode: (mode: 'BOT' | 'FRIENDS', playerCount: number) => void;
}

const getInitialState = () => ({
  gameMode: null as 'BOT' | 'FRIENDS' | null,
  round: 1,
  phase: 'SETUP' as Phase,
  players: [],
  market: { Keuangan: INITIAL_PRICE, Agrikultur: INITIAL_PRICE, Tambang: INITIAL_PRICE, Konsumer: INITIAL_PRICE, 'Reksa Dana': INITIAL_PRICE },
  turnOrder: [],
  activePlayerIndex: 0,
  actionDeck: [],
  economyDeck: { Keuangan: [], Agrikultur: [], Tambang: [], Konsumer: [] },
  currentEconomyCards: null,
  marketCards: [],
  currentBids: {},
  suspendedSectors: [],
  pendingAction: null,
  extraTurns: 0,
  tradingFeeOwners: { Keuangan: null, Agrikultur: null, Tambang: null, Konsumer: null },
  logs: [],
  interaction: null,
  peekResults: null,
  sectorOrder: ['Keuangan', 'Agrikultur', 'Reksa Dana', 'Tambang', 'Konsumer'],
});

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...getInitialState(),

  initializeGame: () => {
    // No auto-initialization to BIDDING anymore
  },

  setGameMode: (mode, playerCount) => set((state) => {
    const players: Player[] = [];
    
    if (mode === 'BOT') {
      players.push({
        id: 0,
        name: 'You',
        coins: 15,
        portfolio: { Keuangan: 0, Agrikultur: 0, Tambang: 0, Konsumer: 0 },
        reksaDana: 0,
        debt: 0,
        isBankrupt: false,
        isBot: false
      });
      
      for (let i = 1; i < playerCount; i++) {
        players.push({
          id: i,
          name: `Pro Bot ${i}`,
          coins: 15,
          portfolio: { Keuangan: 0, Agrikultur: 0, Tambang: 0, Konsumer: 0 },
          reksaDana: 0,
          debt: 0,
          isBankrupt: false,
          isBot: true,
          difficulty: i === playerCount - 1 ? 'HARD' : (i % 2 === 0 ? 'MEDIUM' : 'EASY')
        });
      }
    } else {
      for (let i = 0; i < playerCount; i++) {
        players.push({
          id: i,
          name: `Player ${i + 1}`,
          coins: 15,
          portfolio: { Keuangan: 0, Agrikultur: 0, Tambang: 0, Konsumer: 0 },
          reksaDana: 0,
          debt: 0,
          isBankrupt: false,
          isBot: false
        });
      }
    }

    return {
      gameMode: mode,
      players,
      phase: 'BIDDING',
      actionDeck: generateActionDeck(),
      economyDeck: generateEconomyDeck(),
      sectorOrder: generateSectorOrder(),
      logs: [`Game dimulai! Mode: ${mode === 'BOT' ? 'Lawan Bot' : 'Main Bareng Teman'}. Ronde 1: Fase Lelang (Bidding).`],
    };
  }),

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

    let deck = [...state.actionDeck];
    let drawn: ActionCard[] = [];
    let reshuffleCount = 0;
    const numCards = NUM_PLAYERS * 2;

    const checkConstraints = (cards: ActionCard[]) => {
      const sectorCounts: Record<string, number> = {};
      const typeCounts: Record<string, number> = {};
      for (const card of cards) {
        sectorCounts[card.sector] = (sectorCounts[card.sector] || 0) + 1;
        typeCounts[card.type] = (typeCounts[card.type] || 0) + 1;
        if (sectorCounts[card.sector] > 5 || typeCounts[card.type] > 3) return false;
      }
      return true;
    };

    while (reshuffleCount < 100) {
      deck.sort(() => Math.random() - 0.5);
      drawn = deck.slice(0, numCards);
      if (checkConstraints(drawn)) break;
      reshuffleCount++;
    }

    const bidsInfo = sortedOrder.map(id => {
      const p = newPlayers.find(player => player.id === id);
      return `${p?.name}: ${state.currentBids[id] || 0}`;
    }).join(', ');
    const logBidding = `Bidding Selesai! [${bidsInfo}]`;

    return {
      players: newPlayers,
      turnOrder: sortedOrder,
      activePlayerIndex: 0,
      phase: 'ACTION',
      currentBids: {},
      actionDeck: deck.slice(numCards),
      marketCards: drawn,
      logs: [logBidding, ...state.logs]
    };
  }),

  drawMarketCards: () => set((state) => {
    let deck = [...state.actionDeck];
    let drawn: ActionCard[] = [];
    let reshuffleCount = 0;
    const numCards = NUM_PLAYERS * 2;
    const checkConstraints = (cards: ActionCard[]) => {
      const sectorCounts: Record<string, number> = {};
      const typeCounts: Record<string, number> = {};
      for (const card of cards) {
        sectorCounts[card.sector] = (sectorCounts[card.sector] || 0) + 1;
        typeCounts[card.type] = (typeCounts[card.type] || 0) + 1;
        if (sectorCounts[card.sector] > 5 || typeCounts[card.type] > 3) return false;
      }
      return true;
    };
    while (reshuffleCount < 100) {
      deck.sort(() => Math.random() - 0.5);
      drawn = deck.slice(0, numCards);
      if (checkConstraints(drawn)) break;
      reshuffleCount++;
    }
    return { actionDeck: deck.slice(numCards), marketCards: drawn, logs: ["Pasar diperbarui.", ...state.logs] };
  }),

  takeActionCard: (playerId, cardId) => set((state) => {
    const card = state.marketCards.find(c => c.id === cardId);
    if (!card || state.phase !== 'ACTION' || state.pendingAction) return state;

    const activePlayerId = state.turnOrder[state.activePlayerIndex];
    if (playerId !== activePlayerId) return state;

    const newMarketCards = state.marketCards.filter(c => c.id !== cardId);
    
    // We don't log here anymore, we log in handleChoice
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
      cost = (player.portfolio[card.sector as Exclude<Sector, 'Reksa Dana'>] || 0) + 1;
    }

    if (get().extraTurns > 0) {
      set((state) => ({
        players: state.players.map(p => p.id === playerId ? {
          ...p, coins: p.coins - cost,
          reksaDana: card.sector === 'Reksa Dana' ? p.reksaDana + 1 : p.reksaDana,
          portfolio: card.sector === 'Reksa Dana' ? p.portfolio : { ...p.portfolio, [card.sector as Exclude<Sector, 'Reksa Dana'>]: (p.portfolio[card.sector as Exclude<Sector, 'Reksa Dana'>] || 0) + 1 }
        } : p),
        pendingAction: null,
        logs: [`${player.name} menyimpan kartu ${card.title} (${card.sector})`, ...state.logs]
      }));
      get().nextTurn();
      return;
    }

    if (choice === 'SHARE') {
      set((state) => ({
        players: state.players.map(p => p.id === playerId ? {
          ...p, coins: p.coins - cost,
          reksaDana: card.sector === 'Reksa Dana' ? p.reksaDana + 1 : p.reksaDana,
          portfolio: card.sector === 'Reksa Dana' ? p.portfolio : { ...p.portfolio, [card.sector as Exclude<Sector, 'Reksa Dana'>]: (p.portfolio[card.sector as Exclude<Sector, 'Reksa Dana'>] || 0) + 1 }
        } : p),
        pendingAction: null,
        logs: [`${player.name} menyimpan kartu ${card.title} (${card.sector})`, ...state.logs]
      }));
      get().nextTurn();
    } else if (choice === 'SELL') {
      const price = market[card.sector];
      set((state) => ({
        players: state.players.map(p => p.id === playerId ? { ...p, coins: p.coins + price } : p),
        pendingAction: null,
        logs: [`${player.name} menjual kartu ${card.title} (${card.sector}) [${price} koin]`, ...state.logs]
      }));
      get().nextTurn();
    } else {
      if (cost > 0) set((state) => ({ players: state.players.map(p => p.id === playerId ? { ...p, coins: p.coins - cost } : p) }));
      executeActionEffect(playerId, card);
    }
  },

  executeActionEffect: (playerId, card) => {
    const { players, market, economyDeck, round } = get();
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    const isBot = playerId !== 0;

    let logMsg = `${player.name} menggunakan kartu ${card.title} (${card.sector})`;

    switch (card.type) {
      case 'QUICKBUY':
        const isMarketEmpty = get().marketCards.length === 0;
        set((state) => ({ 
          extraTurns: isMarketEmpty ? 0 : 2, 
          pendingAction: null, 
          players: state.players.map(p => p.id === playerId ? { ...p, skipNextTurn: true } : p),
          logs: [logMsg + (isMarketEmpty ? "" : " [Ambil +2 kartu]"), ...state.logs]
        }));
        if (isMarketEmpty) get().nextTurn();
        break;
      case 'TRADING_FEE':
        if (isBot) {
          const bestSector = (Object.entries(player.portfolio) as [Sector, number][]).filter(([s, count]) => count > 0).sort((a, b) => market[b[0]] - market[a[0]])[0];
          if (bestSector) {
            const [s, count] = bestSector;
            const price = market[s];
            const gain = count * price;
            set((state) => ({ 
              players: state.players.map(p => p.id === playerId ? { ...p, coins: p.coins + gain, portfolio: { ...p.portfolio, [s]: 0 } } : p), 
              pendingAction: null,
              logs: [logMsg + ` - Jual Saham ${s} [${gain} koin]`, ...state.logs]
            }));
          } else {
            set((state) => ({ pendingAction: null, logs: [logMsg + " (Gagal: Tidak ada saham)", ...state.logs] }));
          }
          get().nextTurn();
        } else {
          set((state) => ({ 
            interaction: { type: 'SELECT_STOCK', count: 1 }, 
            pendingAction: { playerId, card },
            logs: [logMsg, ...state.logs]
          }));
        }
        break;
      case 'AKUISISI':
        const otherPlayersWithShares = players.filter(p => p.id !== playerId && (p.portfolio[card.sector as Exclude<Sector, 'Reksa Dana'>] || 0) > 0).sort((a, b) => (b.portfolio[card.sector as Exclude<Sector, 'Reksa Dana'>] || 0) - (a.portfolio[card.sector as Exclude<Sector, 'Reksa Dana'>] || 0));
        const target = otherPlayersWithShares[0];
        if (target && (player.portfolio[card.sector as Exclude<Sector, 'Reksa Dana'>] || 0) >= (target.portfolio[card.sector as Exclude<Sector, 'Reksa Dana'>] || 0)) {
          if (isBot) get().handleAkuisisiResponse(playerId, target.id);
          else set((state) => ({ 
            interaction: { type: 'SELECT_PLAYER', count: 1, data: card.sector }, 
            pendingAction: { playerId, card },
            logs: [logMsg, ...state.logs]
          }));
        } else {
          set((state) => ({ pendingAction: null, logs: [logMsg + " (Gagal: Saham tidak cukup)", ...state.logs] }));
          get().nextTurn();
        }
        break;
      case 'INFO_BURSA':
        if (isBot) get().peekSectors(playerId, SECTORS.slice(0, 2));
        else set((state) => ({ 
          interaction: { type: 'SELECT_SECTOR', count: 2 }, 
          pendingAction: { playerId, card },
          logs: [logMsg, ...state.logs]
        }));
        break;
      case 'RUMOR':
        if (isBot) get().useRumor(playerId, [{ sector: card.sector, amount: 2 }]);
        else set((state) => ({ 
          interaction: { type: 'RUMOR_CHOICE', count: 1, data: card.sector }, 
          pendingAction: { playerId, card },
          logs: [logMsg, ...state.logs]
        }));
        break;
    }
  },

  peekSectors: (playerId, sectors) => {
    const { economyDeck, round } = get();
    const results = sectors.map(s => ({ sector: s, card: economyDeck[s as Exclude<Sector, 'Reksa Dana'>][round - 1] }));
    const player = get().players.find(p => p.id === playerId);
    set((state) => ({ 
      players: state.players.map(p => p.id === playerId ? { ...p, coins: p.coins + 2 } : p), 
      peekResults: playerId === 0 ? results : null, 
      interaction: null, 
      pendingAction: null,
      logs: [`${player?.name} intip bursa [+2 koin]`, ...state.logs]
    }));
    get().nextTurn();
  },

  useRumor: (playerId, effects) => {
    const player = get().players.find(p => p.id === playerId);
    set((state) => {
      const newMarket = { ...state.market };
      effects.forEach(eff => newMarket[eff.sector] = Math.max(2, Math.min(12, newMarket[eff.sector] + eff.amount)));
      const effText = effects.map(e => `${e.sector} (${e.amount > 0 ? '+' : ''}${e.amount})`).join(', ');
      return { 
        market: newMarket, 
        interaction: null, 
        pendingAction: null,
        logs: [`${player?.name} merubah harga: ${effText}`, ...state.logs]
      };
    });
    get().nextTurn();
  },

  handleAkuisisiResponse: (playerId, targetId) => {
    const { players, market, pendingAction } = get();
    const sector = pendingAction?.card.sector as Exclude<Sector, 'Reksa Dana'>;
    const target = players.find(p => p.id === targetId);
    const actor = players.find(p => p.id === playerId);
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
        logs: [`${actor?.name} mengambil 1 Saham ${sector} dari ${target.name}`, ...state.logs]
      }));
    } else set({ interaction: null, pendingAction: null });
    get().nextTurn();
  },

  clearPeekResults: () => set({ peekResults: null }),

  sellStock: (playerId, sector, amount) => set((state) => {
    const player = state.players.find(p => p.id === playerId);
    if (!player) return state;
    const price = state.market[sector];
    const gain = amount * price;
    const newPlayers = state.players.map(p => {
      if (p.id === playerId) {
        if (sector === 'Reksa Dana') return { ...p, coins: p.coins + gain, reksaDana: p.reksaDana - amount };
        return { ...p, coins: p.coins + gain, portfolio: { ...p.portfolio, [sector as Exclude<Sector, 'Reksa Dana'>]: p.portfolio[sector as Exclude<Sector, 'Reksa Dana'>] - amount } };
      }
      return p;
    });
    if (state.interaction?.type === 'SELECT_STOCK') setTimeout(() => get().nextTurn(), 0);
    return { 
      players: newPlayers, 
      interaction: state.interaction?.type === 'SELECT_STOCK' ? null : state.interaction, 
      pendingAction: state.interaction?.type === 'SELECT_STOCK' ? null : state.pendingAction,
      logs: [`${player.name} menjual ${amount} lembar Saham ${sector} [${gain} koin]`, ...state.logs]
    };
  }),

  nextTurn: () => set((state) => {
    if (state.phase === 'ACTION' && state.marketCards.length === 0 && !state.pendingAction) return { activePlayerIndex: 0, phase: 'SELLING', extraTurns: 0, logs: ["Memasuki Fase Penjualan", ...state.logs] };
    if (state.extraTurns > 1) return { extraTurns: state.extraTurns - 1 };
    let nextIndex = state.activePlayerIndex + 1;
    if (state.phase === 'ACTION') {
      if (nextIndex >= NUM_PLAYERS) nextIndex = 0;
      const nextPlayer = state.players.find(p => p.id === state.turnOrder[nextIndex]);
      if (nextPlayer?.skipNextTurn) {
        const updatedPlayers = state.players.map(p => p.id === nextPlayer.id ? { ...p, skipNextTurn: false } : p);
        let evenNextIndex = nextIndex + 1;
        if (evenNextIndex >= NUM_PLAYERS) evenNextIndex = 0;
        return { players: updatedPlayers, activePlayerIndex: evenNextIndex, extraTurns: 0, logs: [`Giliran ${nextPlayer.name} dilewati`, ...state.logs] };
      }
      return { activePlayerIndex: nextIndex, extraTurns: 0 };
    }
    if (state.phase === 'SELLING') {
      if (nextIndex >= NUM_PLAYERS) {
        const sectors: Record<string, EconomyCard> = {};
        SECTORS.filter(s => s !== 'Reksa Dana').forEach(s => sectors[s] = state.economyDeck[s as Exclude<Sector, 'Reksa Dana'>][state.round - 1]);
        return { phase: 'ECONOMY', currentEconomyCards: { sectors: sectors as any }, activePlayerIndex: 0, logs: ["Fase Ekonomi dimulai", ...state.logs] };
      }
      return { activePlayerIndex: nextIndex };
    }
    return state;
  }),

  resolveEconomy: () => get().nextTurn(),

  finishEconomyPhase: () => set((state) => {
    if (!state.currentEconomyCards) return state;
    const { sectors } = state.currentEconomyCards;
    const { newMarket: updatedMarket, newPlayers, logMsgs } = applyEconomyPhase(state.market, state.players, sectors as Record<Exclude<Sector, 'Reksa Dana'>, EconomyCard>, state.turnOrder, state.suspendedSectors);
    const leftAvg = Math.floor((updatedMarket[state.sectorOrder[0]] + updatedMarket[state.sectorOrder[1]]) / 2);
    const rightAvg = Math.floor((updatedMarket[state.sectorOrder[3]] + updatedMarket[state.sectorOrder[4]]) / 2);
    const rdPrice = Math.max(leftAvg, rightAvg);
    const newMarket = { ...updatedMarket, 'Reksa Dana': rdPrice };
    const isLastRound = state.round === TOTAL_ROUNDS;
    return { market: newMarket, players: newPlayers, round: isLastRound ? state.round : state.round + 1, phase: isLastRound ? 'END' : 'BIDDING', currentEconomyCards: null, logs: [...logMsgs.reverse(), `--- Ronde ${state.round} Berakhir ---`, ...state.logs] };
  }),

  takeDebt: (playerId) => set((state) => ({ players: state.players.map(p => p.id === playerId ? { ...p, coins: p.coins + 10, debt: 10 } : p), logs: [`${state.players.find(p => p.id === playerId)?.name} berhutang 10 koin`, ...state.logs] })),
  
  resetGame: () => set({
    ...getInitialState(),
    logs: ['Game dimuat ulang! Pilih mode permainan.'],
  }),
}));
