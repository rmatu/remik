"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { Play, Users, Zap, Info, ChevronDown } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 felt-texture">
      <div className="text-center space-y-8 max-w-md w-full">
        {/* Logo & Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl shadow-amber-500/20 mb-2">
            <span className="text-4xl font-bold text-amber-950">R</span>
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight">Remik</h1>
          <p className="text-emerald-200/70 text-lg">Polish Rummy Card Game</p>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-4">
          <Link href="/lobby" className="block">
            <Button className="w-full h-14 text-lg font-semibold bg-amber-500 hover:bg-amber-600 text-amber-950 shadow-lg shadow-amber-500/20">
              <Play className="h-5 w-5 mr-2" />
              Play Now
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="flex justify-center gap-6 text-emerald-200/60 text-sm">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>2-4 players</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4" />
            <span>Real-time</span>
          </div>
        </div>

        <p className="text-emerald-200/40 text-sm">No account required</p>

        {/* How to Play */}
        <div className="pt-6 border-t border-white/10">
          <details className="text-left group">
            <summary className="flex items-center justify-between text-emerald-200/70 cursor-pointer hover:text-white transition-colors p-2 -m-2 rounded-lg">
              <span className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                How to Play
              </span>
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-4 bg-black/20 rounded-xl p-4 text-emerald-200/60 text-sm space-y-3">
              <p>
                <strong className="text-emerald-100">Goal:</strong> Get rid of all your cards by forming melds.
              </p>
              <p>
                <strong className="text-emerald-100">Melds:</strong> Sequences (3+ consecutive same suit) or Groups (3-4 same rank, different suits).
              </p>
              <p>
                <strong className="text-emerald-100">First meld:</strong> Requires 30+ points AND at least one clean sequence (no jokers).
              </p>
              <p>
                <strong className="text-emerald-100">Turn:</strong> Draw a card, optionally play melds, then discard.
              </p>
              <p>
                <strong className="text-emerald-100">Scoring:</strong> When someone wins, others score penalty points for cards in hand. First to 300 loses!
              </p>
            </div>
          </details>
        </div>
      </div>
    </main>
  );
}
