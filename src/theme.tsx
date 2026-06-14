"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

interface ThemeCtx {
  isDark: boolean;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ isDark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const initialDark = savedTheme ? savedTheme === "dark" : false;
    setIsDark(initialDark);
    document.documentElement.classList.toggle("dark", initialDark);
  }, []);

  const toggle = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem("theme", nextDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", nextDark);
  };

  return (
    <Ctx.Provider value={{ isDark, toggle }}>
      <div className={`landing-page ${isDark ? "dark" : ""} min-h-screen bg-bg text-text antialiased`}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
