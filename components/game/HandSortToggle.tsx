"use client";

import { ArrowUpDown, SortAsc } from "lucide-react";
import { SortMode } from "@/hooks/useHandOrder";
import { cn } from "@/lib/utils";

interface HandSortToggleProps {
  sortMode: SortMode;
  onToggle: () => void;
  disabled?: boolean;
}

export function HandSortToggle({ sortMode, onToggle, disabled = false }: HandSortToggleProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
        "bg-black/30 text-white/70 hover:bg-black/40 hover:text-white/90",
        "transition-colors duration-150",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
      title={sortMode === "auto" ? "Switch to manual sorting" : "Switch to auto-sort"}
    >
      {sortMode === "auto" ? (
        <>
          <SortAsc className="w-3.5 h-3.5" />
          <span>Auto Sort</span>
        </>
      ) : (
        <>
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>Manual</span>
        </>
      )}
    </button>
  );
}
