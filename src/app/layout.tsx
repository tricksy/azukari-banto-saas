import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "預かり番頭 - 着物・帯 預かり管理SaaS",
  description: "着物・帯の預かり管理クラウドサービス",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
