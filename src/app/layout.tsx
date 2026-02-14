import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "預かり番頭",
  description: "着物・帯預かり管理SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
