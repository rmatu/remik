import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Lobby",
  description:
    "Create or join a Remik game room. Invite friends with a code and start playing Polish Rummy together!",
  robots: {
    index: true,
    follow: true,
  },
};

export default function LobbyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
