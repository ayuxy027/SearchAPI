import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "./providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Wingmate — AI wingmen date on your behalf", template: "%s · Wingmate" },
  description: "LinkedIn + Instagram → agent analysis → agents date each other → ranked matches.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/" className="text-xl font-bold tracking-tight">
              <span className="text-rose-500">♥</span> Wingmate
            </Link>
            <nav className="flex gap-6 text-sm font-medium text-zinc-600">
              <Link href="/" className="hover:text-zinc-900">People</Link>
              <Link href="/dates" className="hover:text-zinc-900">All dates</Link>
            </nav>
          </div>
        </header>
        <Providers>
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
