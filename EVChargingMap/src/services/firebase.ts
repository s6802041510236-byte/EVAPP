import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { get, getDatabase, ref, set } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.databaseURL &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

const firebaseApp = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

const database = firebaseApp ? getDatabase(firebaseApp) : null;
const DEVICE_ID_KEY = "ev_device_id";

async function getDeviceId() {
  const saved = await AsyncStorage.getItem(DEVICE_ID_KEY);

  if (saved) return saved;

  const id = `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

export async function loadCloudFavorites(): Promise<string[] | null> {
  if (!database) return null;

  const deviceId = await getDeviceId();
  const snapshot = await get(ref(database, `favorites/${deviceId}`));
  const value = snapshot.val();

  return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
}

export async function saveCloudFavorites(favorites: string[]) {
  if (!database) return;

  const deviceId = await getDeviceId();
  await set(ref(database, `favorites/${deviceId}`), favorites);
}
