import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type DistanceUnit = "km" | "mi";

type DistanceContextType = {
  distanceUnit: DistanceUnit;
  setDistanceUnit: (
    unit: DistanceUnit
  ) => Promise<void>;
  formatDistance: (km: number) => string;
};

const DistanceContext =
  createContext<DistanceContextType | undefined>(
    undefined
  );

export function DistanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [distanceUnit, setDistanceUnitState] =
    useState<DistanceUnit>("km");

  // โหลดค่าที่บันทึกไว้
  useEffect(() => {
    loadDistanceUnit();
  }, []);

  const loadDistanceUnit = async () => {
    try {
      const saved =
        await AsyncStorage.getItem(
          "distanceUnit"
        );

      if (saved === "km" || saved === "mi") {
        setDistanceUnitState(saved);
      }
    } catch (error) {
      console.log(
        "LOAD DISTANCE UNIT ERROR:",
        error
      );
    }
  };

  // เปลี่ยนหน่วย + บันทึก
  const setDistanceUnit = async (
    unit: DistanceUnit
  ) => {
    try {
      setDistanceUnitState(unit);

      await AsyncStorage.setItem(
        "distanceUnit",
        unit
      );
    } catch (error) {
      console.log(
        "SAVE DISTANCE UNIT ERROR:",
        error
      );
    }
  };

  // แปลง km -> km / mi
  const formatDistance = (km: number) => {
    if (distanceUnit === "mi") {
      const miles = km * 0.621371;

      if (miles < 0.1) {
        return `${miles.toFixed(2)} mi`;
      }

      return `${miles.toFixed(1)} mi`;
    }

    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }

    return `${km.toFixed(1)} km`;
  };

  return (
    <DistanceContext.Provider
      value={{
        distanceUnit,
        setDistanceUnit,
        formatDistance,
      }}
    >
      {children}
    </DistanceContext.Provider>
  );
}

export function useDistance() {
  const context =
    useContext(DistanceContext);

  if (!context) {
    throw new Error(
      "useDistance must be used inside DistanceProvider"
    );
  }

  return context;
}