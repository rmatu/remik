import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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

const meldValidator = v.object({
  id: v.string(),
  type: v.union(v.literal("sequence"), v.literal("group")),
  cards: v.array(cardValidator),
});

export default defineSchema({
  players: defineTable({
    name: v.string(),
    sessionId: v.string(),
    avatarColor: v.string(),
    gamesPlayed: v.number(),
    gamesWon: v.number(),
  }).index("by_session", ["sessionId"]),

  games: defineTable({
    code: v.string(),
    name: v.string(),
    maxPlayers: v.union(v.literal(2), v.literal(3), v.literal(4)),
    deckCount: v.union(v.literal(1), v.literal(2)),
    targetScore: v.number(),

    status: v.union(
      v.literal("waiting"),
      v.literal("playing"),
      v.literal("round_end"),
      v.literal("finished")
    ),

    players: v.array(
      v.object({
        playerId: v.id("players"),
        hand: v.array(cardValidator),
        score: v.number(),
        hasLaidInitialMeld: v.boolean(),
        seatPosition: v.number(),
      })
    ),

    hostPlayerId: v.id("players"),
    currentTurnPlayerId: v.optional(v.id("players")),
    dealerPlayerId: v.optional(v.id("players")),
    turnPhase: v.union(v.literal("draw"), v.literal("play"), v.literal("discard")),

    stockPile: v.array(cardValidator),
    discardPile: v.array(cardValidator),
    tableMelds: v.array(meldValidator),

    currentRound: v.number(),
    createdAt: v.number(),
    lastActionAt: v.number(),
  }).index("by_code", ["code"]),
});
