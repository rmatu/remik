"use client";

import { cn } from "@/lib/utils";

interface StockPileProps {
  count: number;
  onClick?: () => void;
  disabled?: boolean;
}

export function StockPile({ count, onClick, disabled = false }: StockPileProps) {
  const isInteractive = onClick && !disabled && count > 0;

  return (
    <button
      onClick={onClick}
      disabled={disabled || !onClick || count === 0}
      className={cn(
        "relative w-14 h-[78px] sm:w-16 sm:h-[88px] transition-all duration-150",
        isInteractive && "cursor-pointer hover:scale-105 active:scale-95",
        !isInteractive && "cursor-default",
        disabled && "opacity-50"
      )}
    >
      {/* Stacked card effect */}
      {count > 0 && (
        <>
          <div className="absolute inset-0 bg-slate-800 rounded-lg transform translate-x-1 translate-y-1 opacity-50" />
          <div className="absolute inset-0 bg-slate-700 rounded-lg transform translate-x-0.5 translate-y-0.5 opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-lg shadow-xl border border-slate-600 flex items-center justify-center">
            <div className="w-[70%] h-[70%] border border-slate-500/40 rounded-sm flex items-center justify-center">
              <span className="text-slate-400/60 font-bold text-lg sm:text-xl">R</span>
            </div>
          </div>
        </>
      )}

      {/* Card count */}
      <div className="absolute -bottom-1.5 -right-1.5 bg-white text-slate-900 text-[10px] sm:text-xs font-bold rounded-full min-w-5 h-5 sm:min-w-6 sm:h-6 px-1 flex items-center justify-center shadow-lg border border-slate-200">
        {count}
      </div>

      {/* Empty state */}
      {count === 0 && (
        <div className="w-full h-full bg-black/20 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center">
          <span className="text-white/20 text-[10px] sm:text-xs">Empty</span>
        </div>
      )}
    </button>
  );
}
