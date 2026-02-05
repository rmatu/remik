import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game in Progress",
  description: "Play Remik - Polish Rummy card game",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
