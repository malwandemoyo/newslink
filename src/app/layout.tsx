import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Connected Newsroom | Shared Digital Infrastructure for Independent Journalism",
  description:
    "Open-source, AI-assisted collaboration platform connecting independent media organisations through shared resources, expertise exchange, collaborative investigations, and content distribution.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${newsreader.variable}`}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className="min-h-screen text-slate-100 font-sans"
      >
        {children}
      </body>
    </html>
  );
}
