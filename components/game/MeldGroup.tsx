"use client";

import { Meld, Card } from "@/lib/types";
import { PlayingCard } from "./PlayingCard";
import { cn } from "@/lib/utils";
import { Undo2 } from "lucide-react";

interface MeldGroupProps {
  meld: Meld;
  onCardClick?: (meldId: string, cardId: string, card: Card) => void;
  highlightJokers?: boolean;
  isPending?: boolean;
  ownerName?: string;
  canTakeBack?: boolean;
  onTakeBack?: (meldId: string) => void;
}

export function MeldGroup({
  meld,
  onCardClick,
  highlightJokers = false,
  isPending = false,
  ownerName,
  canTakeBack = false,
  onTakeBack,
}: MeldGroupProps) {
  return (
    <div className="relative group">
      {isPending && ownerName && (
        <div className="absolute -top-5 left-0 right-0 text-center">
          <span className="text-amber-400/80 text-[10px] font-medium bg-black/40 px-1.5 py-0.5 rounded">
            {ownerName}
          </span>
        </div>
      )}
      <div
        className={cn(
          "flex -space-x-4 sm:-space-x-4 rounded-xl p-1.5 sm:p-2 shadow-inner",
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
      {/* Take back button for pending melds */}
      {canTakeBack && isPending && onTakeBack && (
        <button
          onClick={() => onTakeBack(meld.id)}
          className="absolute -top-2 -right-2 z-10 bg-red-500/90 hover:bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          title="Take back to hand"
        >
          <Undo2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
