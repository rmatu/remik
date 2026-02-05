"use client";

import { Meld, Card } from "@/lib/types";
import { PlayingCard } from "./PlayingCard";
import { cn } from "@/lib/utils";

interface MeldGroupProps {
  meld: Meld;
  onCardClick?: (meldId: string, cardId: string, card: Card) => void;
  highlightJokers?: boolean;
  isPending?: boolean;
  ownerName?: string;
}

export function MeldGroup({
  meld,
  onCardClick,
  highlightJokers = false,
  isPending = false,
  ownerName,
}: MeldGroupProps) {
  return (
    <div className="relative">
      {isPending && ownerName && (
        <div className="absolute -top-5 left-0 right-0 text-center">
          <span className="text-amber-400/80 text-[10px] font-medium bg-black/40 px-1.5 py-0.5 rounded">
            {ownerName}
          </span>
        </div>
      )}
      <div
        className={cn(
          "flex -space-x-3 sm:-space-x-4 rounded-xl p-2 shadow-inner",
          isPending
            ? "bg-black/20 border-2 border-dashed border-amber-400/50 opacity-80"
            : "bg-black/30"
        )}
      >
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
    </div>
  );
}
