import React, {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  isFirebaseConfigured,
  loadCloudFavorites,
  saveCloudFavorites,
} from "../services/firebase";

type FavoritesContextType = {
  favorites: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
};

const FavoritesContext =
  createContext<FavoritesContextType | undefined>(
    undefined
  );

export function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [favorites, setFavorites] =
    useState<string[]>([]);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const saved =
        await AsyncStorage.getItem(
          "ev_favorites"
        );

      if (saved) {
        setFavorites(JSON.parse(saved));
      }

      if (isFirebaseConfigured) {
        const cloudFavorites = await loadCloudFavorites();

        if (cloudFavorites) {
          setFavorites(cloudFavorites);
          await AsyncStorage.setItem(
            "ev_favorites",
            JSON.stringify(cloudFavorites)
          );
        }
      }
    } catch (error) {
      console.log(
        "LOAD FAVORITES ERROR:",
        error
      );
    }
  };

  const saveFavorites = async (
    data: string[]
  ) => {
    try {
      await AsyncStorage.setItem(
        "ev_favorites",
        JSON.stringify(data)
      );

      if (isFirebaseConfigured) {
        await saveCloudFavorites(data);
      }
    } catch (error) {
      console.log(
        "SAVE FAVORITES ERROR:",
        error
      );
    }
  };

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      const exists =
        current.includes(id);

      const updated = exists
        ? current.filter(
            (item) => item !== id
          )
        : [...current, id];

      saveFavorites(updated);

      return updated;
    });
  };

  const isFavorite = (id: string) => {
    return favorites.includes(id);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        toggleFavorite,
        isFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context =
    useContext(FavoritesContext);

  if (!context) {
    throw new Error(
      "useFavorites must be used inside FavoritesProvider"
    );
  }

  return context;
}
