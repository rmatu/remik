"use client";

import { Reorder, useDragControls } from "framer-motion";
import { Card } from "@/lib/types";
import { PlayingCard } from "./PlayingCard";

interface DraggableCardProps {
  card: Card;
  isSelected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  index: number;
  overlap: number;
}

export function DraggableCard({
  card,
  isSelected = false,
  onClick,
  disabled = false,
  index,
  overlap,
}: DraggableCardProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={card}
      dragControls={dragControls}
      dragListener={!disabled}
      className="relative flex-shrink-0"
      style={{
        marginLeft: index === 0 ? 0 : overlap,
        zIndex: isSelected ? 50 : index,
      }}
      whileDrag={{
        scale: 1.1,
        zIndex: 100,
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        rotate: 3,
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
    >
      <PlayingCard
        card={card}
        isSelected={isSelected}
        onClick={onClick}
        disabled={disabled}
        size="md"
      />
    </Reorder.Item>
  );
}
