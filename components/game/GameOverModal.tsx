"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { Trophy, ArrowLeft, ArrowRight } from "lucide-react";

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
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400" />
            {isRoundEnd ? "Round Over!" : "Game Over!"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Winner announcement */}
          <div className="text-center">
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3 shadow-lg ring-4 ring-amber-400/30"
              style={{ backgroundColor: winner?.avatarColor || "#666" }}
            >
              {winner?.name.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-lg font-bold text-white">
              {winner?.name}
            </h3>
            <p className="text-amber-400 text-sm">
              {isRoundEnd ? "wins the round!" : "wins the game!"}
            </p>
          </div>

          {/* Scores */}
          <div className="space-y-2">
            {sortedPlayers.map((player, index) => (
              <div
                key={player.playerId}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl transition-all",
                  player.playerId === winnerId
                    ? "bg-emerald-500/20 border border-emerald-500/30"
                    : "bg-white/5 border border-white/5"
                )}
              >
                <span
                  className={cn(
                    "font-bold w-6 text-center",
                    index === 0 ? "text-amber-400" : "text-white/40"
                  )}
                >
                  {index + 1}
                </span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md"
                  style={{ backgroundColor: player.avatarColor }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-white flex-1 truncate">{player.name}</span>
                <span
                  className={cn(
                    "font-bold tabular-nums",
                    player.playerId === winnerId ? "text-emerald-400" : "text-white/70"
                  )}
                >
                  {player.score} pts
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onBackToLobby}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Lobby
            </Button>
            {isRoundEnd && onNextRound && (
              <Button
                onClick={onNextRound}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-amber-950"
              >
                Next Round
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
