"use client";

import { Meld, Card } from "@/lib/types";
import { MeldGroup } from "./MeldGroup";

interface PlayerInfo {
  playerId: string;
  name: string;
}

interface MeldZoneProps {
  melds: Meld[];
  onMeldCardClick?: (meldId: string, cardId: string, card: Card) => void;
  highlightJokers?: boolean;
  players?: PlayerInfo[];
  initialMeldThreshold?: number;
  currentPlayerId?: string;
  isMyTurn?: boolean;
  onTakeBackMeld?: (meldId: string) => void;
}

export function MeldZone({
  melds,
  onMeldCardClick,
  highlightJokers = false,
  players = [],
  initialMeldThreshold = 30,
  currentPlayerId,
  isMyTurn = false,
  onTakeBackMeld,
}: MeldZoneProps) {
  if (melds.length === 0) {
    return (
      <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 min-h-[100px] flex items-center justify-center border border-white/5">
        <span className="text-white/25 text-sm">No melds on table yet</span>
      </div>
    );
  }

  // Separate official and pending melds
  const officialMelds = melds.filter((m) => !m.isPending);
  const pendingMelds = melds.filter((m) => m.isPending);

  // Get player name by id
  const getPlayerName = (ownerId?: string): string | undefined => {
    if (!ownerId) return undefined;
    const player = players.find((p) => p.playerId === ownerId);
    return player?.name;
  };

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3 sm:p-4 min-h-[100px] border border-white/5 space-y-4">
      {/* Official melds */}
      {officialMelds.length > 0 && (
        <div>
          <div className="text-white/40 text-xs font-medium mb-3">
            Table Melds ({officialMelds.length})
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {officialMelds.map((meld) => (
              <MeldGroup
                key={meld.id}
                meld={meld}
                onCardClick={onMeldCardClick}
                highlightJokers={highlightJokers}
              />
            ))}
          </div>
        </div>
      )}

      {/* Pending melds */}
      {pendingMelds.length > 0 && (
        <div>
          <div className="text-amber-400/60 text-xs font-medium mb-3 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400/50" />
            Pending ({pendingMelds.length}) — needs {initialMeldThreshold} pts + clean sequence
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 pt-1">
            {pendingMelds.map((meld) => {
              const isMyMeld = meld.ownerId === currentPlayerId;
              const canTakeBack = isMyTurn && isMyMeld && onTakeBackMeld;

              return (
                <MeldGroup
                  key={meld.id}
                  meld={meld}
                  onCardClick={onMeldCardClick}
                  highlightJokers={highlightJokers}
                  isPending={true}
                  ownerName={getPlayerName(meld.ownerId)}
                  canTakeBack={!!canTakeBack}
                  onTakeBack={onTakeBackMeld}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state when only pending melds */}
      {officialMelds.length === 0 && pendingMelds.length === 0 && (
        <div className="text-white/25 text-sm text-center py-4">
          No melds on table yet
        </div>
      )}
    </div>
  );
}
