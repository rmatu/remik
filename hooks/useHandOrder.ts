"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Card } from "@/lib/types";
import { sortCards } from "@/lib/cardUtils";

export type SortMode = "auto" | "manual";

const STORAGE_KEY_PREFIX = "remik-hand-order-";
const SORT_MODE_KEY = "remik-sort-mode";

interface StoredOrder {
  cardIds: string[];
}

export function useHandOrder(gameId: string) {
  const [sortMode, setSortMode] = useState<SortMode>("auto");
  const [customOrder, setCustomOrder] = useState<string[]>([]);

  // Load sort mode preference on mount
  useEffect(() => {
    const stored = localStorage.getItem(SORT_MODE_KEY);
    if (stored === "manual" || stored === "auto") {
      setSortMode(stored);
    }
  }, []);

  // Load custom order for this game on mount
  useEffect(() => {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${gameId}`);
    if (stored) {
      try {
        const parsed: StoredOrder = JSON.parse(stored);
        if (Array.isArray(parsed.cardIds)) {
          setCustomOrder(parsed.cardIds);
        }
      } catch {
        // Invalid stored data, ignore
      }
    }
  }, [gameId]);

  // Save sort mode preference
  const toggleSortMode = useCallback(() => {
    setSortMode((prev) => {
      const next = prev === "auto" ? "manual" : "auto";
      localStorage.setItem(SORT_MODE_KEY, next);
      return next;
    });
  }, []);

  // Save custom order to localStorage
  const saveCustomOrder = useCallback(
    (cardIds: string[]) => {
      setCustomOrder(cardIds);
      const data: StoredOrder = { cardIds };
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${gameId}`, JSON.stringify(data));
    },
    [gameId]
  );

  // Called when cards are reordered via drag-and-drop
  const setCardOrder = useCallback(
    (cards: Card[]) => {
      const cardIds = cards.map((c) => c.id);
      saveCustomOrder(cardIds);
    },
    [saveCustomOrder]
  );

  // Get ordered cards based on current mode
  const getOrderedCards = useCallback(
    (hand: Card[]): Card[] => {
      if (sortMode === "auto") {
        return sortCards(hand);
      }

      // Manual mode: reconcile with custom order
      // 1. Cards that exist in customOrder, in that order
      // 2. New cards (not in customOrder) appended at the end
      const handMap = new Map(hand.map((c) => [c.id, c]));
      const result: Card[] = [];
      const seen = new Set<string>();

      // Add cards in custom order
      for (const id of customOrder) {
        const card = handMap.get(id);
        if (card) {
          result.push(card);
          seen.add(id);
        }
      }

      // Append new cards not in custom order
      for (const card of hand) {
        if (!seen.has(card.id)) {
          result.push(card);
        }
      }

      return result;
    },
    [sortMode, customOrder]
  );

  // Initialize custom order from current sorted order when switching to manual
  const initializeManualOrder = useCallback(
    (hand: Card[]) => {
      if (customOrder.length === 0 && hand.length > 0) {
        const sorted = sortCards(hand);
        saveCustomOrder(sorted.map((c) => c.id));
      }
    },
    [customOrder.length, saveCustomOrder]
  );

  return {
    sortMode,
    toggleSortMode,
    getOrderedCards,
    setCardOrder,
    initializeManualOrder,
  };
}
