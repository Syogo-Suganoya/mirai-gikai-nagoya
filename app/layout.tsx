import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FuriganaProvider } from "./furigana-context";
import FuriganaToggle from "./furigana-toggle";
import { DetailLevelProvider } from "./detail-level-context";
import DetailLevelToggle from "./detail-level-toggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "みらい議会 愛知・名古屋",
  description: "愛知県議会・名古屋市会の議案をわかりやすく伝えるサイト",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-amber-50 text-zinc-900">
        <FuriganaProvider>
          <DetailLevelProvider>
            <header className="sticky top-0 z-10 border-b border-amber-100 bg-white/90 backdrop-blur">
              <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-lg">
                  🏯
                </span>
                <a href="/" className="text-lg font-bold tracking-tight">
                  みらい議会<span className="text-amber-600">＠愛知・名古屋</span>
                </a>
                <div className="ml-auto flex items-center gap-2">
                  <DetailLevelToggle />
                  <FuriganaToggle />
                </div>
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t border-amber-100 bg-white py-6 text-center text-xs text-zinc-500">
              これは政党チームみらいが運営しているものではありません。<br />
              「みらい議会」(
              <a
                href="https://gikai.team-mir.ai/"
                className="underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                gikai.team-mir.ai
              </a>
              )の発想を参考にした、非公式の個人制作サイトです。
            </footer>
          </DetailLevelProvider>
        </FuriganaProvider>
      </body>
    </html>
  );
}
