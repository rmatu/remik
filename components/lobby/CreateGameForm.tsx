"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button, Input, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Users, Loader2, Plus } from "lucide-react";

interface CreateGameFormProps {
  playerId: Id<"players">;
  onGameCreated: (gameId: Id<"games">, code: string) => void;
}

export function CreateGameForm({ playerId, onGameCreated }: CreateGameFormProps) {
  const [gameName, setGameName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(2);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGame = useMutation(api.games.createGame);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      const result = await createGame({
        playerId,
        name: gameName || "Remik Game",
        maxPlayers,
      });
      onGameCreated(result.gameId, result.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create game");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="bg-emerald-900/50 border-emerald-700/50">
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-emerald-100">
              Game Name (optional)
            </label>
            <Input
              placeholder="My Remik Game"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              maxLength={30}
              className="bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500"
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-emerald-100">
              <Users className="h-4 w-4" />
              Number of Players
            </label>
            <div className="flex gap-2">
              {([2, 3, 4] as const).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMaxPlayers(num)}
                  className={cn(
                    "flex-1 py-3 rounded-xl font-medium transition-all duration-200",
                    maxPlayers === num
                      ? "bg-white text-emerald-900 shadow-lg"
                      : "bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
            <p className="text-xs text-emerald-200/60">
              {maxPlayers === 2 ? "1 deck (54 cards)" : "2 decks (108 cards)"}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isCreating}
            className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold"
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Game
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
