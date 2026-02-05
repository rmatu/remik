# Remik - Polish Rummy Card Game

A real-time multiplayer Remik (Polish Rummy) card game built with Next.js, Convex, and Tailwind CSS.

## Features

- 2-4 players real-time multiplayer
- Anonymous sessions (no login required)
- CSS-based playing cards
- Smooth card animations with Framer Motion
- Mobile-responsive design

## Tech Stack

- **Next.js 16** - React framework with App Router
- **Convex** - Real-time backend & game state
- **Tailwind CSS 3** - Utility-first styling
- **Framer Motion** - Card animations

## Getting Started

### Prerequisites

- Node.js 18+
- Convex account (free at [convex.dev](https://convex.dev))

### Installation

1. Clone the repository and install dependencies:

```bash
cd remik
npm install
```

2. Set up Convex:

```bash
npx convex dev
```

This will prompt you to log in to Convex and create a new project. The CLI will generate the necessary types in `convex/_generated/`.

3. Copy the environment file and update with your Convex URL:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set `NEXT_PUBLIC_CONVEX_URL` to your Convex deployment URL (from the Convex dashboard).

4. Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play.

## Game Rules

### Setup
- 2-4 players
- 1 deck (52 cards + 2 jokers) for 2 players, 2 decks for 3-4 players
- Each player gets 13 cards, dealer gets 14

### Valid Melds
1. **Sequences**: 3+ consecutive cards of the same suit (e.g., 5♥ 6♥ 7♥)
2. **Groups**: 3-4 cards of the same rank, different suits (e.g., 7♥ 7♦ 7♣)

### Gameplay Flow
1. Dealer starts by discarding one card
2. Each turn: Draw (from stock OR discard) → Play (optional melds) → Discard
3. First meld requires **30+ points** AND at least one **clean sequence** (no jokers)
4. After initial meld, can add cards to any meld on table or replace jokers

### Joker Rules
- Substitutes any card
- Max 1 joker in 3-card group, max 2 in 4-card group
- Cannot have 2 adjacent jokers in sequence
- Worth **30 penalty points**

### Scoring
- Ace: 1 or 11 points
- Face cards (J, Q, K): 10 points
- Number cards: face value
- Joker: 30 penalty points
- Game ends at 300 penalty points, lowest score wins

## Project Structure

```
remik/
├── app/                    # Next.js app router pages
│   ├── page.tsx           # Landing page
│   ├── lobby/page.tsx     # Create/join games
│   └── game/[gameId]/     # Main game view
├── components/
│   ├── ui/                # Reusable UI components
│   ├── game/              # Game-specific components
│   └── lobby/             # Lobby components
├── convex/                # Convex backend
│   ├── schema.ts          # Database schema
│   ├── games.ts           # Game mutations/queries
│   ├── players.ts         # Player management
│   ├── actions.ts         # Game actions
│   └── helpers/           # Validation helpers
├── hooks/                 # React hooks
├── lib/                   # Types and utilities
└── providers/             # Context providers
```

## Development

```bash
# Run development server
npm run dev

# Run Convex backend (in separate terminal)
npx convex dev

# Build for production
npm run build

# Run linter
npm run lint
```

## License

MIT
