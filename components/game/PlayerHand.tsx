"use client";

import { Reorder } from "framer-motion";
import { Card } from "@/lib/types";
import { PlayingCard } from "./PlayingCard";
import { DraggableCard } from "./DraggableCard";
import { sortCards } from "@/lib/cardUtils";
import { cn } from "@/lib/utils";
import { SortMode } from "@/hooks/useHandOrder";

interface PlayerHandProps {
  cards: Card[];
  selectedCardIds: Set<string>;
  onCardClick: (cardId: string) => void;
  disabled?: boolean;
  sortMode?: SortMode;
  orderedCards?: Card[];
  onReorder?: (cards: Card[]) => void;
}

export function PlayerHand({
  cards,
  selectedCardIds,
  onCardClick,
  disabled = false,
  sortMode = "auto",
  orderedCards,
  onReorder,
}: PlayerHandProps) {
  // Use provided ordered cards or fall back to auto-sorted
  const displayCards = orderedCards ?? sortCards(cards);

  // Calculate overlap based on number of cards for mobile-friendly display
  const getOverlap = () => {
    if (cards.length <= 5) return -6;
    if (cards.length <= 7) return -10;
    if (cards.length <= 10) return -14;
    if (cards.length <= 13) return -18;
    return -22;
  };

  const overlap = getOverlap();

  // Manual mode with drag-and-drop
  if (sortMode === "manual" && onReorder) {
    return (
      <div className={cn("w-full overflow-visible transition-opacity duration-150", disabled && "opacity-50")}>
        <Reorder.Group
          axis="x"
          values={displayCards}
          onReorder={onReorder}
          className="flex justify-center items-center px-4 py-2 flex-wrap gap-1"
          style={{ touchAction: "pan-y" }}
        >
          {displayCards.map((card, index) => (
            <DraggableCard
              key={card.id}
              card={card}
              isSelected={selectedCardIds.has(card.id)}
              onClick={() => onCardClick(card.id)}
              disabled={disabled}
              index={index}
              overlap={overlap}
            />
          ))}
        </Reorder.Group>

        {cards.length === 0 && (
          <div className="text-white/30 text-sm py-8 text-center">No cards in hand</div>
        )}
      </div>
    );
  }

  // Auto mode (current behavior)
  return (
    <div className={cn("w-full overflow-visible transition-opacity duration-150", disabled && "opacity-50")}>
      <div
        className="flex justify-center items-center px-4 py-2 flex-wrap gap-1"
        style={{ touchAction: "pan-x" }}
      >
        {displayCards.map((card, index) => (
          <div
            key={card.id}
            className="relative flex-shrink-0 transition-all duration-150"
            style={{
              marginLeft: index === 0 ? 0 : overlap,
              zIndex: selectedCardIds.has(card.id) ? 50 : index,
            }}
          >
            <PlayingCard
              card={card}
              isSelected={selectedCardIds.has(card.id)}
              onClick={() => onCardClick(card.id)}
              disabled={disabled}
              size="md"
            />
          </div>
        ))}

        {cards.length === 0 && (
          <div className="text-white/30 text-sm py-8">No cards in hand</div>
        )}
      </div>
    </div>
  );
}
