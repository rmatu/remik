"use client";

import { useState, useCallback } from "react";
import { Card } from "@/lib/types";

export function useCardSelection() {
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());

  const toggleCard = useCallback((cardId: string) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  }, []);

  const selectCard = useCallback((cardId: string) => {
    setSelectedCardIds((prev) => new Set(prev).add(cardId));
  }, []);

  const deselectCard = useCallback((cardId: string) => {
    setSelectedCardIds((prev) => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCardIds(new Set());
  }, []);

  const isSelected = useCallback(
    (cardId: string) => selectedCardIds.has(cardId),
    [selectedCardIds]
  );

  const getSelectedCards = useCallback(
    (hand: Card[]) => hand.filter((c) => selectedCardIds.has(c.id)),
    [selectedCardIds]
  );

  const getSelectedCardIds = useCallback(
    () => Array.from(selectedCardIds),
    [selectedCardIds]
  );

  return {
    selectedCardIds,
    selectedCount: selectedCardIds.size,
    toggleCard,
    selectCard,
    deselectCard,
    clearSelection,
    isSelected,
    getSelectedCards,
    getSelectedCardIds,
  };
}
