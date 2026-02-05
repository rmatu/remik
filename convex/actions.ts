import { v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  validateMeld,
  validateInitialMeld,
  canAddToMeld,
  canReplaceJoker,
  calculateCardPoints,
} from "./helpers/meldValidation";
import { Card } from "../lib/types";

const cardValidator = v.object({
  id: v.string(),
  suit: v.union(
    v.literal("hearts"),
    v.literal("diamonds"),
    v.literal("clubs"),
    v.literal("spades"),
    v.literal("joker")
  ),
  rank: v.union(
    v.literal("A"),
    v.literal("2"),
    v.literal("3"),
    v.literal("4"),
    v.literal("5"),
    v.literal("6"),
    v.literal("7"),
    v.literal("8"),
    v.literal("9"),
    v.literal("10"),
    v.literal("J"),
    v.literal("Q"),
    v.literal("K"),
    v.literal("joker")
  ),
  isJoker: v.boolean(),
});

export const drawFromStock = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    if (game.status !== "playing") {
      throw new Error("Game is not in progress");
    }

    if (game.currentTurnPlayerId !== args.playerId) {
      throw new Error("It's not your turn");
    }

    if (game.turnPhase !== "draw") {
      throw new Error("You can only draw at the start of your turn");
    }

    if (game.stockPile.length === 0) {
      // Reshuffle discard pile (except top card) into stock
      if (game.discardPile.length <= 1) {
        throw new Error("No cards to draw");
      }
      const topDiscard = game.discardPile[game.discardPile.length - 1];
      const reshuffled = [...game.discardPile.slice(0, -1)];
      for (let i = reshuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [reshuffled[i], reshuffled[j]] = [reshuffled[j], reshuffled[i]];
      }

      const drawnCard = reshuffled.pop()!;
      const playerIndex = game.players.findIndex((p) => p.playerId === args.playerId);
      const updatedPlayers = [...game.players];
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        hand: [...updatedPlayers[playerIndex].hand, drawnCard],
      };

      await ctx.db.patch(args.gameId, {
        stockPile: reshuffled,
        discardPile: [topDiscard],
        players: updatedPlayers,
        turnPhase: "play",
        lastActionAt: Date.now(),
      });
    } else {
      const newStock = [...game.stockPile];
      const drawnCard = newStock.pop()!;

      const playerIndex = game.players.findIndex((p) => p.playerId === args.playerId);
      const updatedPlayers = [...game.players];
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        hand: [...updatedPlayers[playerIndex].hand, drawnCard],
      };

      await ctx.db.patch(args.gameId, {
        stockPile: newStock,
        players: updatedPlayers,
        turnPhase: "play",
        lastActionAt: Date.now(),
      });
    }
  },
});

export const drawFromDiscard = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    if (game.status !== "playing") {
      throw new Error("Game is not in progress");
    }

    if (game.currentTurnPlayerId !== args.playerId) {
      throw new Error("It's not your turn");
    }

    if (game.turnPhase !== "draw") {
      throw new Error("You can only draw at the start of your turn");
    }

    if (game.discardPile.length === 0) {
      throw new Error("Discard pile is empty");
    }

    const newDiscard = [...game.discardPile];
    const drawnCard = newDiscard.pop()!;

    const playerIndex = game.players.findIndex((p) => p.playerId === args.playerId);
    const updatedPlayers = [...game.players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      hand: [...updatedPlayers[playerIndex].hand, drawnCard],
    };

    await ctx.db.patch(args.gameId, {
      discardPile: newDiscard,
      players: updatedPlayers,
      turnPhase: "play",
      lastActionAt: Date.now(),
    });
  },
});

export const discardCard = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    cardId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    if (game.status !== "playing") {
      throw new Error("Game is not in progress");
    }

    if (game.currentTurnPlayerId !== args.playerId) {
      throw new Error("It's not your turn");
    }

    if (game.turnPhase !== "play" && game.turnPhase !== "discard") {
      throw new Error("You must draw before discarding");
    }

    const playerIndex = game.players.findIndex((p) => p.playerId === args.playerId);
    const player = game.players[playerIndex];
    const cardIndex = player.hand.findIndex((c) => c.id === args.cardId);

    if (cardIndex === -1) {
      throw new Error("Card not in your hand");
    }

    const discardedCard = player.hand[cardIndex];
    const newHand = [...player.hand];
    newHand.splice(cardIndex, 1);

    const updatedPlayers = [...game.players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      hand: newHand,
    };

    // Check for win (empty hand)
    if (newHand.length === 0) {
      // Calculate penalty points for all other players
      const finalPlayers = updatedPlayers.map((p, i) => {
        if (i === playerIndex) return p;
        const penaltyPoints = p.hand.reduce(
          (sum, card) => sum + calculateCardPoints(card),
          0
        );
        return {
          ...p,
          score: p.score + penaltyPoints,
        };
      });

      await ctx.db.patch(args.gameId, {
        discardPile: [...game.discardPile, discardedCard],
        players: finalPlayers,
        status: "round_end",
        lastActionAt: Date.now(),
      });
      return;
    }

    // Move to next player
    const nextPlayerIndex = (playerIndex + 1) % game.players.length;
    const nextPlayerId = game.players[nextPlayerIndex].playerId;

    await ctx.db.patch(args.gameId, {
      discardPile: [...game.discardPile, discardedCard],
      players: updatedPlayers,
      currentTurnPlayerId: nextPlayerId,
      turnPhase: "draw",
      lastActionAt: Date.now(),
    });
  },
});

export const layDownMeld = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    cardIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    if (game.status !== "playing") {
      throw new Error("Game is not in progress");
    }

    if (game.currentTurnPlayerId !== args.playerId) {
      throw new Error("It's not your turn");
    }

    if (game.turnPhase !== "play") {
      throw new Error("You must draw first");
    }

    const playerIndex = game.players.findIndex((p) => p.playerId === args.playerId);
    const player = game.players[playerIndex];

    // Find the cards in player's hand
    const meldCards: Card[] = [];
    for (const cardId of args.cardIds) {
      const card = player.hand.find((c) => c.id === cardId);
      if (!card) {
        throw new Error("Card not in your hand");
      }
      meldCards.push(card);
    }

    // If this is player's first meld, validate initial meld requirements
    if (!player.hasLaidInitialMeld) {
      const initialResult = validateInitialMeld([meldCards]);
      if (!initialResult.valid) {
        throw new Error(initialResult.error || "Invalid initial meld");
      }
    } else {
      // Validate as regular meld
      const result = validateMeld(meldCards);
      if (!result.valid) {
        throw new Error(result.error || "Invalid meld");
      }
    }

    // Validate the meld
    const result = validateMeld(meldCards);
    if (!result.valid) {
      throw new Error(result.error || "Invalid meld");
    }

    // Remove cards from hand
    const newHand = player.hand.filter((c) => !args.cardIds.includes(c.id));

    const updatedPlayers = [...game.players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      hand: newHand,
      hasLaidInitialMeld: true,
    };

    // Add meld to table
    const newMeld = {
      id: `meld-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: result.type!,
      cards: meldCards,
    };

    await ctx.db.patch(args.gameId, {
      players: updatedPlayers,
      tableMelds: [...game.tableMelds, newMeld],
      lastActionAt: Date.now(),
    });
  },
});

export const layDownInitialMelds = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    melds: v.array(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    if (game.status !== "playing") {
      throw new Error("Game is not in progress");
    }

    if (game.currentTurnPlayerId !== args.playerId) {
      throw new Error("It's not your turn");
    }

    if (game.turnPhase !== "play") {
      throw new Error("You must draw first");
    }

    const playerIndex = game.players.findIndex((p) => p.playerId === args.playerId);
    const player = game.players[playerIndex];

    if (player.hasLaidInitialMeld) {
      throw new Error("You have already laid down your initial meld");
    }

    // Collect all cards for initial meld validation
    const allMeldCards: Card[][] = [];
    const allCardIds: string[] = [];

    for (const cardIds of args.melds) {
      const meldCards: Card[] = [];
      for (const cardId of cardIds) {
        if (allCardIds.includes(cardId)) {
          throw new Error("Cannot use the same card in multiple melds");
        }
        const card = player.hand.find((c) => c.id === cardId);
        if (!card) {
          throw new Error("Card not in your hand");
        }
        meldCards.push(card);
        allCardIds.push(cardId);
      }
      allMeldCards.push(meldCards);
    }

    // Validate initial meld requirements
    const initialResult = validateInitialMeld(allMeldCards);
    if (!initialResult.valid) {
      throw new Error(initialResult.error || "Invalid initial meld");
    }

    // Validate each meld individually and create them
    const newMelds: Array<{ id: string; type: "sequence" | "group"; cards: Card[] }> = [];
    for (const meldCards of allMeldCards) {
      const result = validateMeld(meldCards);
      if (!result.valid) {
        throw new Error(result.error || "Invalid meld");
      }
      newMelds.push({
        id: `meld-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: result.type!,
        cards: meldCards,
      });
    }

    // Remove cards from hand
    const newHand = player.hand.filter((c) => !allCardIds.includes(c.id));

    const updatedPlayers = [...game.players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      hand: newHand,
      hasLaidInitialMeld: true,
    };

    await ctx.db.patch(args.gameId, {
      players: updatedPlayers,
      tableMelds: [...game.tableMelds, ...newMelds],
      lastActionAt: Date.now(),
    });
  },
});

export const addToMeld = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    meldId: v.string(),
    cardId: v.string(),
    position: v.optional(v.union(v.literal("start"), v.literal("end"))),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    if (game.status !== "playing") {
      throw new Error("Game is not in progress");
    }

    if (game.currentTurnPlayerId !== args.playerId) {
      throw new Error("It's not your turn");
    }

    if (game.turnPhase !== "play") {
      throw new Error("You must draw first");
    }

    const playerIndex = game.players.findIndex((p) => p.playerId === args.playerId);
    const player = game.players[playerIndex];

    if (!player.hasLaidInitialMeld) {
      throw new Error("You must lay down your initial meld first");
    }

    // Find the card in player's hand
    const card = player.hand.find((c) => c.id === args.cardId);
    if (!card) {
      throw new Error("Card not in your hand");
    }

    // Find the meld on the table
    const meldIndex = game.tableMelds.findIndex((m) => m.id === args.meldId);
    if (meldIndex === -1) {
      throw new Error("Meld not found");
    }

    const meld = game.tableMelds[meldIndex];

    // Validate adding to meld
    const result = canAddToMeld(meld, card);
    if (!result.valid) {
      throw new Error(result.error || "Cannot add card to this meld");
    }

    // Determine where to add the card for sequences
    let newMeldCards: Card[];
    if (meld.type === "sequence") {
      // Try both positions and use the valid one
      const atStart = [card, ...meld.cards];
      const atEnd = [...meld.cards, card];

      if (args.position === "start") {
        newMeldCards = atStart;
      } else if (args.position === "end") {
        newMeldCards = atEnd;
      } else {
        // Auto-detect
        const startValid = validateMeld(atStart).valid;
        newMeldCards = startValid ? atStart : atEnd;
      }
    } else {
      newMeldCards = [...meld.cards, card];
    }

    // Update meld
    const updatedMelds = [...game.tableMelds];
    updatedMelds[meldIndex] = {
      ...meld,
      cards: newMeldCards,
    };

    // Remove card from hand
    const newHand = player.hand.filter((c) => c.id !== args.cardId);
    const updatedPlayers = [...game.players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      hand: newHand,
    };

    await ctx.db.patch(args.gameId, {
      players: updatedPlayers,
      tableMelds: updatedMelds,
      lastActionAt: Date.now(),
    });
  },
});

export const replaceJoker = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    meldId: v.string(),
    jokerCardId: v.string(),
    replacementCardId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) throw new Error("Game not found");

    if (game.status !== "playing") {
      throw new Error("Game is not in progress");
    }

    if (game.currentTurnPlayerId !== args.playerId) {
      throw new Error("It's not your turn");
    }

    if (game.turnPhase !== "play") {
      throw new Error("You must draw first");
    }

    const playerIndex = game.players.findIndex((p) => p.playerId === args.playerId);
    const player = game.players[playerIndex];

    if (!player.hasLaidInitialMeld) {
      throw new Error("You must lay down your initial meld first");
    }

    // Find the replacement card in player's hand
    const replacementCard = player.hand.find((c) => c.id === args.replacementCardId);
    if (!replacementCard) {
      throw new Error("Replacement card not in your hand");
    }

    // Find the meld
    const meldIndex = game.tableMelds.findIndex((m) => m.id === args.meldId);
    if (meldIndex === -1) {
      throw new Error("Meld not found");
    }

    const meld = game.tableMelds[meldIndex];

    // Find the joker in the meld
    const jokerIndex = meld.cards.findIndex((c) => c.id === args.jokerCardId);
    if (jokerIndex === -1) {
      throw new Error("Joker not found in meld");
    }

    // Validate the replacement
    const result = canReplaceJoker(meld, jokerIndex, replacementCard);
    if (!result.valid) {
      throw new Error(result.error || "Cannot replace joker with this card");
    }

    // Get the joker
    const joker = meld.cards[jokerIndex];

    // Update meld with replacement
    const newMeldCards = [...meld.cards];
    newMeldCards[jokerIndex] = replacementCard;

    const updatedMelds = [...game.tableMelds];
    updatedMelds[meldIndex] = {
      ...meld,
      cards: newMeldCards,
    };

    // Update player's hand: remove replacement card, add joker
    const newHand = player.hand.filter((c) => c.id !== args.replacementCardId);
    newHand.push(joker);

    const updatedPlayers = [...game.players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      hand: newHand,
    };

    await ctx.db.patch(args.gameId, {
      players: updatedPlayers,
      tableMelds: updatedMelds,
      lastActionAt: Date.now(),
    });
  },
});

function validateMeldHelper(cards: Card[]) {
  return validateMeld(cards);
}
