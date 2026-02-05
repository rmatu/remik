import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { createMultipleDecks, dealCards } from "./helpers/deck";
import { calculatePendingMeldPoints, hasPendingCleanSequence } from "./helpers/meldValidation";

const GAME_CODE_LENGTH = 6;
const GAME_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CARDS_PER_PLAYER = 13;
const DEFAULT_TARGET_SCORE = 300;
const DEFAULT_INITIAL_MELD_POINTS = 51;
const DEFAULT_JOKERS_PER_DECK = 2;

function generateGameCode(): string {
  let code = "";
  for (let i = 0; i < GAME_CODE_LENGTH; i++) {
    code += GAME_CODE_CHARS[Math.floor(Math.random() * GAME_CODE_CHARS.length)];
  }
  return code;
}

export const createGame = mutation({
  args: {
    playerId: v.id("players"),
    name: v.string(),
    maxPlayers: v.union(v.literal(2), v.literal(3), v.literal(4)),
    deckCount: v.optional(v.union(v.literal(1), v.literal(2))),
    jokersPerDeck: v.optional(v.union(v.literal(0), v.literal(2), v.literal(4))),
    initialMeldPoints: v.optional(v.number()),
    targetScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) {
      throw new Error("Player not found");
    }

    // Generate unique code
    let code = generateGameCode();
    let existingGame = await ctx.db
      .query("games")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    while (existingGame) {
      code = generateGameCode();
      existingGame = await ctx.db
        .query("games")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
    }

    // Default deck count based on player count, but allow override
    const defaultDeckCount = args.maxPlayers === 2 ? 1 : 2;
    const deckCount = args.deckCount ?? defaultDeckCount;

    const gameId = await ctx.db.insert("games", {
      code,
      name: args.name,
      maxPlayers: args.maxPlayers,
      deckCount: deckCount as 1 | 2,
      jokersPerDeck: args.jokersPerDeck ?? DEFAULT_JOKERS_PER_DECK,
      initialMeldPoints: args.initialMeldPoints ?? DEFAULT_INITIAL_MELD_POINTS,
      targetScore: args.targetScore ?? DEFAULT_TARGET_SCORE,
      status: "waiting",
      players: [
        {
          playerId: args.playerId,
          hand: [],
          score: 0,
          hasLaidInitialMeld: false,
          seatPosition: 0,
        },
      ],
      hostPlayerId: args.playerId,
      currentTurnPlayerId: undefined,
      dealerPlayerId: undefined,
      turnPhase: "draw",
      stockPile: [],
      discardPile: [],
      tableMelds: [],
      currentRound: 0,
      createdAt: Date.now(),
      lastActionAt: Date.now(),
    });

    return { gameId, code };
  },
});

export const joinGame = mutation({
  args: {
    playerId: v.id("players"),
    code: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();

    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "waiting") {
      throw new Error("Game has already started");
    }

    if (game.players.length >= game.maxPlayers) {
      throw new Error("Game is full");
    }

    // Check if player already in game
    if (game.players.some((p) => p.playerId === args.playerId)) {
      return game._id;
    }

    await ctx.db.patch(game._id, {
      players: [
        ...game.players,
        {
          playerId: args.playerId,
          hand: [],
          score: 0,
          hasLaidInitialMeld: false,
          seatPosition: game.players.length,
        },
      ],
      lastActionAt: Date.now(),
    });

    return game._id;
  },
});

export const leaveGame = mutation({
  args: {
    playerId: v.id("players"),
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return;

    if (game.status !== "waiting") {
      throw new Error("Cannot leave a game in progress");
    }

    const newPlayers = game.players.filter((p) => p.playerId !== args.playerId);

    if (newPlayers.length === 0) {
      // Delete game if no players left
      await ctx.db.delete(args.gameId);
      return;
    }

    // Reassign host if needed
    let newHostId = game.hostPlayerId;
    if (game.hostPlayerId === args.playerId) {
      newHostId = newPlayers[0].playerId;
    }

    // Update seat positions
    const updatedPlayers = newPlayers.map((p, i) => ({
      ...p,
      seatPosition: i,
    }));

    await ctx.db.patch(args.gameId, {
      players: updatedPlayers,
      hostPlayerId: newHostId,
      lastActionAt: Date.now(),
    });
  },
});

export const startGame = mutation({
  args: {
    playerId: v.id("players"),
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.hostPlayerId !== args.playerId) {
      throw new Error("Only the host can start the game");
    }

    if (game.status !== "waiting") {
      throw new Error("Game has already started");
    }

    if (game.players.length < 2) {
      throw new Error("Need at least 2 players to start");
    }

    // Create and shuffle deck(s)
    const deck = createMultipleDecks(game.deckCount, game.jokersPerDeck);

    // Random dealer for first round (seat 0)
    const dealerIndex = 0;
    const dealerPlayerId = game.players[dealerIndex].playerId;

    // Deal cards
    const { hands, remainingDeck } = dealCards(
      deck,
      game.players.length,
      CARDS_PER_PLAYER,
      dealerIndex
    );

    // Flip the top card from stock to seed the discard pile
    const stockPile = [...remainingDeck];
    const firstDiscard = stockPile.pop()!;

    // Update players with their hands
    const updatedPlayers = game.players.map((p, i) => ({
      ...p,
      hand: hands[i],
    }));

    // First player is to the left of dealer (next player in order)
    const firstPlayerIndex = (dealerIndex + 1) % game.players.length;
    const firstPlayerId = game.players[firstPlayerIndex].playerId;

    await ctx.db.patch(args.gameId, {
      status: "playing",
      players: updatedPlayers,
      stockPile: stockPile,
      discardPile: [firstDiscard],
      tableMelds: [],
      currentRound: 1,
      currentTurnNumber: 1,
      dealerPlayerId,
      currentTurnPlayerId: firstPlayerId,
      turnPhase: "draw", // Normal turn: draw first, then can play melds
      lastActionAt: Date.now(),
    });
  },
});

export const getGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.gameId);
  },
});

export const getGameByCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("games")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();
  },
});

export const getGameState = query({
  args: {
    gameId: v.id("games"),
    playerId: v.id("players"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) return null;

    // Get player names
    const playerInfos = await Promise.all(
      game.players.map(async (p) => {
        const player = await ctx.db.get(p.playerId);
        return {
          ...p,
          name: player?.name ?? "Unknown",
          avatarColor: player?.avatarColor ?? "#666",
        };
      })
    );

    // Hide other players' hands, show only current player's hand
    const sanitizedPlayers = playerInfos.map((p) => ({
      playerId: p.playerId,
      name: p.name,
      avatarColor: p.avatarColor,
      hand: p.playerId === args.playerId ? p.hand : [],
      handCount: p.hand.length,
      score: p.score,
      hasLaidInitialMeld: p.hasLaidInitialMeld,
      seatPosition: p.seatPosition,
      pendingMeldPoints: calculatePendingMeldPoints(game.tableMelds, p.playerId.toString()),
      hasPendingCleanSequence: hasPendingCleanSequence(game.tableMelds, p.playerId.toString()),
    }));

    // Check if current player needs to discard excess cards
    const currentPlayer = game.players.find((p) => p.playerId === args.playerId);
    const excessCards = currentPlayer ? Math.max(0, currentPlayer.hand.length - CARDS_PER_PLAYER) : 0;
    const isMyTurn = game.currentTurnPlayerId === args.playerId;
    const mustDiscardExcess = isMyTurn && game.turnPhase === "draw" && excessCards > 0;

    return {
      _id: game._id,
      code: game.code,
      name: game.name,
      maxPlayers: game.maxPlayers,
      deckCount: game.deckCount,
      jokersPerDeck: game.jokersPerDeck ?? DEFAULT_JOKERS_PER_DECK,
      initialMeldPoints: game.initialMeldPoints ?? DEFAULT_INITIAL_MELD_POINTS,
      targetScore: game.targetScore,
      status: game.status,
      players: sanitizedPlayers,
      hostPlayerId: game.hostPlayerId,
      currentTurnPlayerId: game.currentTurnPlayerId,
      dealerPlayerId: game.dealerPlayerId,
      turnPhase: game.turnPhase,
      stockPileCount: game.stockPile.length,
      topDiscard: game.discardPile.length > 0 ? game.discardPile[game.discardPile.length - 1] : null,
      discardPileCount: game.discardPile.length,
      tableMelds: game.tableMelds,
      currentRound: game.currentRound,
      mustDiscardExcess,
      excessCards,
    };
  },
});

export const startNextRound = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.status !== "round_end") {
      throw new Error("Can only start next round after round ends");
    }

    // Check if any player has reached target score
    const maxScore = Math.max(...game.players.map((p) => p.score));
    if (maxScore >= game.targetScore) {
      await ctx.db.patch(args.gameId, {
        status: "finished",
        lastActionAt: Date.now(),
      });
      return;
    }

    // Create and shuffle deck(s)
    const deck = createMultipleDecks(game.deckCount, game.jokersPerDeck);

    // Rotate dealer
    const currentDealerIndex = game.players.findIndex(
      (p) => p.playerId === game.dealerPlayerId
    );
    const newDealerIndex = (currentDealerIndex + 1) % game.players.length;
    const newDealerPlayerId = game.players[newDealerIndex].playerId;

    // Deal cards
    const { hands, remainingDeck } = dealCards(
      deck,
      game.players.length,
      CARDS_PER_PLAYER,
      newDealerIndex
    );

    // Flip the top card from stock to seed the discard pile
    const stockPile = [...remainingDeck];
    const firstDiscard = stockPile.pop()!;

    // Update players with their hands, keep scores, reset initial meld flag
    const updatedPlayers = game.players.map((p, i) => ({
      ...p,
      hand: hands[i],
      hasLaidInitialMeld: false,
    }));

    // First player is to the left of dealer
    const firstPlayerIndex = (newDealerIndex + 1) % game.players.length;
    const firstPlayerId = game.players[firstPlayerIndex].playerId;

    await ctx.db.patch(args.gameId, {
      status: "playing",
      players: updatedPlayers,
      stockPile: stockPile,
      discardPile: [firstDiscard],
      tableMelds: [],
      currentRound: game.currentRound + 1,
      currentTurnNumber: 1,
      dealerPlayerId: newDealerPlayerId,
      currentTurnPlayerId: firstPlayerId,
      turnPhase: "draw",
      lastActionAt: Date.now(),
    });
  },
});
