import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { VERSION } from "../lib/version";

export const metadata: Metadata = {
  title: "sample-app",
  description: "Showcase payload for Piper, deployed with Next.js.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/">Home</Link> · <Link href="/about">About</Link> ·{" "}
          <Link href="/health">Health</Link>
        </nav>
        <main>{children}</main>
        <footer>sample-app v{VERSION}</footer>
      </body>
    </html>
  );
}