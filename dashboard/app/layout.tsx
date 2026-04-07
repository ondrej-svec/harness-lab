import { headers } from "next/headers";
import type { Metadata } from "next";
import { resolveUiLanguage } from "@/lib/ui-language";
import { ThemeProvider } from "./components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Harness Lab Dashboard",
  description: "Mobilní dashboard pro workshop Harness Lab.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const headerStore = await headers();
  const lang = resolveUiLanguage(headerStore.get("x-harness-ui-lang") ?? undefined);

  return (
    <html lang={lang} suppressHydrationWarning>
      <body style={{ fontFamily: "'Avenir Next', 'Segoe UI', sans-serif" }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
