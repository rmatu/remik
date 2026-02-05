"use client";

import { Button, Badge } from "@/components/ui";
import { TurnPhase } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Layers, CreditCard, X, AlertCircle, Check, RotateCcw } from "lucide-react";

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
  onResetTurn?: () => void;
  isLoading?: boolean;
  error?: string | null;
  pendingMeldPoints?: number;
  hasPendingCleanSequence?: boolean;
  initialMeldThreshold?: number;
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
  onResetTurn,
  isLoading = false,
  error,
  pendingMeldPoints = 0,
  hasPendingCleanSequence = false,
  initialMeldThreshold = 30,
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

      {/* Pending meld progress indicator */}
      {!hasLaidInitialMeld && pendingMeldPoints > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-amber-300/80 font-medium">Your pending melds</span>
            <span className="text-amber-200">
              {pendingMeldPoints}/{initialMeldThreshold} pts
            </span>
          </div>
          <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((pendingMeldPoints / initialMeldThreshold) * 100, 100)}%` }}
            />
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            {hasPendingCleanSequence ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="h-3 w-3" />
                Clean sequence
              </span>
            ) : (
              <span className="text-amber-300/60">
                ○ Clean sequence required
              </span>
            )}
          </div>
        </div>
      )}

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
            {onResetTurn && (
              <Button
                onClick={onResetTurn}
                disabled={isLoading}
                variant="outline"
                className="h-11 px-3 border-white/20 bg-transparent text-white/70 hover:bg-white/10 hover:text-white"
                title="Reset turn - undo all moves"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
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

        {/* Legacy: discard phase for games started before the fix */}
        {turnPhase === "discard" && (
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
        )}
      </div>

      {/* Help text */}
      <p className="text-white/30 text-[10px] sm:text-xs text-center hidden sm:block">
        {turnPhase === "draw" && "Draw a card from the stock pile or take the top discard"}
        {turnPhase === "play" && (
          <>
            {!hasLaidInitialMeld
              ? `Lay down melds until you reach ${initialMeldThreshold}+ pts with a clean sequence`
              : "Select cards to meld, or select 1 card to discard"}
          </>
        )}
        {turnPhase === "discard" && "Select one card to discard"}
      </p>
    </div>
  );
}
