"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Trophy, Crown, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

interface PlayerResult {
  playerId: string;
  name: string;
  avatarColor: string;
  score: number;
}

interface GameOverModalProps {
  isOpen: boolean;
  players: PlayerResult[];
  winnerId: string;
  isRoundEnd?: boolean;
  onNextRound?: () => void;
  onBackToLobby: () => void;
}

export function GameOverModal({
  isOpen,
  players,
  winnerId,
  isRoundEnd = false,
  onNextRound,
  onBackToLobby,
}: GameOverModalProps) {
  const sortedPlayers = [...players].sort((a, b) => a.score - b.score);
  const winner = players.find((p) => p.playerId === winnerId);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="bg-gradient-to-b from-slate-800 to-slate-900 border-slate-700/50 text-white max-w-sm p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 px-6 pt-8 pb-6">
          {/* Decorative sparkles */}
          <Sparkles className="absolute top-4 left-6 h-4 w-4 text-amber-400/60" />
          <Sparkles className="absolute top-6 right-8 h-3 w-3 text-amber-400/40" />
          <Sparkles className="absolute bottom-8 left-12 h-3 w-3 text-amber-400/30" />

          {/* Winner display */}
          <div className="text-center relative">
            {/* Crown */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full">
              <Crown className="h-8 w-8 text-amber-400 drop-shadow-lg" fill="currentColor" />
            </div>

            {/* Avatar */}
            <div
              className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-xl ring-4 ring-amber-400/50 ring-offset-2 ring-offset-slate-800"
              style={{ backgroundColor: winner?.avatarColor || "#666" }}
            >
              {winner?.name.charAt(0).toUpperCase()}
            </div>

            {/* Winner name and status */}
            <h2 className="text-2xl font-bold text-white mt-4">
              {winner?.name}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Trophy className="h-4 w-4 text-amber-400" />
              <p className="text-amber-400 font-medium">
                {isRoundEnd ? "Wins the round!" : "Wins the game!"}
              </p>
            </div>
          </div>
        </div>

        {/* Scores section */}
        <div className="px-6 py-5 space-y-5">
          <div className="space-y-2">
            {sortedPlayers.map((player, index) => {
              const isWinner = player.playerId === winnerId;
              const position = index + 1;

              return (
                <div
                  key={player.playerId}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all",
                    isWinner
                      ? "bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border border-emerald-500/30"
                      : "bg-white/5 border border-white/5"
                  )}
                >
                  {/* Position */}
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold",
                      position === 1
                        ? "bg-amber-400 text-amber-950"
                        : position === 2
                        ? "bg-slate-400 text-slate-900"
                        : "bg-amber-700 text-amber-200"
                    )}
                  >
                    {position}
                  </div>

                  {/* Avatar */}
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md flex-shrink-0"
                    style={{ backgroundColor: player.avatarColor }}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Name */}
                  <span className="text-white flex-1 truncate font-medium">
                    {player.name}
                  </span>

                  {/* Score */}
                  <div className="text-right">
                    <span
                      className={cn(
                        "font-bold tabular-nums text-lg",
                        isWinner ? "text-emerald-400" : "text-white/80"
                      )}
                    >
                      {player.score}
                    </span>
                    <span className={cn(
                      "text-xs ml-1",
                      isWinner ? "text-emerald-400/70" : "text-white/40"
                    )}>
                      pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Note about scoring */}
          <p className="text-center text-white/40 text-xs">
            Lower score is better. First to reach the target score loses!
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onBackToLobby}
              className="flex-1 h-11 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Lobby
            </Button>
            {isRoundEnd && onNextRound && (
              <Button
                onClick={onNextRound}
                className="flex-1 h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 font-semibold shadow-lg shadow-amber-500/25"
              >
                Next Round
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
