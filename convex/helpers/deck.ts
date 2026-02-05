import { Card, Suit, Rank } from "../../lib/types";

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

export function createDeck(jokerCount: number = 2): Card[] {
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

  for (let i = 0; i < jokerCount; i++) {
    cards.push({
      id: `card-${id++}`,
      suit: "joker",
      rank: "joker",
      isJoker: true,
    });
  }

  return cards;
}

export function createMultipleDecks(deckCount: number, jokersPerDeck: number = 2): Card[] {
  const allCards: Card[] = [];
  for (let d = 0; d < deckCount; d++) {
    const deck = createDeck(jokersPerDeck);
    deck.forEach((card) => {
      allCards.push({
        ...card,
        id: `deck${d}-${card.id}`,
      });
    });
  }
  return allCards;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(
  deck: Card[],
  playerCount: number,
  cardsPerPlayer: number,
  dealerIndex: number
): { hands: Card[][]; remainingDeck: Card[] } {
  const shuffled = shuffleDeck(deck);
  const hands: Card[][] = Array.from({ length: playerCount }, () => []);
  let cardIndex = 0;

  // Deal cards to each player
  for (let i = 0; i < cardsPerPlayer; i++) {
    for (let p = 0; p < playerCount; p++) {
      if (cardIndex < shuffled.length) {
        hands[p].push(shuffled[cardIndex++]);
      }
    }
  }

  // Dealer gets one extra card
  if (cardIndex < shuffled.length) {
    hands[dealerIndex].push(shuffled[cardIndex++]);
  }

  return {
    hands,
    remainingDeck: shuffled.slice(cardIndex),
  };
}
