"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export const themeProviderConfig = {
  attribute: "class" as const,
  defaultTheme: "system" as const,
  enableSystem: true,
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider {...themeProviderConfig}>
      {children}
    </NextThemesProvider>
  );
}
