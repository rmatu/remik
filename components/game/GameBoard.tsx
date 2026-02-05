"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useGame, useGameActions, useCardSelection, useHandOrder } from "@/hooks";
import { Card } from "@/lib/types";
import { HandSortToggle } from "./HandSortToggle";
import { PlayerHand } from "./PlayerHand";
import { OpponentHand } from "./OpponentHand";
import { StockPile } from "./StockPile";
import { DiscardPile } from "./DiscardPile";
import { MeldZone } from "./MeldZone";
import { MeldBuilder } from "./MeldBuilder";
import { GameControls } from "./GameControls";
import { ScoreBoard } from "./ScoreBoard";
import { GameOverModal } from "./GameOverModal";
import { Spinner, Badge } from "@/components/ui";

interface GameBoardProps {
  gameId: Id<"games">;
  playerId: Id<"players">;
}

export function GameBoard({ gameId, playerId }: GameBoardProps) {
  const router = useRouter();
  const { gameState, currentPlayer, otherPlayers, isMyTurn, isLoading } = useGame(
    gameId,
    playerId
  );
  const {
    drawFromStock,
    drawFromDiscard,
    discardCard,
    layDownInitialMelds,
    layDownMeld,
    addToMeld,
    replaceJoker,
    takeBackPendingMeld,
    resetTurn,
    error,
    clearError,
    isLoading: isActionLoading,
  } = useGameActions(gameId, playerId);
  const {
    selectedCardIds,
    selectedCount,
    toggleCard,
    clearSelection,
    getSelectedCards,
    getSelectedCardIds,
  } = useCardSelection();
  const {
    sortMode,
    toggleSortMode,
    getOrderedCards,
    setCardOrder,
    initializeManualOrder,
  } = useHandOrder(gameId);

  const [showMeldBuilder, setShowMeldBuilder] = useState(false);

  const startNextRound = useMutation(api.games.startNextRound);

  // Clear selection when turn changes
  useEffect(() => {
    if (!isMyTurn) {
      clearSelection();
      setShowMeldBuilder(false);
    }
  }, [isMyTurn, clearSelection]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Initialize manual order when switching to manual mode
  useEffect(() => {
    if (sortMode === "manual" && currentPlayer?.hand) {
      initializeManualOrder(currentPlayer.hand);
    }
  }, [sortMode, currentPlayer?.hand, initializeManualOrder]);

  const handleCardClick = useCallback(
    (cardId: string) => {
      if (!isMyTurn) return;
      toggleCard(cardId);
    },
    [isMyTurn, toggleCard]
  );

  const handleDrawFromStock = useCallback(async () => {
    clearSelection();
    await drawFromStock();
  }, [drawFromStock, clearSelection]);

  const handleDrawFromDiscard = useCallback(async () => {
    clearSelection();
    await drawFromDiscard();
  }, [drawFromDiscard, clearSelection]);

  const handleMeld = useCallback(() => {
    setShowMeldBuilder(true);
  }, []);

  const handleLayDown = useCallback(
    async (meldIds: string[][]) => {
      if (!currentPlayer) return;

      setShowMeldBuilder(false);
      if (!currentPlayer.hasLaidInitialMeld) {
        await layDownInitialMelds(meldIds);
      } else {
        // For subsequent melds, lay down one at a time
        for (const ids of meldIds) {
          await layDownMeld(ids);
        }
      }
      clearSelection();
    },
    [currentPlayer, layDownInitialMelds, layDownMeld, clearSelection]
  );

  const handleAddToMeld = useCallback(
    async (meldId: string, cardId: string) => {
      setShowMeldBuilder(false);
      await addToMeld(meldId, cardId);
      clearSelection();
    },
    [addToMeld, clearSelection]
  );

  const handleDiscard = useCallback(async () => {
    const cardIds = getSelectedCardIds();
    if (cardIds.length === 1) {
      await discardCard(cardIds[0]);
      clearSelection();
    }
  }, [discardCard, getSelectedCardIds, clearSelection]);

  const handleNextRound = useCallback(async () => {
    await startNextRound({ gameId });
  }, [startNextRound, gameId]);

  const handleBackToLobby = useCallback(() => {
    router.push("/lobby");
  }, [router]);

  const handleTakeBackMeld = useCallback(
    async (meldId: string) => {
      await takeBackPendingMeld(meldId);
    },
    [takeBackPendingMeld]
  );

  const handleReplaceJoker = useCallback(
    async (meldId: string, jokerCardId: string) => {
      const cardIds = getSelectedCardIds();
      if (cardIds.length !== 1) return;

      const selectedCardId = cardIds[0];
      const selectedCard = currentPlayer?.hand.find((c) => c.id === selectedCardId);
      if (!selectedCard || selectedCard.isJoker) return;

      await replaceJoker(meldId, jokerCardId, selectedCardId);
      clearSelection();
    },
    [replaceJoker, getSelectedCardIds, currentPlayer?.hand, clearSelection]
  );

  const handleAddCardToMeld = useCallback(
    async (meldId: string) => {
      const cardIds = getSelectedCardIds();
      if (cardIds.length !== 1) return;

      const selectedCardId = cardIds[0];
      await addToMeld(meldId, selectedCardId);
      clearSelection();
    },
    [addToMeld, getSelectedCardIds, clearSelection]
  );

  const handleResetTurn = useCallback(async () => {
    clearSelection();
    await resetTurn();
  }, [resetTurn, clearSelection]);

  if (isLoading || !gameState || !currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center felt-texture">
        <Spinner className="text-white" size="lg" />
      </div>
    );
  }

  const selectedCards = getSelectedCards(currentPlayer.hand);

  // Determine opponent positions based on player count
  const getOpponentPosition = (index: number, total: number): "top" | "left" | "right" => {
    if (total === 1) return "top";
    if (total === 2) return index === 0 ? "left" : "right";
    return index === 0 ? "left" : index === 1 ? "top" : "right";
  };

  // Find round winner (player with 0 cards)
  const roundWinner = gameState.players.find((p) => p.handCount === 0);

  return (
    <div className="min-h-[100dvh] flex flex-col felt-texture p-2 pb-16 sm:p-4 sm:pb-16 overflow-x-hidden overflow-y-auto">
      {/* Top bar: Opponent info + Scores toggle */}
      <div className="flex items-center justify-between gap-2 mb-2">
        {/* Opponents */}
        <div className="flex-1 flex flex-wrap gap-2">
          {otherPlayers.map((player) => (
            <OpponentHand
              key={player.playerId}
              name={player.name}
              cardCount={player.handCount}
              avatarColor={player.avatarColor}
              isCurrentTurn={gameState.currentTurnPlayerId === player.playerId}
              score={player.score}
              position="top"
            />
          ))}
        </div>

        {/* Round indicator (mobile) */}
        <div className="sm:hidden bg-black/30 rounded-lg px-2 py-1 text-xs text-white/70">
          R{gameState.currentRound}
        </div>
      </div>

      {/* Main game area */}
      <div className="flex-1 flex flex-col gap-2 sm:gap-4 min-h-0">
        {/* Stock and Discard piles */}
        <div className="flex justify-center items-center gap-4 sm:gap-6">
          <div className="text-center">
            <StockPile
              count={gameState.stockPileCount}
              onClick={
                isMyTurn && gameState.turnPhase === "draw" ? handleDrawFromStock : undefined
              }
              disabled={!isMyTurn || gameState.turnPhase !== "draw" || isActionLoading}
            />
            <div className="text-white/40 text-[10px] sm:text-xs mt-1">Stock</div>
          </div>
          <div className="text-center">
            <DiscardPile
              topCard={gameState.topDiscard}
              count={gameState.discardPileCount}
              onClick={
                isMyTurn && gameState.turnPhase === "draw" && gameState.topDiscard
                  ? handleDrawFromDiscard
                  : undefined
              }
              disabled={
                !isMyTurn ||
                gameState.turnPhase !== "draw" ||
                !gameState.topDiscard ||
                isActionLoading
              }
            />
            <div className="text-white/40 text-[10px] sm:text-xs mt-1">Discard</div>
          </div>
        </div>

        {/* Table melds - scrollable on mobile */}
        <div className="flex-1 min-h-0 overflow-auto">
          <MeldZone
            melds={gameState.tableMelds}
            onMeldCardClick={
              isMyTurn && currentPlayer.hasLaidInitialMeld && gameState.turnPhase === "play" && selectedCount === 1
                ? (meldId, cardId, card) => {
                    const selectedCardId = getSelectedCardIds()[0];
                    const selectedCard = currentPlayer.hand.find(
                      (c) => c.id === selectedCardId
                    );
                    if (!selectedCard) return;

                    // If clicking a joker with a non-joker card selected, try to replace it
                    if (card.isJoker && !selectedCard.isJoker) {
                      handleReplaceJoker(meldId, cardId);
                    } else {
                      // Otherwise, try to add the selected card to this meld
                      handleAddCardToMeld(meldId);
                    }
                  }
                : undefined
            }
            highlightJokers={isMyTurn && currentPlayer.hasLaidInitialMeld}
            players={gameState.players.map((p) => ({
              playerId: p.playerId.toString(),
              name: p.name,
            }))}
            initialMeldThreshold={gameState.initialMeldPoints}
            currentPlayerId={playerId.toString()}
            isMyTurn={isMyTurn && gameState.turnPhase === "play"}
            onTakeBackMeld={handleTakeBackMeld}
          />
        </div>

        {/* Meld Builder */}
        {showMeldBuilder && (
          <MeldBuilder
            selectedCards={selectedCards}
            hasLaidInitialMeld={currentPlayer.hasLaidInitialMeld}
            onLayDown={handleLayDown}
            onCancel={() => {
              setShowMeldBuilder(false);
              clearSelection();
            }}
            tableMelds={gameState.tableMelds}
            onAddToMeld={handleAddToMeld}
            pendingMeldPoints={currentPlayer.pendingMeldPoints}
            currentPlayerId={playerId.toString()}
            initialMeldThreshold={gameState.initialMeldPoints}
          />
        )}

        {/* Desktop score board */}
        <div className="hidden sm:block absolute right-4 top-4 w-64">
          <ScoreBoard
            players={gameState.players.map((p) => ({
              playerId: p.playerId,
              name: p.name,
              avatarColor: p.avatarColor,
              score: p.score,
              isCurrentPlayer: p.playerId === playerId,
            }))}
            targetScore={gameState.targetScore}
            currentRound={gameState.currentRound}
          />
        </div>
      </div>

      {/* Game controls - fixed at bottom for easy thumb access */}
      <div className="mt-auto pt-2">
        {!showMeldBuilder && (
          <GameControls
            turnPhase={gameState.turnPhase}
            isMyTurn={isMyTurn}
            hasLaidInitialMeld={currentPlayer.hasLaidInitialMeld}
            selectedCount={selectedCount}
            canDrawFromDiscard={!!gameState.topDiscard}
            onDrawFromStock={handleDrawFromStock}
            onDrawFromDiscard={handleDrawFromDiscard}
            onMeld={handleMeld}
            onDiscard={handleDiscard}
            onClearSelection={clearSelection}
            onResetTurn={handleResetTurn}
            isLoading={isActionLoading}
            error={error}
            pendingMeldPoints={currentPlayer.pendingMeldPoints}
            hasPendingCleanSequence={currentPlayer.hasPendingCleanSequence}
            initialMeldThreshold={gameState.initialMeldPoints}
          />
        )}

        {/* Player hand with sort toggle */}
        <div className="mt-2 pb-2">
          <div className="flex justify-end px-4 mb-1">
            <HandSortToggle
              sortMode={sortMode}
              onToggle={toggleSortMode}
              disabled={isActionLoading}
            />
          </div>
          <PlayerHand
            cards={currentPlayer.hand}
            selectedCardIds={selectedCardIds}
            onCardClick={handleCardClick}
            disabled={!isMyTurn || isActionLoading}
            sortMode={sortMode}
            orderedCards={getOrderedCards(currentPlayer.hand)}
            onReorder={setCardOrder}
          />
        </div>
      </div>

      {/* Game Over / Round End Modal */}
      <GameOverModal
        isOpen={gameState.status === "round_end" || gameState.status === "finished"}
        players={gameState.players.map((p) => ({
          playerId: p.playerId,
          name: p.name,
          avatarColor: p.avatarColor,
          score: p.score,
        }))}
        winnerId={roundWinner?.playerId || gameState.players[0].playerId}
        isRoundEnd={gameState.status === "round_end"}
        onNextRound={gameState.status === "round_end" ? handleNextRound : undefined}
        onBackToLobby={handleBackToLobby}
      />
    </div>
  );
}
