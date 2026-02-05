"use client";

import { Meld, Card } from "@/lib/types";
import { PlayingCard } from "./PlayingCard";
import { cn } from "@/lib/utils";

interface MeldGroupProps {
  meld: Meld;
  onCardClick?: (meldId: string, cardId: string, card: Card) => void;
  highlightJokers?: boolean;
}

export function MeldGroup({ meld, onCardClick, highlightJokers = false }: MeldGroupProps) {
  return (
    <div className="flex -space-x-3 sm:-space-x-4 bg-black/30 rounded-xl p-2 shadow-inner">
      {meld.cards.map((card, index) => (
        <div
          key={card.id}
          className="relative transition-transform duration-150"
          style={{ zIndex: index }}
        >
          <PlayingCard
            card={card}
            size="sm"
            onClick={onCardClick ? () => onCardClick(meld.id, card.id, card) : undefined}
            className={cn(
              highlightJokers && card.isJoker && "ring-2 ring-violet-400 ring-offset-1 ring-offset-black/50"
            )}
          />
        </div>
      ))}
    </div>
  );
}
