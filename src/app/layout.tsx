import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0b1120] text-slate-100 selection:bg-teal-500/30 selection:text-teal-200">
        {children}
      </body>
    </html>
  );
}
