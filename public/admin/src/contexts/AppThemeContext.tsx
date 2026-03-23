import { createContext, useContext, useState } from "react";

type AppThemeContextType = {
  mode: "light" | "dark";
  setMode: (mode: "light" | "dark") => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
};

const AppThemeContext = createContext<AppThemeContextType | undefined>(undefined);

export const AppThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [primaryColor, setPrimaryColor] = useState("#1976d2");

  return (
    <AppThemeContext.Provider value={{ mode, setMode, primaryColor, setPrimaryColor }}>
      {children}
    </AppThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return context;
};