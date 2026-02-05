"use client";

import { Card } from "@/lib/types";
import { PlayingCard } from "./PlayingCard";
import { cn } from "@/lib/utils";

interface DiscardPileProps {
  topCard?: Card | null;
  count: number;
  onClick?: () => void;
  disabled?: boolean;
}

export function DiscardPile({ topCard, count, onClick, disabled = false }: DiscardPileProps) {
  const isInteractive = onClick && !disabled && topCard;

  const handleClick = () => {
    if (isInteractive && onClick) {
      onClick();
    }
  };

  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        "relative w-14 h-[78px] sm:w-16 sm:h-[88px] transition-all duration-150",
        isInteractive && "cursor-pointer hover:scale-105 active:scale-95",
        !isInteractive && "cursor-default",
        disabled && "opacity-50"
      )}
    >
      {/* Pile indication - rotated cards underneath */}
      {count > 1 && (
        <>
          <div className="absolute inset-0 bg-gray-200 rounded-lg transform -rotate-6 translate-x-0.5 shadow-sm" />
          <div className="absolute inset-0 bg-gray-100 rounded-lg transform rotate-3 -translate-x-0.5 shadow-sm" />
        </>
      )}

      {/* Top card or empty state */}
      {topCard ? (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <PlayingCard card={topCard} size="lg" className="shadow-lg" disabled />
        </div>
      ) : (
        <div className="w-full h-full bg-black/20 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center">
          <span className="text-white/20 text-[10px] sm:text-xs text-center">Discard</span>
        </div>
      )}

      {/* Card count */}
      {count > 0 && (
        <div className="absolute -bottom-1.5 -right-1.5 bg-white text-slate-900 text-[10px] sm:text-xs font-bold rounded-full min-w-5 h-5 sm:min-w-6 sm:h-6 px-1 flex items-center justify-center shadow-lg border border-slate-200">
          {count}
        </div>
      )}
    </div>
  );
}
