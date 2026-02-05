"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCallback, useState } from "react";

export function useGameActions(gameId: Id<"games"> | null, playerId: Id<"players"> | null) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const drawFromStockMutation = useMutation(api.actions.drawFromStock);
  const drawFromDiscardMutation = useMutation(api.actions.drawFromDiscard);
  const discardCardMutation = useMutation(api.actions.discardCard);
  const layDownMeldMutation = useMutation(api.actions.layDownMeld);
  const layDownInitialMeldsMutation = useMutation(api.actions.layDownInitialMelds);
  const addToMeldMutation = useMutation(api.actions.addToMeld);
  const replaceJokerMutation = useMutation(api.actions.replaceJoker);
  const takeBackPendingMeldMutation = useMutation(api.actions.takeBackPendingMeld);

  const handleAction = useCallback(
    async <T>(action: () => Promise<T>): Promise<T | null> => {
      if (!gameId || !playerId) return null;
      setError(null);
      setIsLoading(true);
      try {
        const result = await action();
        return result;
      } catch (e) {
        setError(e instanceof Error ? e.message : "An error occurred");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [gameId, playerId]
  );

  const drawFromStock = useCallback(() => {
    if (!gameId || !playerId) return;
    return handleAction(() => drawFromStockMutation({ gameId, playerId }));
  }, [gameId, playerId, handleAction, drawFromStockMutation]);

  const drawFromDiscard = useCallback(() => {
    if (!gameId || !playerId) return;
    return handleAction(() => drawFromDiscardMutation({ gameId, playerId }));
  }, [gameId, playerId, handleAction, drawFromDiscardMutation]);

  const discardCard = useCallback(
    (cardId: string) => {
      if (!gameId || !playerId) return;
      return handleAction(() => discardCardMutation({ gameId, playerId, cardId }));
    },
    [gameId, playerId, handleAction, discardCardMutation]
  );

  const layDownMeld = useCallback(
    (cardIds: string[]) => {
      if (!gameId || !playerId) return;
      return handleAction(() => layDownMeldMutation({ gameId, playerId, cardIds }));
    },
    [gameId, playerId, handleAction, layDownMeldMutation]
  );

  const layDownInitialMelds = useCallback(
    (melds: string[][]) => {
      if (!gameId || !playerId) return;
      return handleAction(() => layDownInitialMeldsMutation({ gameId, playerId, melds }));
    },
    [gameId, playerId, handleAction, layDownInitialMeldsMutation]
  );

  const addToMeld = useCallback(
    (meldId: string, cardId: string, position?: "start" | "end") => {
      if (!gameId || !playerId) return;
      return handleAction(() =>
        addToMeldMutation({ gameId, playerId, meldId, cardId, position })
      );
    },
    [gameId, playerId, handleAction, addToMeldMutation]
  );

  const replaceJoker = useCallback(
    (meldId: string, jokerCardId: string, replacementCardId: string) => {
      if (!gameId || !playerId) return;
      return handleAction(() =>
        replaceJokerMutation({ gameId, playerId, meldId, jokerCardId, replacementCardId })
      );
    },
    [gameId, playerId, handleAction, replaceJokerMutation]
  );

  const takeBackPendingMeld = useCallback(
    (meldId: string) => {
      if (!gameId || !playerId) return;
      return handleAction(() =>
        takeBackPendingMeldMutation({ gameId, playerId, meldId })
      );
    },
    [gameId, playerId, handleAction, takeBackPendingMeldMutation]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    drawFromStock,
    drawFromDiscard,
    discardCard,
    layDownMeld,
    layDownInitialMelds,
    addToMeld,
    replaceJoker,
    takeBackPendingMeld,
    error,
    clearError,
    isLoading,
  };
}
