"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useSession } from "@/hooks";
import { Button, Input, Spinner, Card, CardContent } from "@/components/ui";
import { CreateGameForm, JoinGameForm, WaitingRoom } from "@/components/lobby";
import { ArrowLeft, ArrowRight, Plus, Users, Loader2 } from "lucide-react";

type LobbyState = "name" | "choice" | "create" | "join" | "waiting";

export default function LobbyPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex flex-col items-center justify-center felt-texture">
          <Spinner className="text-white" size="lg" />
          <span className="text-white/60 text-sm mt-3">Loading...</span>
        </main>
      }
    >
      <LobbyContent />
    </Suspense>
  );
}

function LobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = useSession();
  const [state, setState] = useState<LobbyState>("name");
  const [playerName, setPlayerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [playerId, setPlayerId] = useState<Id<"players"> | null>(null);
  const [gameId, setGameId] = useState<Id<"games"> | null>(null);

  // Get invite code from URL if present
  const inviteCode = searchParams.get("code")?.toUpperCase() || "";

  const getOrCreatePlayer = useMutation(api.players.getOrCreatePlayer);
  const existingPlayer = useQuery(
    api.players.getPlayer,
    sessionId ? { sessionId } : "skip"
  );

  // Auto-fill name from existing player
  useEffect(() => {
    if (existingPlayer) {
      setPlayerName(existingPlayer.name);
    }
  }, [existingPlayer]);

  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || !playerName.trim()) return;

    setIsSubmitting(true);
    try {
      const id = await getOrCreatePlayer({
        sessionId,
        name: playerName.trim(),
      });
      setPlayerId(id);
      // If we have an invite code, go directly to join
      setState(inviteCode ? "join" : "choice");
    } catch (err) {
      console.error("Failed to create player:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGameCreated = (id: Id<"games">, code: string) => {
    setGameId(id);
    setState("waiting");
  };

  const handleGameJoined = (id: Id<"games">) => {
    setGameId(id);
    setState("waiting");
  };

  const handleLeave = () => {
    setGameId(null);
    setState("choice");
  };

  const handleGameStart = () => {
    if (gameId) {
      router.push(`/game/${gameId}`);
    }
  };

  if (!sessionId) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center felt-texture">
        <Spinner className="text-white" size="lg" />
        <span className="text-white/60 text-sm mt-3">Initializing...</span>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 felt-texture">
      <div className="w-full max-w-md">
        {state === "name" && (
          <Card className="bg-emerald-900/80 backdrop-blur border-emerald-700/50 shadow-2xl">
            <CardContent className="p-6">
              <form onSubmit={handleNameSubmit} className="space-y-6">
                <div className="text-center mb-2">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg mb-4">
                    <span className="text-2xl font-bold text-amber-950">R</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white">
                    {inviteCode ? "You're Invited!" : "Welcome to Remik"}
                  </h1>
                  <p className="text-emerald-200/60 mt-1">
                    {inviteCode
                      ? "Enter your name to join the game"
                      : "Enter your name to get started"}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emerald-100">
                    Your Name
                  </label>
                  <Input
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={20}
                    autoFocus
                    className="bg-black/20 border-white/10 text-white placeholder:text-white/40 focus:border-emerald-500 h-12 text-base"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!playerName.trim() || isSubmitting}
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      {inviteCode ? "Join Game" : "Continue"}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {state === "choice" && playerId !== null && (
          <Card className="bg-emerald-900/80 backdrop-blur border-emerald-700/50 shadow-2xl">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-white">Hello, {playerName}!</h1>
                  <p className="text-emerald-200/60 mt-1">What would you like to do?</p>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => setState("create")}
                    className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-amber-950 font-semibold"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Game
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setState("join")}
                    className="w-full h-12 bg-transparent border-white/20 text-white hover:bg-white/10"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Join Existing Game
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {state === "create" && playerId !== null && (
          <div className="space-y-4">
            <button
              onClick={() => setState("choice")}
              className="flex items-center gap-2 text-emerald-200/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div>
              <h1 className="text-2xl font-bold text-white mb-4">Create Game</h1>
              <CreateGameForm playerId={playerId} onGameCreated={handleGameCreated} />
            </div>
          </div>
        )}

        {state === "join" && playerId !== null && (
          <div className="space-y-4">
            <button
              onClick={() => setState("choice")}
              className="flex items-center gap-2 text-emerald-200/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div>
              <h1 className="text-2xl font-bold text-white mb-4">Join Game</h1>
              <JoinGameForm playerId={playerId} onGameJoined={handleGameJoined} initialCode={inviteCode} />
            </div>
          </div>
        )}

        {state === "waiting" && playerId !== null && gameId !== null && (
          <WaitingRoom
            gameId={gameId}
            playerId={playerId}
            onLeave={handleLeave}
            onGameStart={handleGameStart}
          />
        )}
      </div>
    </main>
  );
}
