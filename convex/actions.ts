import { v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  validateMeld,
  canAddToMeld,
  canReplaceJoker,
  calculateCardPoints,
  shouldSolidifyMelds,
  solidifyPlayerMelds,
  getRankIndex,
} from "./helpers/meldValidation";
import { Card, Rank } from "../lib/types";

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
      const player = game.players[playerIndex];
      const newHand = [...player.hand, drawnCard];
      const updatedPlayers = [...game.players];
      updatedPlayers[playerIndex] = {
        ...player,
        hand: newHand,
      };

      // Save snapshot for undo functionality
      const turnStartSnapshot = {
        playerHand: newHand,
        tableMelds: game.tableMelds,
        hasLaidInitialMeld: player.hasLaidInitialMeld,
      };

      await ctx.db.patch(args.gameId, {
        stockPile: reshuffled,
        discardPile: [topDiscard],
        players: updatedPlayers,
        turnPhase: "play",
        turnStartSnapshot,
        lastActionAt: Date.now(),
      });
    } else {
      const newStock = [...game.stockPile];
      const drawnCard = newStock.pop()!;

      const playerIndex = game.players.findIndex((p) => p.playerId === args.playerId);
      const player = game.players[playerIndex];
      const newHand = [...player.hand, drawnCard];
      const updatedPlayers = [...game.players];
      updatedPlayers[playerIndex] = {
        ...player,
        hand: newHand,
      };

      // Save snapshot for undo functionality
      const turnStartSnapshot = {
        playerHand: newHand,
        tableMelds: game.tableMelds,
        hasLaidInitialMeld: player.hasLaidInitialMeld,
      };

      await ctx.db.patch(args.gameId, {
        stockPile: newStock,
        players: updatedPlayers,
        turnPhase: "play",
        turnStartSnapshot,
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
    const player = game.players[playerIndex];
    const newHand = [...player.hand, drawnCard];
    const updatedPlayers = [...game.players];
    updatedPlayers[playerIndex] = {
      ...player,
      hand: newHand,
    };

    // Save snapshot for undo functionality
    const turnStartSnapshot = {
      playerHand: newHand,
      tableMelds: game.tableMelds,
      hasLaidInitialMeld: player.hasLaidInitialMeld,
    };

    await ctx.db.patch(args.gameId, {
      discardPile: newDiscard,
      players: updatedPlayers,
      turnPhase: "play",
      turnStartSnapshot,
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

    // Validate the meld
    const result = validateMeld(meldCards);
    if (!result.valid) {
      throw new Error(result.error || "Invalid meld");
    }

    // Use sorted cards if available (for sequences), otherwise use original order
    const finalMeldCards = result.sortedCards || meldCards;

    // Remove cards from hand
    const newHand = player.hand.filter((c) => !args.cardIds.includes(c.id));

    // Create meld with pending status if player hasn't solidified yet
    const newMeld = {
      id: `meld-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: result.type!,
      cards: finalMeldCards,
      ownerId: player.hasLaidInitialMeld ? undefined : args.playerId.toString(),
      isPending: player.hasLaidInitialMeld ? undefined : true,
    };

    let updatedMelds = [...game.tableMelds, newMeld];

    // Check if player should solidify their melds
    let shouldSolidify = false;
    if (!player.hasLaidInitialMeld) {
      const threshold = game.initialMeldPoints ?? 30;
      shouldSolidify = shouldSolidifyMelds(updatedMelds, args.playerId.toString(), threshold);
      if (shouldSolidify) {
        updatedMelds = solidifyPlayerMelds(updatedMelds, args.playerId.toString());
      }
    }

    const updatedPlayers = [...game.players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      hand: newHand,
      hasLaidInitialMeld: player.hasLaidInitialMeld || shouldSolidify,
    };

    await ctx.db.patch(args.gameId, {
      players: updatedPlayers,
      tableMelds: updatedMelds,
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

    // Collect all cards for meld validation
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

    // Validate each meld individually and create them as pending
    const newMelds: Array<{
      id: string;
      type: "sequence" | "group";
      cards: Card[];
      ownerId: string;
      isPending: boolean;
    }> = [];
    for (const meldCards of allMeldCards) {
      const result = validateMeld(meldCards);
      if (!result.valid) {
        throw new Error(result.error || "Invalid meld");
      }
      // Use sorted cards if available (for sequences), otherwise use original order
      const finalMeldCards = result.sortedCards || meldCards;
      newMelds.push({
        id: `meld-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        type: result.type!,
        cards: finalMeldCards,
        ownerId: args.playerId.toString(),
        isPending: true,
      });
    }

    // Remove cards from hand
    const newHand = player.hand.filter((c) => !allCardIds.includes(c.id));

    // Check if these melds meet the threshold for solidification
    let updatedMelds = [...game.tableMelds, ...newMelds];
    const threshold = game.initialMeldPoints ?? 30;
    const shouldSolidify = shouldSolidifyMelds(updatedMelds, args.playerId.toString(), threshold);
    if (shouldSolidify) {
      updatedMelds = solidifyPlayerMelds(updatedMelds, args.playerId.toString());
    }

    const updatedPlayers = [...game.players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      hand: newHand,
      hasLaidInitialMeld: shouldSolidify,
    };

    await ctx.db.patch(args.gameId, {
      players: updatedPlayers,
      tableMelds: updatedMelds,
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

    // Check pending meld restrictions
    if (meld.isPending) {
      // Can only add to your own pending melds
      if (meld.ownerId !== args.playerId.toString()) {
        throw new Error("Cannot add to another player's pending meld");
      }
    } else {
      // Official melds require player to have solidified
      if (!player.hasLaidInitialMeld) {
        throw new Error("You must reach 51 points with a clean sequence before adding to official melds");
      }
    }

    // Validate adding to meld
    const result = canAddToMeld(meld, card);
    if (!result.valid) {
      throw new Error(result.error || "Cannot add card to this meld");
    }

    // Determine where to add the card for sequences
    let newMeldCards: Card[];
    if (meld.type === "sequence") {
      if (args.position === "start") {
        newMeldCards = [card, ...meld.cards];
      } else if (args.position === "end") {
        newMeldCards = [...meld.cards, card];
      } else {
        // Auto-detect based on rank comparison
        // For sequences, compare the card's rank to the first and last cards
        const firstCard = meld.cards[0];
        const lastCard = meld.cards[meld.cards.length - 1];

        if (card.isJoker) {
          // For jokers, check which position is valid
          const atStart = [card, ...meld.cards];
          const atEnd = [...meld.cards, card];
          // Prefer end position for jokers, unless start is the only valid option
          const endValid = validateMeld(atEnd).valid;
          newMeldCards = endValid ? atEnd : atStart;
        } else {
          // For regular cards, determine position by rank
          const cardRank = getRankIndex(card.rank as Rank);

          // Find first and last non-joker cards to compare
          const firstNonJoker = meld.cards.find((c) => !c.isJoker);
          const lastNonJoker = [...meld.cards].reverse().find((c) => !c.isJoker);

          if (firstNonJoker && lastNonJoker) {
            const firstRank = getRankIndex(firstNonJoker.rank as Rank);
            const lastRank = getRankIndex(lastNonJoker.rank as Rank);

            // Special case: Ace can be high (after King) or low (before 2)
            if (card.rank === "A") {
              // If sequence ends with King, Ace goes at end (Ace-high)
              // If sequence starts with 2, Ace goes at start (Ace-low)
              if (lastNonJoker.rank === "K") {
                newMeldCards = [...meld.cards, card];
              } else {
                newMeldCards = [card, ...meld.cards];
              }
            } else if (cardRank < firstRank) {
              // Add at start if card rank is lower
              newMeldCards = [card, ...meld.cards];
            } else {
              // Add at end
              newMeldCards = [...meld.cards, card];
            }
          } else {
            // Fallback: add at end
            newMeldCards = [...meld.cards, card];
          }
        }
      }
    } else {
      newMeldCards = [...meld.cards, card];
    }

    // Update meld
    let updatedMelds = [...game.tableMelds];
    updatedMelds[meldIndex] = {
      ...meld,
      cards: newMeldCards,
    };

    // Check if player should solidify their melds after adding to their own pending meld
    let shouldSolidify = false;
    if (!player.hasLaidInitialMeld && meld.isPending && meld.ownerId === args.playerId.toString()) {
      const threshold = game.initialMeldPoints ?? 30;
      shouldSolidify = shouldSolidifyMelds(updatedMelds, args.playerId.toString(), threshold);
      if (shouldSolidify) {
        updatedMelds = solidifyPlayerMelds(updatedMelds, args.playerId.toString());
      }
    }

    // Remove card from hand
    const newHand = player.hand.filter((c) => c.id !== args.cardId);
    const updatedPlayers = [...game.players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      hand: newHand,
      hasLaidInitialMeld: player.hasLaidInitialMeld || shouldSolidify,
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

    // Check pending meld restrictions
    if (meld.isPending) {
      // Can only replace jokers in your own pending melds
      if (meld.ownerId !== args.playerId.toString()) {
        throw new Error("Cannot replace jokers in another player's pending meld");
      }
    } else {
      // Official melds require player to have solidified
      if (!player.hasLaidInitialMeld) {
        throw new Error("You must reach 51 points with a clean sequence before replacing jokers in official melds");
      }
    }

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

export const takeBackPendingMeld = mutation({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
    meldId: v.string(),
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
      throw new Error("You can only take back melds during the play phase");
    }

    const playerIndex = game.players.findIndex((p) => p.playerId === args.playerId);
    const player = game.players[playerIndex];

    // Find the meld
    const meldIndex = game.tableMelds.findIndex((m) => m.id === args.meldId);
    if (meldIndex === -1) {
      throw new Error("Meld not found");
    }

    const meld = game.tableMelds[meldIndex];

    // Can only take back pending melds
    if (!meld.isPending) {
      throw new Error("Cannot take back solidified melds");
    }

    // Can only take back your own melds
    if (meld.ownerId !== args.playerId.toString()) {
      throw new Error("Cannot take back another player's meld");
    }

    // Return cards to hand
    const newHand = [...player.hand, ...meld.cards];

    // Remove meld from table
    const updatedMelds = game.tableMelds.filter((m) => m.id !== args.meldId);

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

export const resetTurn = mutation({
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

    if (game.turnPhase !== "play") {
      throw new Error("Can only reset during play phase");
    }

    if (!game.turnStartSnapshot) {
      throw new Error("No snapshot available to reset to");
    }

    const playerIndex = game.players.findIndex((p) => p.playerId === args.playerId);
    if (playerIndex === -1) {
      throw new Error("Player not found in game");
    }

    // Restore the snapshot
    const updatedPlayers = [...game.players];
    updatedPlayers[playerIndex] = {
      ...updatedPlayers[playerIndex],
      hand: game.turnStartSnapshot.playerHand,
      hasLaidInitialMeld: game.turnStartSnapshot.hasLaidInitialMeld,
    };

    await ctx.db.patch(args.gameId, {
      players: updatedPlayers,
      tableMelds: game.turnStartSnapshot.tableMelds,
      lastActionAt: Date.now(),
    });
  },
});

function validateMeldHelper(cards: Card[]) {
  return validateMeld(cards);
}
