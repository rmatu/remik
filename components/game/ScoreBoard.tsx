"use client";

import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Trophy, TrendingDown } from "lucide-react";

interface PlayerScore {
  playerId: string;
  name: string;
  avatarColor: string;
  score: number;
  isCurrentPlayer: boolean;
}

interface ScoreBoardProps {
  players: PlayerScore[];
  targetScore: number;
  currentRound: number;
}

export function ScoreBoard({ players, targetScore, currentRound }: ScoreBoardProps) {
  const sortedPlayers = [...players].sort((a, b) => a.score - b.score);

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          Scores
        </h3>
        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
          Round {currentRound}
        </Badge>
      </div>

      <div className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const percentage = (player.score / targetScore) * 100;
          const isLeading = index === 0;
          const isLosing = player.score >= targetScore;

          return (
            <div
              key={player.playerId}
              className={cn(
                "rounded-xl p-2.5 transition-all duration-200",
                player.isCurrentPlayer && "bg-white/10 ring-1 ring-white/20"
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
                  style={{ backgroundColor: player.avatarColor }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-white text-sm flex-1 truncate">{player.name}</span>
                <span
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    isLosing && "text-red-400",
                    isLeading && !isLosing && "text-emerald-400",
                    !isLeading && !isLosing && "text-white"
                  )}
                >
                  {player.score}
                </span>
              </div>
              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500 ease-out rounded-full",
                    isLosing && "bg-red-500",
                    percentage > 66 && !isLosing && "bg-amber-500",
                    percentage <= 66 && "bg-emerald-500"
                  )}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-1.5 text-white/30 text-xs mt-3">
        <TrendingDown className="h-3 w-3" />
        <span>First to {targetScore} loses</span>
      </div>
    </div>
  );
}
