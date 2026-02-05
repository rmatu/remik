import { Card, Suit, Rank } from "./types";
import { RANKS, SUITS } from "./constants";

export function createDeck(includeJokers = true): Card[] {
  const cards: Card[] = [];
  let id = 0;

  for (const suit of SUITS) {
    for (const rank of RANKS) {
      cards.push({
        id: `card-${id++}`,
        suit,
        rank,
        isJoker: false,
      });
    }
  }

  if (includeJokers) {
    cards.push({
      id: `card-${id++}`,
      suit: "joker",
      rank: "joker",
      isJoker: true,
    });
    cards.push({
      id: `card-${id++}`,
      suit: "joker",
      rank: "joker",
      isJoker: true,
    });
  }

  return cards;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getRankIndex(rank: Rank | "joker"): number {
  if (rank === "joker") return -1;
  return RANKS.indexOf(rank);
}

export function getSuitIndex(suit: Suit | "joker"): number {
  if (suit === "joker") return -1;
  return SUITS.indexOf(suit);
}

export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    if (a.isJoker && !b.isJoker) return 1;
    if (!a.isJoker && b.isJoker) return -1;
    if (a.isJoker && b.isJoker) return 0;

    const suitDiff = getSuitIndex(a.suit) - getSuitIndex(b.suit);
    if (suitDiff !== 0) return suitDiff;

    return getRankIndex(a.rank as Rank) - getRankIndex(b.rank as Rank);
  });
}

export function getCardKey(card: Card): string {
  return card.isJoker ? `joker-${card.id}` : `${card.suit}-${card.rank}`;
}

export function formatCard(card: Card): string {
  if (card.isJoker) return "Joker";

  const suitSymbols: Record<Suit, string> = {
    hearts: "\u2665",
    diamonds: "\u2666",
    clubs: "\u2663",
    spades: "\u2660",
  };

  return `${card.rank}${suitSymbols[card.suit as Suit]}`;
}
