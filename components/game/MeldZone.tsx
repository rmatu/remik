"use client";

import { Meld, Card } from "@/lib/types";
import { MeldGroup } from "./MeldGroup";

interface MeldZoneProps {
  melds: Meld[];
  onMeldCardClick?: (meldId: string, cardId: string, card: Card) => void;
  highlightJokers?: boolean;
}

export function MeldZone({ melds, onMeldCardClick, highlightJokers = false }: MeldZoneProps) {
  if (melds.length === 0) {
    return (
      <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 min-h-[100px] flex items-center justify-center border border-white/5">
        <span className="text-white/25 text-sm">No melds on table yet</span>
      </div>
    );
  }

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3 sm:p-4 min-h-[100px] border border-white/5">
      <div className="text-white/40 text-xs font-medium mb-3">
        Table Melds ({melds.length})
      </div>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {melds.map((meld) => (
          <MeldGroup
            key={meld.id}
            meld={meld}
            onCardClick={onMeldCardClick}
            highlightJokers={highlightJokers}
          />
        ))}
      </div>
    </div>
  );
}
