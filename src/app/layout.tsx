import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Israel Air Defense",
  description: "Top-down arcade interceptor game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
