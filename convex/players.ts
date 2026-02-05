import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const AVATAR_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export const getOrCreatePlayer = mutation({
  args: {
    sessionId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (existing) {
      // Update name if changed
      if (existing.name !== args.name) {
        await ctx.db.patch(existing._id, { name: args.name });
      }
      return existing._id;
    }

    // Create new player
    const playerId = await ctx.db.insert("players", {
      name: args.name,
      sessionId: args.sessionId,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      gamesPlayed: 0,
      gamesWon: 0,
    });

    return playerId;
  },
});

export const getPlayer = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("players")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

export const getPlayerById = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.playerId);
  },
});

export const updatePlayerStats = mutation({
  args: {
    playerId: v.id("players"),
    won: v.boolean(),
  },
  handler: async (ctx, args) => {
    const player = await ctx.db.get(args.playerId);
    if (!player) return;

    await ctx.db.patch(args.playerId, {
      gamesPlayed: player.gamesPlayed + 1,
      gamesWon: player.gamesWon + (args.won ? 1 : 0),
    });
  },
});
