"use client";

import { Button, Badge } from "@/components/ui";
import { TurnPhase } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Layers, CreditCard, X, AlertCircle } from "lucide-react";

interface GameControlsProps {
  turnPhase: TurnPhase;
  isMyTurn: boolean;
  hasLaidInitialMeld: boolean;
  selectedCount: number;
  canDrawFromDiscard: boolean;
  onDrawFromStock: () => void;
  onDrawFromDiscard: () => void;
  onMeld: () => void;
  onDiscard: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function GameControls({
  turnPhase,
  isMyTurn,
  hasLaidInitialMeld,
  selectedCount,
  canDrawFromDiscard,
  onDrawFromStock,
  onDrawFromDiscard,
  onMeld,
  onDiscard,
  onClearSelection,
  isLoading = false,
  error,
}: GameControlsProps) {
  if (!isMyTurn) {
    return (
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/5">
        <span className="text-white/50 text-sm font-medium">Waiting for your turn...</span>
      </div>
    );
  }

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-3 sm:p-4 space-y-3 border border-white/5">
      {/* Phase indicator and clear selection */}
      <div className="flex items-center justify-between">
        <Badge
          variant="secondary"
          className={cn(
            "text-xs font-medium capitalize",
            turnPhase === "draw" && "bg-blue-500/20 text-blue-300 border-blue-500/30",
            turnPhase === "play" && "bg-amber-500/20 text-amber-300 border-amber-500/30",
            turnPhase === "discard" && "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
          )}
        >
          {turnPhase} Phase
        </Badge>
        {selectedCount > 0 && (
          <button
            onClick={onClearSelection}
            className="flex items-center gap-1 text-white/60 hover:text-white text-xs transition-colors"
          >
            <X className="h-3 w-3" />
            Clear ({selectedCount})
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/20 text-red-300 text-xs sm:text-sm rounded-lg px-3 py-2 border border-red-500/30">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {turnPhase === "draw" && (
          <>
            <Button
              onClick={onDrawFromStock}
              disabled={isLoading}
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              <Layers className="h-4 w-4 mr-1.5" />
              Draw Stock
            </Button>
            <Button
              onClick={onDrawFromDiscard}
              disabled={!canDrawFromDiscard || isLoading}
              variant="outline"
              className="flex-1 h-11 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:text-white/40"
            >
              <CreditCard className="h-4 w-4 mr-1.5" />
              Take Discard
            </Button>
          </>
        )}

        {turnPhase === "play" && (
          <>
            <Button
              onClick={onMeld}
              disabled={selectedCount < 3}
              variant="outline"
              className="flex-1 h-11 border-amber-500/50 bg-transparent text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 disabled:opacity-40 disabled:border-white/20 disabled:text-white/40"
            >
              {hasLaidInitialMeld ? "Meld" : "Initial Meld"}
              {selectedCount >= 3 && (
                <Badge className="ml-2 bg-amber-500/30 text-amber-200 text-[10px] px-1.5">
                  {selectedCount}
                </Badge>
              )}
            </Button>
            <Button
              onClick={onDiscard}
              disabled={selectedCount !== 1 || isLoading}
              className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-40"
            >
              Discard
              {selectedCount === 1 && (
                <Badge className="ml-2 bg-white/20 text-white text-[10px] px-1.5">1</Badge>
              )}
            </Button>
          </>
        )}

        {turnPhase === "discard" && (
          <Button
            onClick={onDiscard}
            disabled={selectedCount !== 1 || isLoading}
            className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-40"
          >
            Discard to Start
            {selectedCount === 1 && (
              <Badge className="ml-2 bg-white/20 text-white text-[10px] px-1.5">1</Badge>
            )}
          </Button>
        )}
      </div>

      {/* Help text */}
      <p className="text-white/30 text-[10px] sm:text-xs text-center hidden sm:block">
        {turnPhase === "draw" && "Draw a card from the stock pile or take the top discard"}
        {turnPhase === "play" && (
          <>
            {!hasLaidInitialMeld
              ? "Select 3+ cards for initial meld (30+ pts & clean sequence required)"
              : "Select cards to meld, or select 1 card to discard"}
          </>
        )}
        {turnPhase === "discard" && "Select one card to discard and start the round"}
      </p>
    </div>
  );
}
