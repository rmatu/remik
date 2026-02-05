# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start Next.js dev server (frontend)
npm run dev

# Start Convex backend (run in separate terminal)
npx convex dev

# Both must run simultaneously for full development

# Production build
npm run build

# Linting
npm run lint
```

**Prerequisites:** Node.js 18+, Convex account

**Environment setup:** Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_CONVEX_URL` to your Convex deployment URL.

## Architecture Overview

Remik is a real-time multiplayer Polish Rummy card game with a clear frontend/backend separation:

### Frontend (Next.js App Router)
- **`app/`** - Pages: landing (`/`), lobby (`/lobby`), game (`/game/[gameId]`)
- **`components/game/`** - Game UI: GameBoard, PlayingCard, PlayerHand, MeldBuilder, MeldZone, StockPile, DiscardPile
- **`components/lobby/`** - Lobby UI: CreateGameForm, JoinGameForm, WaitingRoom
- **`components/ui/`** - Shadcn components (New York style)
- **`hooks/`** - useGame, useGameActions, useCardSelection, useSession
- **`providers/ConvexClientProvider.tsx`** - Convex client setup with anonymous sessions

### Backend (Convex)
- **`convex/schema.ts`** - Database schema (players, games tables)
- **`convex/games.ts`** - Game mutations/queries (create, join, start)
- **`convex/players.ts`** - Player management
- **`convex/actions.ts`** - Game actions (draw, meld, discard)
- **`convex/helpers/`** - deck.ts (shuffling), meldValidation.ts (rules)
- **`convex/_generated/`** - Auto-generated types (don't edit)

### Key Data Flow
1. Players join via anonymous Convex sessions (no login required)
2. Game state lives entirely in Convex `games` table
3. React hooks subscribe to real-time Convex queries
4. User actions call Convex mutations which validate and update state
5. All connected clients receive instant updates via Convex subscriptions

### Game State Model (`convex/schema.ts`)
- **Game status:** `waiting` → `playing` → `round_end` → `finished`
- **Turn phases:** `draw` → `play` → `discard`
- **Player state:** hand (cards), score, hasLaidInitialMeld, seatPosition
- **Table state:** stockPile, discardPile, tableMelds

## Game Rules (Remik/Polish Rummy)

- **Melds:** Sequences (3+ same suit consecutive) or Groups (3-4 same rank, different suits)
- **Initial meld:** Requires 30+ points AND at least one clean sequence (no jokers)
- **Jokers:** Substitute any card, max 1 in 3-card group, max 2 in 4-card group, no adjacent jokers in sequences
- **Scoring:** A=1-11, Face=10, Number=face value, Joker=30 penalty
- **Deck:** 1 deck (54 cards) for 2 players, 2 decks for 3-4 players

## Type System

Core types in `lib/types.ts`:
- `Card` - suit (hearts/diamonds/clubs/spades/joker), rank (A-K/joker), isJoker
- `Meld` - id, type (sequence/group), cards array
- `GameStatus`, `TurnPhase` - state machine types

Convex validators in `convex/schema.ts` mirror these types for runtime validation.
