"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSession } from "@/hooks";
import { GameBoard } from "@/components/game";
import { Spinner, Button } from "@/components/ui";

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = useSession();
  const [playerId, setPlayerId] = useState<Id<"players"> | null>(null);

  const gameId = params.gameId as Id<"games">;

  const player = useQuery(api.players.getPlayer, sessionId ? { sessionId } : "skip");
  const game = useQuery(api.games.getGame, gameId ? { gameId } : "skip");

  // Set player ID when loaded
  useEffect(() => {
    if (player) {
      setPlayerId(player._id);
    }
  }, [player]);

  // Redirect if game doesn't exist or player not in game
  useEffect(() => {
    if (game === null) {
      router.push("/lobby");
    } else if (game && player) {
      const isInGame = game.players.some((p) => p.playerId === player._id);
      if (!isInGame) {
        router.push("/lobby");
      }
    }
  }, [game, player, router]);

  if (!sessionId || !playerId || !game) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center felt-texture">
        <Spinner className="text-white" size="lg" />
        <p className="text-white/60 mt-4">Loading game...</p>
      </main>
    );
  }

  // If game is still in waiting status, show waiting message
  if (game.status === "waiting") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center felt-texture p-4">
        <div className="bg-green-900/80 backdrop-blur rounded-2xl shadow-2xl border border-white/10 p-6 text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">Game Not Started</h1>
          <p className="text-white/60 mb-6">
            The game hasn't started yet. Please wait for the host to start the game.
          </p>
          <Button onClick={() => router.push("/lobby")}>Back to Lobby</Button>
        </div>
      </main>
    );
  }

  return <GameBoard gameId={gameId} playerId={playerId} />;
}
