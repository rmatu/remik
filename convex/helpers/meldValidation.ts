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

// Get rank index with Ace-high option (Ace = 13 instead of 0)
function getRankIndexAceHigh(rank: Rank | "joker", aceHigh: boolean): number {
  if (rank === "joker") return -1;
  if (rank === "A" && aceHigh) return 13; // Ace after King
  return RANKS.indexOf(rank);
}

export function calculateCardPoints(card: Card): number {
  return RANK_VALUES[card.rank];
}

export function calculateMeldPoints(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + calculateCardPoints(card), 0);
}

/**
 * Validates if the current DISPLAY ORDER of cards is a valid sequence representation.
 * Unlike validateSequence which auto-sorts, this checks if the given order is correct.
 *
 * For example:
 * - [6♥, 7♥, Joker] → Valid (Joker represents 8♥)
 * - [Joker, 6♥, 7♥] → Valid (Joker represents 5♥)
 * - [6♥, Joker, 7♥] → INVALID (no gap between 6 and 7 for joker)
 */
export function validateSequenceOrder(cards: Card[]): ValidationResult {
  if (cards.length < 3) {
    return { valid: false, error: "Sequence must have at least 3 cards" };
  }

  const nonJokers = cards.filter((c) => !c.isJoker);

  if (nonJokers.length === 0) {
    return { valid: false, error: "Sequence cannot be all jokers" };
  }

  // All non-jokers must be same suit
  const suits = new Set(nonJokers.map((c) => c.suit));
  if (suits.size > 1) {
    return { valid: false, error: "All cards in a sequence must be the same suit" };
  }

  // Track expected rank as we traverse in display order
  let expectedRankIdx: number | null = null;
  let jokerStreak = 0;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];

    if (card.isJoker) {
      jokerStreak++;
      if (jokerStreak > 1) {
        return { valid: false, error: "Cannot have two adjacent jokers in a sequence" };
      }
      // If we know the expected rank, increment it for next card
      if (expectedRankIdx !== null) {
        expectedRankIdx++;
        if (expectedRankIdx > 12) {
          return { valid: false, error: "Sequence goes out of bounds (above K)" };
        }
      }
    } else {
      jokerStreak = 0;
      const cardRankIdx = getRankIndex(card.rank as Rank);

      if (expectedRankIdx === null) {
        // First non-joker card - set expected rank
        // Account for any leading jokers
        const leadingJokers = i;
        expectedRankIdx = cardRankIdx;

        // Check if leading jokers would go below A
        if (cardRankIdx - leadingJokers < 0) {
          return { valid: false, error: "Sequence goes out of bounds (below A)" };
        }
      } else {
        // Check if this card matches expected rank
        if (cardRankIdx !== expectedRankIdx) {
          return {
            valid: false,
            error: `Invalid joker position: expected ${RANKS[expectedRankIdx]}, got ${card.rank}`
          };
        }
      }
      expectedRankIdx = cardRankIdx + 1;
    }
  }

  return { valid: true, points: calculateMeldPoints(cards) };
}

// Helper to validate sequence with specific Ace mode
function validateSequenceWithAceMode(
  cards: Card[],
  aceHigh: boolean
): ValidationResult & { sortedCards?: Card[] } {
  const nonJokers = cards.filter((c) => !c.isJoker);
  const jokers = cards.filter((c) => c.isJoker);
  const jokerCount = jokers.length;

  // Sort non-jokers by rank (with ace-high option)
  const sortedNonJokers = [...nonJokers].sort(
    (a, b) => getRankIndexAceHigh(a.rank as Rank, aceHigh) - getRankIndexAceHigh(b.rank as Rank, aceHigh)
  );

  // Check for gaps and determine where jokers should go
  const sortedCards: Card[] = [];
  let jokersUsed = 0;

  for (let i = 0; i < sortedNonJokers.length; i++) {
    const card = sortedNonJokers[i];

    if (i > 0) {
      const prevCard = sortedNonJokers[i - 1];
      const gap = getRankIndexAceHigh(card.rank as Rank, aceHigh) - getRankIndexAceHigh(prevCard.rank as Rank, aceHigh) - 1;

      if (gap > 0) {
        // Need jokers to fill the gap
        if (jokersUsed + gap > jokerCount) {
          return { valid: false, error: "Cards in sequence must be consecutive (not enough jokers to fill gaps)" };
        }
        // Check for adjacent jokers (gap > 1 means adjacent jokers would be needed)
        if (gap > 1) {
          return { valid: false, error: "Cannot have two adjacent jokers in a sequence" };
        }
        // Add joker(s) to fill the gap
        for (let j = 0; j < gap; j++) {
          sortedCards.push(jokers[jokersUsed]);
          jokersUsed++;
        }
      }
    }

    sortedCards.push(card);
  }

  // Add any remaining jokers at the start or end
  const remainingJokers = jokerCount - jokersUsed;
  if (remainingJokers > 0) {
    const firstRankIdx = getRankIndexAceHigh(sortedNonJokers[0].rank as Rank, aceHigh);
    const lastRankIdx = getRankIndexAceHigh(sortedNonJokers[sortedNonJokers.length - 1].rank as Rank, aceHigh);

    // Determine bounds (with ace-high, max is 13; with ace-low, max is 12)
    const maxRankIdx = aceHigh ? 13 : 12;
    const minRankIdx = aceHigh ? 1 : 0; // With ace-high, min is 2 (index 1); with ace-low, min is A (index 0)

    const canAddAtStart = firstRankIdx - minRankIdx;
    const canAddAtEnd = maxRankIdx - lastRankIdx;

    // Distribute remaining jokers (prefer end, but respect bounds and no adjacent jokers)
    let jokersAtStart = 0;
    let jokersAtEnd = remainingJokers;

    // If we can't fit all at end, put some at start
    if (jokersAtEnd > canAddAtEnd) {
      jokersAtStart = Math.min(jokersAtEnd - canAddAtEnd, canAddAtStart);
      jokersAtEnd = remainingJokers - jokersAtStart;
    }

    // Check bounds
    if (jokersAtStart > canAddAtStart || jokersAtEnd > canAddAtEnd) {
      return { valid: false, error: "Sequence goes out of bounds" };
    }

    // Check for adjacent jokers at boundaries
    if (jokersAtStart > 1 || jokersAtEnd > 1) {
      return { valid: false, error: "Cannot have two adjacent jokers in a sequence" };
    }

    // Insert jokers at start
    for (let j = 0; j < jokersAtStart; j++) {
      sortedCards.unshift(jokers[jokersUsed + j]);
    }

    // Add jokers at end
    for (let j = 0; j < jokersAtEnd; j++) {
      sortedCards.push(jokers[jokersUsed + jokersAtStart + j]);
    }
  }

  return { valid: true, points: calculateMeldPoints(cards), sortedCards };
}

export function validateSequence(cards: Card[]): ValidationResult & { sortedCards?: Card[] } {
  if (cards.length < 3) {
    return { valid: false, error: "Sequence must have at least 3 cards" };
  }

  const nonJokers = cards.filter((c) => !c.isJoker);

  if (nonJokers.length === 0) {
    return { valid: false, error: "Sequence cannot be all jokers" };
  }

  // All non-jokers must be same suit
  const suits = new Set(nonJokers.map((c) => c.suit));
  if (suits.size > 1) {
    return { valid: false, error: "All cards in a sequence must be the same suit" };
  }

  // Check if sequence contains both Ace and King (potential ace-high sequence)
  const hasAce = nonJokers.some((c) => c.rank === "A");
  const hasKing = nonJokers.some((c) => c.rank === "K");
  const has2 = nonJokers.some((c) => c.rank === "2");

  // Try ace-high if we have K and A but not 2 (or try both and pick valid one)
  if (hasAce && hasKing && !has2) {
    // This looks like an ace-high sequence (e.g., Q-K-A)
    const aceHighResult = validateSequenceWithAceMode(cards, true);
    if (aceHighResult.valid) return aceHighResult;
  }

  // Try ace-low (normal)
  const aceLowResult = validateSequenceWithAceMode(cards, false);
  if (aceLowResult.valid) return aceLowResult;

  // If ace-low failed and we have an Ace, try ace-high as fallback
  if (hasAce) {
    const aceHighResult = validateSequenceWithAceMode(cards, true);
    if (aceHighResult.valid) return aceHighResult;
  }

  return { valid: false, error: "Cards in sequence must be consecutive" };
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

export function validateMeld(cards: Card[]): ValidationResult & { type?: "sequence" | "group"; sortedCards?: Card[] } {
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
