import { headers } from "next/headers";
import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { resolveUiLanguage } from "@/lib/ui-language";
import { ThemeProvider } from "./components/theme-provider";
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const headerStore = await headers();
  const lang = resolveUiLanguage(headerStore.get("x-harness-ui-lang") ?? undefined);

  return (
    <html lang={lang} className={spaceGrotesk.variable} suppressHydrationWarning>
      <body style={{ fontFamily: "var(--font-space-grotesk), 'Avenir Next', 'Segoe UI', sans-serif" }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
