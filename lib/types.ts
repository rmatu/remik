export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

export interface Card {
  id: string;
  suit: Suit | "joker";
  rank: Rank | "joker";
  isJoker: boolean;
}

export type MeldType = "sequence" | "group";

export interface Meld {
  id: string;
  type: MeldType;
  cards: Card[];
  ownerId?: string;    // Player who created this meld
  isPending?: boolean; // True until player reaches 51 pts
}

export const INITIAL_MELD_THRESHOLD = 51;

export type GameStatus = "waiting" | "playing" | "round_end" | "finished";
export type TurnPhase = "draw" | "play" | "discard";

export interface ValidationResult {
  valid: boolean;
  error?: string;
  points?: number;
}

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: "\u2665",
  diamonds: "\u2666",
  clubs: "\u2663",
  spades: "\u2660",
};
