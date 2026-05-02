export type Sector = 'Keuangan' | 'Agrikultur' | 'Tambang' | 'Konsumer' | 'Reksa Dana';

export type Phase = 'BIDDING' | 'ACTION' | 'SELLING' | 'ECONOMY' | 'END';

export interface Player {
  id: number;
  name: string;
  coins: number;
  portfolio: Record<Exclude<Sector, 'Reksa Dana'>, number>;
  reksaDana: number;
  debt: number; // 0 or 10
  isBankrupt: boolean;
  skipNextTurn?: boolean;
}

export type ActionType = 
  | 'INFO_BURSA' 
  | 'RUMOR' 
  | 'QUICKBUY'
  | 'AKUISISI'
  | 'TRADING_FEE';

export interface ActionCard {
  id: string;
  type: ActionType;
  sector: Exclude<Sector, 'Reksa Dana'>;
  title: string;
  description: string;
  color: string; // To match physical card colors (sector-based)
}

export type EconomyColor = 'GREEN' | 'RED' | 'BLUE' | 'PURPLE';

export type EconomyEffectType = 
  | 'PRICE_CHANGE' 
  | 'DIVIDEND' 
  | 'RESESI' 
  | 'RESTRUKTURISASI' 
  | 'PAJAK_JALAN' 
  | 'STIMULUS' 
  | 'EXTRA_FEE' 
  | 'BUYBACK' 
  | 'PENERBITAN_SAHAM'
  | 'SIDEWAYS';

export interface EconomyCard {
  id: string;
  sector: Exclude<Sector, 'Reksa Dana'>;
  color: EconomyColor;
  type: EconomyEffectType;
  value: number; 
  title: string;
  description: string;
}

export interface GameState {
  round: number;
  phase: Phase;
  players: Player[];
  market: Record<Sector, number>;
  turnOrder: number[]; // Array of player IDs
  activePlayerIndex: number; // Index in turnOrder
  actionDeck: ActionCard[];
  economyDeck: Record<Exclude<Sector, 'Reksa Dana'>, EconomyCard[]>;
  currentEconomyCards: {
    sectors: Record<Exclude<Sector, 'Reksa Dana'>, EconomyCard>;
  } | null;
  marketCards: ActionCard[];
  currentBids: Record<number, number>; // playerId -> bid amount
  suspendedSectors: Exclude<Sector, 'Reksa Dana'>[];
  pendingAction: {
    playerId: number;
    card: ActionCard;
  } | null;
  extraTurns: number; // For Quickbuy effect
  tradingFeeOwners: Record<Exclude<Sector, 'Reksa Dana'>, number | null>; // sector -> playerId
  logs: string[];
  
  // New Interaction fields
  interaction: {
    type: 'SELECT_SECTOR' | 'SELECT_PLAYER' | 'SELECT_STOCK' | 'RUMOR_CHOICE';
    count: number;
    data?: any;
  } | null;
  peekResults: { sector: Sector; card: EconomyCard }[] | null;
}
