export type Sector = 'Keuangan' | 'Perkebunan' | 'Pertambangan' | 'Properti' | 'Reksadana';

export type Phase = 'BIDDING' | 'ACTION' | 'SELLING' | 'ECONOMY' | 'END';

export interface Player {
  id: number;
  name: string;
  coins: number;
  portfolio: Record<Exclude<Sector, 'Reksadana'>, number>;
  reksadana: number;
  debt: number; // 0 or 10
  isBankrupt: boolean;
}

export type ActionType = 
  | 'INFO_BURSA' 
  | 'RUMOR_POSITIF' 
  | 'RUMOR_NEGATIF' 
  | 'DIVIDEN' 
  | 'PAJAK' 
  | 'SUSPEND' 
  | 'RIGHT_ISSUE';

export interface ActionCard {
  id: string;
  type: ActionType;
  sector: Exclude<Sector, 'Reksadana'>;
  title: string;
  description: string;
}

export interface EconomyCard {
  sector: Exclude<Sector, 'Reksadana'>;
  value: number; // e.g. +2, -1
}

export type GlobalEventType = 'KRISIS_GLOBAL' | 'EKONOMI_BOOM' | 'SUKU_BUNGA' | 'STABIL';

export interface GlobalEvent {
  type: GlobalEventType;
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
  economyDeck: Record<Exclude<Sector, 'Reksadana'>, EconomyCard[]>;
  eventDeck: GlobalEvent[];
  currentEconomyCards: {
    sectors: Record<Exclude<Sector, 'Reksadana'>, EconomyCard>;
    event: GlobalEvent | null;
  } | null;
  marketCards: ActionCard[];
  currentBids: Record<number, number>; // playerId -> bid amount
  suspendedSectors: Exclude<Sector, 'Reksadana'>[];
  pendingAction: {
    playerId: number;
    card: ActionCard;
  } | null;
  logs: string[];
}
