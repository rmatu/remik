"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import { Card, Suit, SUIT_SYMBOLS } from "@/lib/types";

interface PlayingCardProps {
  card: Card;
  isSelected?: boolean;
  isFaceDown?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SUIT_COLORS: Record<Suit | "joker", string> = {
  hearts: "#e11d48",
  diamonds: "#e11d48",
  clubs: "#18181b",
  spades: "#18181b",
  joker: "#7c3aed",
};

const sizeConfig = {
  sm: {
    card: "w-9 h-[52px]",
    rank: "text-[9px] leading-none",
    suit: "text-[8px] leading-none",
    centerSuit: "text-sm",
    jokerStar: "text-sm",
    jokerText: "text-[6px]",
  },
  md: {
    card: "w-11 h-[62px]",
    rank: "text-[11px] leading-none",
    suit: "text-[10px] leading-none",
    centerSuit: "text-lg",
    jokerStar: "text-lg",
    jokerText: "text-[7px]",
  },
  lg: {
    card: "w-14 h-[78px]",
    rank: "text-sm leading-none",
    suit: "text-xs leading-none",
    centerSuit: "text-2xl",
    jokerStar: "text-2xl",
    jokerText: "text-[9px]",
  },
};

export const PlayingCard = memo(function PlayingCard({
  card,
  isSelected = false,
  isFaceDown = false,
  onClick,
  disabled = false,
  size = "md",
  className = "",
}: PlayingCardProps) {
  const config = sizeConfig[size];

  const getSuitSymbol = (suit: Suit | "joker") => {
    if (suit === "joker") return "\u2605";
    return SUIT_SYMBOLS[suit];
  };

  const getColor = (suit: Suit | "joker") => SUIT_COLORS[suit];

  // Face down card
  if (isFaceDown) {
    return (
      <div
        className={cn(
          config.card,
          "rounded-md shadow-md overflow-hidden",
          "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900",
          "border border-slate-600",
          "flex items-center justify-center",
          className
        )}
      >
        <div className="w-[70%] h-[70%] border border-slate-500/40 rounded-sm flex items-center justify-center">
          <span className="text-slate-400/60 font-bold text-xs">R</span>
        </div>
      </div>
    );
  }

  // Joker card
  if (card.isJoker) {
    return (
      <button
        onClick={onClick}
        disabled={disabled || !onClick}
        className={cn(
          config.card,
          "rounded-md shadow-md overflow-hidden",
          "bg-gradient-to-br from-white via-gray-50 to-gray-100",
          "border border-gray-200",
          "flex flex-col items-center justify-center gap-0.5",
          "transition-all duration-150 ease-out",
          onClick && !disabled && "cursor-pointer hover:shadow-lg active:scale-95",
          !onClick && "cursor-default",
          disabled && "opacity-50",
          isSelected && "ring-2 ring-amber-400 ring-offset-1 shadow-lg",
          className
        )}
      >
        <span className={cn(config.jokerStar, "leading-none")} style={{ color: getColor("joker") }}>
          {getSuitSymbol("joker")}
        </span>
        <span className={cn(config.jokerText, "font-bold leading-none")} style={{ color: getColor("joker") }}>
          JOKER
        </span>
      </button>
    );
  }

  // Regular card
  const suitColor = getColor(card.suit as Suit);
  const suitSymbol = getSuitSymbol(card.suit as Suit);

  return (
    <button
      onClick={onClick}
      disabled={disabled || !onClick}
      className={cn(
        config.card,
        "rounded-md shadow-md overflow-hidden",
        "bg-gradient-to-br from-white via-gray-50 to-gray-100",
        "border border-gray-200",
        "flex flex-col justify-between p-1",
        "transition-all duration-150 ease-out",
        onClick && !disabled && "cursor-pointer hover:shadow-lg active:scale-95",
        !onClick && "cursor-default",
        disabled && "opacity-50",
        isSelected && "ring-2 ring-amber-400 ring-offset-1 shadow-lg",
        className
      )}
    >
      {/* Top left corner */}
      <div className="flex flex-col items-start" style={{ color: suitColor }}>
        <span className={cn(config.rank, "font-bold")}>{card.rank}</span>
        <span className={config.suit}>{suitSymbol}</span>
      </div>

      {/* Center suit */}
      <div className="flex-1 flex items-center justify-center -my-1">
        <span className={config.centerSuit} style={{ color: suitColor }}>
          {suitSymbol}
        </span>
      </div>

      {/* Bottom right corner (rotated) */}
      <div className="flex flex-col items-end rotate-180" style={{ color: suitColor }}>
        <span className={cn(config.rank, "font-bold")}>{card.rank}</span>
        <span className={config.suit}>{suitSymbol}</span>
      </div>
    </button>
  );
});
