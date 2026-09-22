import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

export default function useLocation() {
  const [location, setLocation] =
    useState<Location.LocationObject | null>(null);

  const [errorMsg, setErrorMsg] =
    useState<string | null>(null);

  const getLocation = async () => {
    try {
      setErrorMsg(null);

      // 1. ขอสิทธิ์ GPS
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      console.log("GPS Permission:", status);

      if (status !== "granted") {
        setErrorMsg("GPS permission denied");

        Alert.alert(
          "ไม่ได้รับอนุญาต",
          "กรุณาอนุญาตให้แอปเข้าถึงตำแหน่ง"
        );

        return;
      }

      // 2. ตรวจสอบว่าเปิด Location Services หรือไม่
      const enabled = await Location.hasServicesEnabledAsync();

      console.log("Location Services:", enabled);

      if (!enabled) {
        setErrorMsg("Location service is disabled");

        Alert.alert(
          "GPS ปิดอยู่",
          "กรุณาเปิด Location/GPS ใน Emulator"
        );

        return;
      }

      // 3. อ่านตำแหน่ง
      console.log("Getting current location...");

      const currentLocation =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

      console.log(
        "Latitude:",
        currentLocation.coords.latitude
      );

      console.log(
        "Longitude:",
        currentLocation.coords.longitude
      );

      setLocation(currentLocation);

    } catch (error: any) {
      console.log("LOCATION ERROR:", error);

      const message =
        error?.message || String(error);

      setErrorMsg(message);

      Alert.alert(
        "GPS Error",
        message
      );
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  return {
    location,
    errorMsg,
  };
}