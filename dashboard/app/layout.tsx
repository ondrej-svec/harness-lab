import { headers } from "next/headers";
import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import { resolveUiLanguage } from "@/lib/ui-language";
import { ThemeProvider } from "./components/theme-provider";
import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

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
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
