import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harness Lab Dashboard",
  description: "Mobilní dashboard pro workshop Harness Lab.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
