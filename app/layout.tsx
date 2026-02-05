import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/providers/ConvexClientProvider";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://remik.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Remik - Play Polish Rummy Online with Friends",
    template: "%s | Remik",
  },
  description:
    "Play Remik (Polish Rummy) online with friends. Free multiplayer card game - create a room, invite friends, and enjoy the classic Polish card game together!",
  keywords: [
    "Remik",
    "Polish Rummy",
    "Rummy",
    "card game",
    "online card game",
    "multiplayer",
    "free card game",
    "Polish card game",
    "remik online",
    "gra w remika",
  ],
  authors: [{ name: "Remik Team" }],
  creator: "Remik Team",
  publisher: "Remik",
  applicationName: "Remik",
  category: "Games",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Remik",
    title: "Remik - Play Polish Rummy Online with Friends",
    description:
      "Free multiplayer Polish Rummy card game. Create a room, invite friends, and play together!",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Remik - Polish Rummy Card Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Remik - Play Polish Rummy Online with Friends",
    description:
      "Free multiplayer Polish Rummy card game. Create a room, invite friends, and play together!",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

function JsonLd() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Remik",
    description:
      "Play Remik (Polish Rummy) online with friends. Free multiplayer card game.",
    url: siteUrl,
    applicationCategory: "GameApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <script
      type="application/ld+json"
      // Static trusted data - safe to render
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <JsonLd />
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className={inter.className}>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
