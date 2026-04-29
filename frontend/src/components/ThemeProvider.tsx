import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type Skin = "default" | "youth" | "checkin";

interface ThemeContextType {
  theme: Theme;
  skin: Skin;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setSkin: (skin: Skin) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("app-theme");
    return (saved as Theme) || "light";
  });

  const [skin, setSkinState] = useState<Skin>(() => {
    const saved = localStorage.getItem("app-skin");
    return (saved as Skin) || "default";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("app-theme", theme);
  }, [theme]);

  useEffect(() => {
    const root = window.document.documentElement;
    // Remove all possible skin classes
    root.classList.remove("theme-youth", "theme-checkin");
    if (skin === "youth") root.classList.add("theme-youth");
    if (skin === "checkin") root.classList.add("theme-checkin");
    localStorage.setItem("app-skin", skin);
  }, [skin]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setTheme = (t: Theme) => setThemeState(t);
  const setSkin = (s: Skin) => setSkinState(s);

  return (
    <ThemeContext.Provider value={{ theme, skin, toggleTheme, setTheme, setSkin }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
