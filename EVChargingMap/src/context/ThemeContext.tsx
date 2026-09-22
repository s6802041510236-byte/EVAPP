import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeColors = {
  background: string;
  card: string;
  cardSecondary: string;
  text: string;
  secondaryText: string;
  border: string;
  primary: string;
  primaryLight: string;
  iconBackground: string;
  inputBackground: string;
  bottomNav: string;
  danger: string;
  success: string;
  warning: string;
};

const lightColors: ThemeColors = {
  background: "#F7F9FC",
  card: "#FFFFFF",
  cardSecondary: "#F8FAFC",
  text: "#111827",
  secondaryText: "#6B7280",
  border: "#E5E7EB",
  primary: "#2563EB",
  primaryLight: "#EFF6FF",
  iconBackground: "#EFF6FF",
  inputBackground: "#FFFFFF",
  bottomNav: "#FFFFFF",
  danger: "#DC2626",
  success: "#16A34A",
  warning: "#F59E0B",
};

const darkColors: ThemeColors = {
  background: "#0F172A",
  card: "#1E293B",
  cardSecondary: "#334155",
  text: "#F8FAFC",
  secondaryText: "#94A3B8",
  border: "#334155",
  primary: "#60A5FA",
  primaryLight: "#1E3A5F",
  iconBackground: "#1E3A5F",
  inputBackground: "#1E293B",
  bottomNav: "#1E293B",
  danger: "#F87171",
  success: "#4ADE80",
  warning: "#FBBF24",
};

type ThemeContextType = {
  darkMode: boolean;
  colors: ThemeColors;
  setDarkMode: (value: boolean) => Promise<void>;
  toggleDarkMode: () => void;
};

const ThemeContext =
  createContext<ThemeContextType | undefined>(
    undefined
  );

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [darkMode, setDarkModeState] =
    useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const value =
        await AsyncStorage.getItem("darkMode");

      if (value !== null) {
        setDarkModeState(value === "true");
      }
    } catch (error) {
      console.log(
        "THEME LOAD ERROR:",
        error
      );
    }
  };

  const setDarkMode = async (
    value: boolean
  ) => {
    setDarkModeState(value);

    try {
      await AsyncStorage.setItem(
        "darkMode",
        String(value)
      );
    } catch (error) {
      console.log(
        "THEME SAVE ERROR:",
        error
      );
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const colors = darkMode
    ? darkColors
    : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        colors,
        setDarkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}