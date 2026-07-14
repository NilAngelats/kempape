import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kempape",
  description: "Private festival RPG companion",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
