import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import AmbientBackground from "@/components/ui/ambient-background";
import InteractionLayer from "@/components/ui/interaction-layer";
import SmoothScroll from "@/components/ui/smooth-scroll";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata = {
  title: "Aesthe",
  description: "Aesthe — Digital Art Showcase Platform",
  icons: {
    icon: "/images/aesthe-icon.jpg",
    shortcut: "/images/aesthe-icon.jpg",
    apple: "/images/aesthe-icon.jpg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AmbientBackground />
        <InteractionLayer />
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
