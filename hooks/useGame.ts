"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useGame(gameId: Id<"games"> | null, playerId: Id<"players"> | null) {
  const gameState = useQuery(
    api.games.getGameState,
    gameId && playerId ? { gameId, playerId } : "skip"
  );

  const currentPlayer = gameState?.players.find((p) => p.playerId === playerId);
  const isMyTurn = gameState?.currentTurnPlayerId === playerId;
  const isHost = gameState?.hostPlayerId === playerId;

  const otherPlayers = gameState?.players.filter((p) => p.playerId !== playerId) ?? [];

  return {
    gameState,
    currentPlayer,
    otherPlayers,
    isMyTurn,
    isHost,
    isLoading: gameState === undefined,
  };
}
