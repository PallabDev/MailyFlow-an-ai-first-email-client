"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface ThemeCtx {
  isDark: boolean;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ isDark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  return (
    <Ctx.Provider value={{ isDark, toggle: () => setIsDark((v) => !v) }}>
      <div className={`landing-page ${isDark ? "dark" : ""} min-h-screen bg-bg text-text antialiased`}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
