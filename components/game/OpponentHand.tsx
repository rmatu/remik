"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { CreditCard } from "lucide-react";

interface OpponentHandProps {
  name: string;
  cardCount: number;
  avatarColor: string;
  isCurrentTurn: boolean;
  score: number;
  position: "top" | "left" | "right";
}

export function OpponentHand({
  name,
  cardCount,
  avatarColor,
  isCurrentTurn,
  score,
}: OpponentHandProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 bg-black/30 backdrop-blur-sm rounded-xl px-3 py-2 border transition-all duration-200",
        isCurrentTurn
          ? "border-amber-400/70 bg-amber-500/10 shadow-lg shadow-amber-500/10"
          : "border-white/5"
      )}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md"
        style={{ backgroundColor: avatarColor }}
      >
        {name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-white text-sm font-medium truncate max-w-[80px]">
            {name}
          </span>
          {isCurrentTurn && (
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px] px-1 py-0">
              Turn
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-white/50 text-xs mt-0.5">
          <span className="flex items-center gap-1">
            <CreditCard className="h-3 w-3" />
            {cardCount}
          </span>
          <span className="text-white/30">|</span>
          <span>{score} pts</span>
        </div>
      </div>
    </div>
  );
}
