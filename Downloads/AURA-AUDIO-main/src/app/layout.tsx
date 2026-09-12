import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AURA One — Hear Everything",
  description:
    "Aura One. An interactive engineering film for the future of wireless audio. Graphene drivers, 48-hour playback, 3 nm silicon.",
  keywords: [
    "Aura",
    "Aura One",
    "wireless earbuds",
    "ANC",
    "graphene driver",
    "spatial audio",
    "Aura Audio",
  ],
  authors: [{ name: "Aura Audio" }],
  openGraph: {
    title: "AURA One — The future of wireless audio",
    description:
      "An interactive engineering film. Eleven grams. Forty-eight hours. Three nanometres. Pre-order opens spring 2027.",
    type: "website",
    siteName: "AURA",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "AURA One — Hear Everything",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AURA One",
    description:
      "Eleven grams. Forty-eight hours. Three nanometres. Pre-order opens spring 2027.",
    images: ["/og.png"],
    creator: "@auraaudio",
  },
  alternates: {
    canonical: "https://aura.audio/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body className="font-sans vignette-wrap">
        {children}
      </body>
    </html>
  );
}
