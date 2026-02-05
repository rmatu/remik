"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, Meld } from "@/lib/types";
import { PlayingCard } from "./PlayingCard";
import { Button, Card as CardUI, CardContent } from "@/components/ui";
import { validateMeld, validateSequenceOrder, calculateMeldPoints, getRankIndex, isCleanSequence } from "@/convex/helpers/meldValidation";
import { cn } from "@/lib/utils";
import { X, Plus, Check, AlertCircle, AlertTriangle } from "lucide-react";
import { Rank } from "@/lib/types";
import { Reorder } from "framer-motion";

// Sort cards by rank for sequence validation
function sortCardsByRank(cards: Card[]): Card[] {
  return [...cards].sort((a, b) => {
    if (a.isJoker && !b.isJoker) return 1;
    if (!a.isJoker && b.isJoker) return -1;
    if (a.isJoker && b.isJoker) return 0;
    return getRankIndex(a.rank as Rank) - getRankIndex(b.rank as Rank);
  });
}

// Smart initial sort: if cards form a valid sequence, use proper joker placement
function getInitialMeldOrder(cards: Card[]): Card[] {
  if (cards.length < 3) {
    return sortCardsByRank(cards);
  }

  // Try to validate as a sequence first - this auto-places jokers correctly
  const sorted = sortCardsByRank(cards);
  const result = validateMeld(sorted);

  if (result.valid && result.sortedCards) {
    return result.sortedCards;
  }

  return sorted;
}

// Draggable card wrapper for reordering within melds
function MeldDraggableCard({
  card,
  index,
  onClick,
}: {
  card: Card;
  index: number;
  onClick?: () => void;
}) {
  return (
    <Reorder.Item
      value={card}
      dragListener={true}
      className="relative cursor-grab active:cursor-grabbing touch-none"
      style={{ zIndex: index }}
      whileDrag={{
        scale: 1.1,
        zIndex: 100,
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        rotate: 3,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
    >
      <PlayingCard card={card} size="sm" onClick={onClick} />
    </Reorder.Item>
  );
}

interface MeldBuilderProps {
  selectedCards: Card[];
  hasLaidInitialMeld: boolean;
  onLayDown: (cardIds: string[][]) => void;
  onCancel: () => void;
  tableMelds: Meld[];
  onAddToMeld?: (meldId: string, cardId: string) => void;
  pendingMeldPoints?: number;
  currentPlayerId?: string;
  initialMeldThreshold?: number;
}

export function MeldBuilder({
  selectedCards,
  hasLaidInitialMeld,
  onLayDown,
  onCancel,
  tableMelds,
  onAddToMeld,
  pendingMeldPoints = 0,
  currentPlayerId,
  initialMeldThreshold = 30,
}: MeldBuilderProps) {
  const [melds, setMelds] = useState<Card[][]>([getInitialMeldOrder(selectedCards)]);
  const [activeTab, setActiveTab] = useState<"create" | "add">("create");

  // Validation for current melds - also returns sorted cards for sequences
  const validation = useMemo(() => {
    if (melds.length === 0 || melds.every((m) => m.length === 0)) {
      return {
        valid: false,
        error: "Select cards to create a meld",
        points: 0,
        hasCleanSequence: false,
        sortedMelds: melds,
        orderValid: true
      };
    }

    // Filter out empty melds
    const nonEmptyMelds = melds.filter((m) => m.length > 0);

    // Validate each meld and collect sorted versions
    let hasCleanSequence = false;
    let orderValid = true;
    let orderError: string | undefined;
    const sortedMelds: Card[][] = [];

    for (const meldCards of nonEmptyMelds) {
      const result = validateMeld(meldCards);
      if (!result.valid) {
        return {
          ...result,
          points: 0,
          hasCleanSequence: false,
          sortedMelds: nonEmptyMelds,
          orderValid: true
        };
      }

      // For sequences, also validate the display order
      if (result.type === "sequence") {
        const orderResult = validateSequenceOrder(meldCards);
        if (!orderResult.valid) {
          orderValid = false;
          orderError = orderResult.error;
        }
      }

      // Use sorted cards for sequences (jokers in proper position)
      sortedMelds.push(result.sortedCards || meldCards);
      if (result.type === "sequence" && isCleanSequence(meldCards)) {
        hasCleanSequence = true;
      }
    }

    const newPoints = nonEmptyMelds.reduce(
      (sum, cards) => sum + calculateMeldPoints(cards),
      0
    );

    return { valid: true, points: newPoints, hasCleanSequence, sortedMelds, orderValid, orderError, error: undefined };
  }, [melds]);

  // Calculate combined points for display
  const combinedPoints = pendingMeldPoints + (validation.points || 0);
  const wouldSolidify = combinedPoints >= initialMeldThreshold && (validation.hasCleanSequence || hasPendingCleanSequenceFromTable());

  function hasPendingCleanSequenceFromTable(): boolean {
    if (!currentPlayerId) return false;
    return tableMelds.some(
      (m) =>
        m.isPending &&
        m.ownerId === currentPlayerId &&
        m.type === "sequence" &&
        isCleanSequence(m.cards)
    );
  }

  const handleLayDown = () => {
    const nonEmptyMelds = melds.filter((m) => m.length > 0);
    const meldIds = nonEmptyMelds.map((m) => m.map((c) => c.id));
    onLayDown(meldIds);
  };

  const handleSplitMeld = () => {
    if (melds.length < 4 && melds[melds.length - 1].length > 0) {
      setMelds([...melds, []]);
    }
  };

  const moveCardToMeld = (card: Card, fromMeldIndex: number, toMeldIndex: number) => {
    const newMelds = melds.map((m) => [...m]);
    const cardIndex = newMelds[fromMeldIndex].findIndex((c) => c.id === card.id);
    if (cardIndex !== -1) {
      newMelds[fromMeldIndex].splice(cardIndex, 1);
      newMelds[toMeldIndex].push(card);

      // Auto-sort the destination meld if it forms a valid sequence
      const destMeld = newMelds[toMeldIndex];
      if (destMeld.length >= 3) {
        const result = validateMeld(destMeld);
        if (result.valid && result.sortedCards) {
          newMelds[toMeldIndex] = result.sortedCards;
        }
      }
    }
    // Remove empty melds (except the last one if we need a place to move to)
    setMelds(newMelds.filter((m, i) => m.length > 0 || i === newMelds.length - 1));
  };

  // Handle reordering cards within a meld via drag-and-drop
  const handleReorder = useCallback((meldIndex: number, newOrder: Card[]) => {
    setMelds(prev => {
      const newMelds = [...prev];
      newMelds[meldIndex] = newOrder;
      return newMelds;
    });
  }, []);

  // Apply auto-sort button - sorts jokers into proper sequence positions
  const handleAutoSort = useCallback((meldIndex: number) => {
    const meldCards = melds[meldIndex];
    if (meldCards.length < 3) return;

    const result = validateMeld(meldCards);
    if (result.valid && result.sortedCards) {
      setMelds(prev => {
        const newMelds = [...prev];
        newMelds[meldIndex] = result.sortedCards!;
        return newMelds;
      });
    }
  }, [melds]);

  return (
    <CardUI className="bg-emerald-900/95 backdrop-blur-sm border-emerald-700/50 shadow-2xl">
      <CardContent className="p-4">
        {/* Tabs */}
        {hasLaidInitialMeld && tableMelds.length > 0 && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab("create")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === "create"
                  ? "bg-white text-emerald-900 shadow-md"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              )}
            >
              Create New
            </button>
            <button
              onClick={() => setActiveTab("add")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === "add"
                  ? "bg-white text-emerald-900 shadow-md"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              )}
            >
              Add to Existing
            </button>
          </div>
        )}

        {activeTab === "create" && (
          <>
            <p className="text-emerald-100/80 text-sm mb-4">
              {hasLaidInitialMeld
                ? "Create a new meld with your selected cards"
                : `Lay down melds until you reach ${initialMeldThreshold}+ pts with a clean sequence`}
            </p>

            {/* Meld groups */}
            <div className="space-y-3 mb-4">
              {melds.map((meldCards, meldIndex) => {
                // Check if this meld would benefit from auto-sort
                const result = meldCards.length >= 3 ? validateMeld(meldCards) : null;
                const hasJoker = meldCards.some(c => c.isJoker);
                // Only show auto-sort if the sorted order is different from current
                const needsReorder = result?.sortedCards &&
                  result.sortedCards.some((c, i) => c.id !== meldCards[i]?.id);
                const canAutoSort = result?.valid && hasJoker && needsReorder;

                return (
                  <div
                    key={meldIndex}
                    className="bg-black/20 rounded-xl p-3 border border-white/5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/50 text-xs font-medium">
                        Meld {meldIndex + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {canAutoSort && (
                          <button
                            onClick={() => handleAutoSort(meldIndex)}
                            className="text-amber-400/80 hover:text-amber-300 text-xs underline underline-offset-2"
                          >
                            Auto-sort joker
                          </button>
                        )}
                        {meldCards.length > 0 && (
                          <span className="text-emerald-300/80 text-xs">
                            {calculateMeldPoints(meldCards)} pts
                          </span>
                        )}
                      </div>
                    </div>
                    {meldCards.length === 0 ? (
                      <div className="flex flex-wrap gap-1.5 min-h-[66px] items-center">
                        <div className="text-white/30 text-sm">
                          Click cards to move them here
                        </div>
                      </div>
                    ) : (
                      <Reorder.Group
                        axis="x"
                        values={meldCards}
                        onReorder={(newOrder) => handleReorder(meldIndex, newOrder)}
                        className="flex gap-1.5 min-h-[66px] items-center"
                        style={{ touchAction: "pan-y" }}
                      >
                        {meldCards.map((card, cardIndex) => (
                          <MeldDraggableCard
                            key={card.id}
                            card={card}
                            index={cardIndex}
                            onClick={
                              melds.length > 1
                                ? () =>
                                    moveCardToMeld(
                                      card,
                                      meldIndex,
                                      (meldIndex + 1) % melds.length
                                    )
                                : undefined
                            }
                          />
                        ))}
                      </Reorder.Group>
                    )}
                    {meldCards.length > 1 && (
                      <p className="text-white/30 text-[10px] mt-1.5">
                        Drag cards to reorder • Click to move between melds
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Order warning */}
            {validation.valid && !validation.orderValid && (
              <div className="flex items-center gap-2 text-sm mb-2 rounded-lg px-3 py-2 bg-orange-500/20 text-orange-300">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>Joker in wrong position. Use &quot;Auto-sort joker&quot; or drag to fix.</span>
              </div>
            )}

            {/* Validation message */}
            <div
              className={cn(
                "flex items-center gap-2 text-sm mb-4 rounded-lg px-3 py-2",
                validation.valid
                  ? validation.orderValid
                    ? wouldSolidify
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                    : "bg-orange-500/20 text-orange-300"
                  : "bg-red-500/20 text-red-300"
              )}
            >
              {validation.valid ? (
                <>
                  {validation.orderValid ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  {hasLaidInitialMeld ? (
                    <span>Valid! {validation.points} points</span>
                  ) : (
                    <span>
                      {pendingMeldPoints > 0
                        ? `${pendingMeldPoints} + ${validation.points} = ${combinedPoints}/${initialMeldThreshold} pts`
                        : `${validation.points}/${initialMeldThreshold} pts`}
                      {wouldSolidify && " — Will solidify!"}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  <span>{validation.error}</span>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>

              {melds.length < 4 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSplitMeld}
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Split
                </Button>
              )}

              <Button
                size="sm"
                onClick={handleLayDown}
                disabled={!validation.valid}
                className="ml-auto bg-amber-500 hover:bg-amber-600 text-amber-950"
              >
                <Check className="h-4 w-4 mr-1" />
                Lay Down
              </Button>
            </div>
          </>
        )}

        {activeTab === "add" && selectedCards.length === 1 && (
          <>
            <p className="text-emerald-100/80 text-sm mb-3">
              Select a meld to add your card to:
            </p>
            <div className="bg-black/20 rounded-lg px-3 py-2 mb-4 inline-flex items-center gap-2">
              <span className="text-white/60 text-xs">Selected:</span>
              <PlayingCard card={selectedCards[0]} size="sm" />
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {tableMelds.map((meld) => (
                <button
                  key={meld.id}
                  onClick={() => onAddToMeld?.(meld.id, selectedCards[0].id)}
                  className="w-full bg-black/20 hover:bg-black/30 rounded-xl p-3 transition-all border border-transparent hover:border-amber-500/50 text-left"
                >
                  <div className="flex gap-1.5 flex-wrap">
                    {meld.cards.map((card) => (
                      <PlayingCard key={card.id} card={card} size="sm" />
                    ))}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </>
        )}

        {activeTab === "add" && selectedCards.length !== 1 && (
          <div className="text-white/60 text-sm py-4 text-center">
            Select exactly one card to add to an existing meld.
          </div>
        )}
      </CardContent>
    </CardUI>
  );
}
