"use client";

import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button, Badge, Spinner, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Copy, LogOut, Play, Users, Crown, Check } from "lucide-react";
import { useState } from "react";

interface WaitingRoomProps {
  gameId: Id<"games">;
  playerId: Id<"players">;
  onLeave: () => void;
  onGameStart: () => void;
}

export function WaitingRoom({ gameId, playerId, onLeave, onGameStart }: WaitingRoomProps) {
  const [copied, setCopied] = useState(false);
  const game = useQuery(api.games.getGameState, { gameId, playerId });
  const startGame = useMutation(api.games.startGame);
  const leaveGame = useMutation(api.games.leaveGame);

  // Handle game start in useEffect to avoid setState during render
  useEffect(() => {
    if (game?.status === "playing") {
      onGameStart();
    }
  }, [game?.status, onGameStart]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(game?.code || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Spinner className="text-white" size="lg" />
        <span className="text-white/60 text-sm">Loading game...</span>
      </div>
    );
  }

  // Show loading while transitioning
  if (game.status === "playing") {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Spinner className="text-white" size="lg" />
        <span className="text-white/80">Starting game...</span>
      </div>
    );
  }

  const isHost = game.hostPlayerId === playerId;
  const canStart = game.players.length >= 2;

  const handleStart = async () => {
    try {
      await startGame({ playerId, gameId });
    } catch (err) {
      console.error("Failed to start game:", err);
    }
  };

  const handleLeave = async () => {
    try {
      await leaveGame({ playerId, gameId });
      onLeave();
    } catch (err) {
      console.error("Failed to leave game:", err);
    }
  };

  return (
    <Card className="bg-emerald-900/50 border-emerald-700/50">
      <CardContent className="p-6 space-y-6">
        {/* Header with game name and code */}
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-white">{game.name}</h2>
          <div className="inline-flex items-center gap-3 bg-black/30 rounded-xl px-4 py-3">
            <div className="text-left">
              <div className="text-emerald-200/60 text-xs uppercase tracking-wider">Game Code</div>
              <div className="text-white font-mono text-2xl tracking-[0.2em]">{game.code}</div>
            </div>
            <button
              onClick={handleCopy}
              className={cn(
                "p-2 rounded-lg transition-all",
                copied
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              )}
              title="Copy code"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Players list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-emerald-200/80 text-sm font-medium">
              <Users className="h-4 w-4" />
              Players
            </span>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              {game.players.length}/{game.maxPlayers}
            </Badge>
          </div>

          <div className="space-y-2">
            {game.players.map((player) => (
              <div
                key={player.playerId}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 transition-all",
                  player.playerId === playerId
                    ? "bg-amber-500/10 border border-amber-500/30"
                    : "bg-black/20 border border-transparent"
                )}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                  style={{ backgroundColor: player.avatarColor }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-white flex-1 font-medium">{player.name}</span>
                {player.playerId === game.hostPlayerId && (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                    <Crown className="h-3 w-3 mr-1" />
                    Host
                  </Badge>
                )}
                {player.playerId === playerId && (
                  <Badge className="bg-white/10 text-white/80 border-white/20">You</Badge>
                )}
              </div>
            ))}

            {Array.from({ length: game.maxPlayers - game.players.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-3 border border-dashed border-white/10 rounded-xl px-4 py-3"
              >
                <div className="w-10 h-10 rounded-full bg-white/5" />
                <span className="text-white/30">Waiting for player...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleLeave}
            className="flex-1 h-11 border-white/20 text-white hover:bg-white/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Leave
          </Button>
          {isHost && (
            <Button
              onClick={handleStart}
              disabled={!canStart}
              className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold disabled:opacity-50"
            >
              <Play className="h-4 w-4 mr-2" />
              {canStart ? "Start Game" : `Need ${2 - game.players.length} more`}
            </Button>
          )}
        </div>

        {!isHost && (
          <p className="text-center text-emerald-200/50 text-sm">
            Waiting for host to start the game...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
