import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "インドアゴルフ姫路 | 会員管理システム",
  description: "シミュレーションゴルフ会員管理・予約システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
