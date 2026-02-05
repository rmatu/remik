export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
export const SUITS = ["hearts", "diamonds", "clubs", "spades"] as const;

export const RANK_VALUES: Record<string, number> = {
  A: 1, // Can also be 11 in certain contexts
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 10,
  Q: 10,
  K: 10,
  joker: 30,
};

export const ACE_HIGH_VALUE = 11;
export const JOKER_PENALTY = 30;

export const INITIAL_MELD_MINIMUM_POINTS = 30;
export const DEFAULT_TARGET_SCORE = 300;

export const CARDS_PER_PLAYER = 13;
export const DEALER_EXTRA_CARD = 1;

export const MIN_MELD_SIZE = 3;
export const MAX_GROUP_SIZE = 4;

export const AVATAR_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
];

export const GAME_CODE_LENGTH = 6;
export const GAME_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars
