export type Sector = 'Agri' | 'Mining' | 'Consumer' | 'Financial' | 'MutualFund';

export type Phase = 'BIDDING' | 'ACTION' | 'SELLING' | 'ECONOMY' | 'END';

export interface Player {
  id: number;
  name: string;
  coins: number;
  portfolio: Record<Sector, number>;
  debt: number; // 0 or 10
  isBankrupt: boolean;
}

export type ActionType = 
  | 'INFO_BURSA' 
  | 'RUMOR' 
  | 'DIVIDEND' 
  | 'TRADING_FEE' 
  | 'MARKET_BOOM_CRASH';

export interface ActionCard {
  id: string;
  type: ActionType;
  sector: Sector;
  title: string;
  description: string;
}

export interface EconomyCard {
  sector: Sector;
  value: number; // e.g. +2, -1
}

export interface GameState {
  round: number;
  phase: Phase;
  players: Player[];
  market: Record<Sector, number>;
  turnOrder: number[]; // Array of player IDs
  activePlayerIndex: number;
  actionDeck: ActionCard[];
  economyDeck: Record<Sector, EconomyCard[]>;
  marketCards: ActionCard[];
  currentBids: Record<number, number>; // playerId -> bid amount
  pendingAction: {
    playerId: number;
    card: ActionCard;
  } | null;
  cardsTakenInTurn: number;
  logs: string[];
}
