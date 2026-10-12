import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FuriganaProvider } from "./furigana-context";
import { DetailLevelProvider } from "./detail-level-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "みらい議会＠愛知・名古屋",
  description: "愛知県議会・名古屋市会の議案をわかりやすく伝えるサイト",
};

// 本家みらい議会のブランドカラーと混同されないよう、サイト独自のamber系を指定する
export const viewport: Viewport = {
  themeColor: "#f59e0b",
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
            {children}
          </DetailLevelProvider>
        </FuriganaProvider>
      </body>
    </html>
  );
}
