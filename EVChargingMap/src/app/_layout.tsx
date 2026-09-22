import React from "react";

import {
  Stack,
} from "expo-router";

import {
  FavoritesProvider,
} from "../context/FavoritesContext";

import {
  ThemeProvider,
} from "../context/ThemeContext";

import {
  DistanceProvider,
} from "../context/DistanceContext";


export default function RootLayout() {

  return (

    <ThemeProvider>

      <DistanceProvider>

        <FavoritesProvider>

          <Stack
            screenOptions={{
              headerShown:
                false,
            }}
          />

        </FavoritesProvider>

      </DistanceProvider>

    </ThemeProvider>
  );
}