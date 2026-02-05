"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button, Input, Card, CardContent } from "@/components/ui";
import { Loader2, ArrowRight } from "lucide-react";

interface JoinGameFormProps {
  playerId: Id<"players">;
  onGameJoined: (gameId: Id<"games">) => void;
  initialCode?: string;
}

export function JoinGameForm({ playerId, onGameJoined, initialCode = "" }: JoinGameFormProps) {
  const [code, setCode] = useState(initialCode);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinGame = useMutation(api.games.joinGame);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (code.length !== 6) {
      setError("Game code must be 6 characters");
      return;
    }

    setIsJoining(true);

    try {
      const gameId = await joinGame({
        playerId,
        code: code.toUpperCase(),
      });
      onGameJoined(gameId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join game");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Card className="bg-emerald-900/50 border-emerald-700/50">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-emerald-100">
              Game Code
            </label>
            <Input
              placeholder="ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              className="text-center text-2xl tracking-[0.3em] font-mono bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-emerald-500 h-14"
              maxLength={6}
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isJoining || code.length !== 6}
            className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold disabled:opacity-50"
          >
            {isJoining ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                Join Game
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
