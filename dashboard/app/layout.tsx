import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Harness Lab Dashboard",
  description: "Mobilní dashboard pro workshop Harness Lab.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs" className={spaceGrotesk.variable}>
      <body style={{ fontFamily: "var(--font-space-grotesk), 'Avenir Next', 'Segoe UI', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
