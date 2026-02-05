import { Card, Meld, Rank, Suit, ValidationResult, INITIAL_MELD_THRESHOLD } from "../../lib/types";

const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];

const RANK_VALUES: Record<string, number> = {
  A: 1,
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

export function getRankIndex(rank: Rank | "joker"): number {
  if (rank === "joker") return -1;
  return RANKS.indexOf(rank);
}

export function calculateCardPoints(card: Card): number {
  return RANK_VALUES[card.rank];
}

export function calculateMeldPoints(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + calculateCardPoints(card), 0);
}

export function validateSequence(cards: Card[]): ValidationResult {
  if (cards.length < 3) {
    return { valid: false, error: "Sequence must have at least 3 cards" };
  }

  const nonJokers = cards.filter((c) => !c.isJoker);
  const jokerCount = cards.length - nonJokers.length;

  if (nonJokers.length === 0) {
    return { valid: false, error: "Sequence cannot be all jokers" };
  }

  // All non-jokers must be same suit
  const suits = new Set(nonJokers.map((c) => c.suit));
  if (suits.size > 1) {
    return { valid: false, error: "All cards in a sequence must be the same suit" };
  }

  // Check for adjacent jokers
  let consecutiveJokers = 0;
  for (const card of cards) {
    if (card.isJoker) {
      consecutiveJokers++;
      if (consecutiveJokers > 1) {
        return { valid: false, error: "Cannot have two adjacent jokers in a sequence" };
      }
    } else {
      consecutiveJokers = 0;
    }
  }

  // Sort non-jokers by rank
  const sortedNonJokers = [...nonJokers].sort(
    (a, b) => getRankIndex(a.rank as Rank) - getRankIndex(b.rank as Rank)
  );

  // Get the position of each non-joker in the sequence
  const positions: { rankIndex: number; position: number }[] = [];
  let pos = 0;
  for (const card of cards) {
    if (!card.isJoker) {
      positions.push({ rankIndex: getRankIndex(card.rank as Rank), position: pos });
    }
    pos++;
  }

  // Check that ranks are consecutive considering positions
  for (let i = 1; i < positions.length; i++) {
    const gap = positions[i].rankIndex - positions[i - 1].rankIndex;
    const posGap = positions[i].position - positions[i - 1].position;
    if (gap !== posGap) {
      return { valid: false, error: "Cards in sequence must be consecutive" };
    }
  }

  // Check bounds (A to K)
  const minRank = sortedNonJokers[0];
  const maxRank = sortedNonJokers[sortedNonJokers.length - 1];
  const minIdx = getRankIndex(minRank.rank as Rank);
  const maxIdx = getRankIndex(maxRank.rank as Rank);

  // Find the actual start position in the sequence for the min rank card
  const minRankPosition = positions.find((p) => p.rankIndex === minIdx)!.position;
  const impliedStart = minIdx - minRankPosition;

  // Find the actual end position
  const maxRankPosition = positions.find((p) => p.rankIndex === maxIdx)!.position;
  const impliedEnd = maxIdx + (cards.length - 1 - maxRankPosition);

  if (impliedStart < 0 || impliedEnd > 12) {
    return { valid: false, error: "Sequence goes out of bounds (A to K)" };
  }

  return { valid: true, points: calculateMeldPoints(cards) };
}

export function validateGroup(cards: Card[]): ValidationResult {
  if (cards.length < 3) {
    return { valid: false, error: "Group must have at least 3 cards" };
  }

  if (cards.length > 4) {
    return { valid: false, error: "Group cannot have more than 4 cards" };
  }

  const nonJokers = cards.filter((c) => !c.isJoker);
  const jokerCount = cards.length - nonJokers.length;

  if (nonJokers.length === 0) {
    return { valid: false, error: "Group cannot be all jokers" };
  }

  // Check joker limits
  if (cards.length === 3 && jokerCount > 1) {
    return { valid: false, error: "3-card group can have at most 1 joker" };
  }
  if (cards.length === 4 && jokerCount > 2) {
    return { valid: false, error: "4-card group can have at most 2 jokers" };
  }

  // All non-jokers must be same rank
  const ranks = new Set(nonJokers.map((c) => c.rank));
  if (ranks.size > 1) {
    return { valid: false, error: "All cards in a group must be the same rank" };
  }

  // All non-jokers must be different suits
  const suits = nonJokers.map((c) => c.suit);
  const uniqueSuits = new Set(suits);
  if (uniqueSuits.size !== suits.length) {
    return { valid: false, error: "All cards in a group must be different suits" };
  }

  return { valid: true, points: calculateMeldPoints(cards) };
}

export function validateMeld(cards: Card[]): ValidationResult & { type?: "sequence" | "group" } {
  // Try as sequence first
  const sequenceResult = validateSequence(cards);
  if (sequenceResult.valid) {
    return { ...sequenceResult, type: "sequence" };
  }

  // Try as group
  const groupResult = validateGroup(cards);
  if (groupResult.valid) {
    return { ...groupResult, type: "group" };
  }

  // Return more specific error
  return { valid: false, error: sequenceResult.error || groupResult.error };
}

export function isCleanSequence(cards: Card[]): boolean {
  const result = validateSequence(cards);
  if (!result.valid) return false;

  // Clean sequence has no jokers
  return !cards.some((c) => c.isJoker);
}

export function validateInitialMeld(melds: Card[][]): ValidationResult {
  // Must have at least one meld
  if (melds.length === 0) {
    return { valid: false, error: "Must lay down at least one meld" };
  }

  // Check each meld is valid
  let totalPoints = 0;
  let hasCleanSequence = false;

  for (const meldCards of melds) {
    const result = validateMeld(meldCards);
    if (!result.valid) {
      return { valid: false, error: result.error };
    }
    totalPoints += result.points || 0;

    if (result.type === "sequence" && isCleanSequence(meldCards)) {
      hasCleanSequence = true;
    }
  }

  // Must have at least 51 points
  if (totalPoints < INITIAL_MELD_THRESHOLD) {
    return {
      valid: false,
      error: `Initial meld requires at least ${INITIAL_MELD_THRESHOLD} points (you have ${totalPoints})`,
    };
  }

  // Must have at least one clean sequence
  if (!hasCleanSequence) {
    return {
      valid: false,
      error: "Initial meld must include at least one clean sequence (no jokers)",
    };
  }

  return { valid: true, points: totalPoints };
}

export function canAddToMeld(meld: Meld, card: Card): ValidationResult {
  const newCards = [...meld.cards, card];

  if (meld.type === "sequence") {
    // For sequence, card can be added at start or end
    const cardAtStart = [card, ...meld.cards];
    const cardAtEnd = [...meld.cards, card];

    const startResult = validateSequence(cardAtStart);
    const endResult = validateSequence(cardAtEnd);

    if (startResult.valid) return { valid: true };
    if (endResult.valid) return { valid: true };

    return { valid: false, error: "Card cannot be added to this sequence" };
  } else {
    // For group
    if (newCards.length > 4) {
      return { valid: false, error: "Group cannot have more than 4 cards" };
    }
    return validateGroup(newCards);
  }
}

export function canReplaceJoker(meld: Meld, jokerIndex: number, card: Card): ValidationResult {
  const joker = meld.cards[jokerIndex];
  if (!joker.isJoker) {
    return { valid: false, error: "Selected card is not a joker" };
  }

  if (card.isJoker) {
    return { valid: false, error: "Cannot replace joker with another joker" };
  }

  // Create new meld with card replacing joker
  const newCards = [...meld.cards];
  newCards[jokerIndex] = card;

  if (meld.type === "sequence") {
    return validateSequence(newCards);
  } else {
    return validateGroup(newCards);
  }
}

/**
 * Calculate total points of a player's pending melds
 */
export function calculatePendingMeldPoints(melds: Meld[], playerId: string): number {
  return melds
    .filter((m) => m.isPending && m.ownerId === playerId)
    .reduce((sum, m) => sum + calculateMeldPoints(m.cards), 0);
}

/**
 * Check if a player has at least one clean sequence among their pending melds
 */
export function hasPendingCleanSequence(melds: Meld[], playerId: string): boolean {
  return melds.some(
    (m) => m.isPending && m.ownerId === playerId && m.type === "sequence" && isCleanSequence(m.cards)
  );
}

/**
 * Check if a player's pending melds should be solidified (threshold+ points AND clean sequence)
 * @param threshold - The game's configured initial meld threshold (defaults to 51)
 */
export function shouldSolidifyMelds(
  melds: Meld[],
  playerId: string,
  threshold: number = INITIAL_MELD_THRESHOLD
): boolean {
  const points = calculatePendingMeldPoints(melds, playerId);
  const hasClean = hasPendingCleanSequence(melds, playerId);
  return points >= threshold && hasClean;
}

/**
 * Mark all of a player's pending melds as official (solidified)
 */
export function solidifyPlayerMelds(melds: Meld[], playerId: string): Meld[] {
  return melds.map((m) => {
    if (m.isPending && m.ownerId === playerId) {
      return { ...m, isPending: false };
    }
    return m;
  });
}
