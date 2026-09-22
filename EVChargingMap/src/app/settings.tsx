import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

import { useTheme } from "../context/ThemeContext";
import { useDistance } from "../context/DistanceContext";

export default function Settings() {
  const { darkMode, colors, setDarkMode } = useTheme();

  // ==========================================
  // DISTANCE CONTEXT
  // ==========================================

  const {
    distanceUnit,
    setDistanceUnit,
  } = useDistance();

  // ==========================================
  // OTHER SETTINGS
  // ==========================================

  const [locationEnabled, setLocationEnabled] =
    useState(true);

  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true);

  const [mapType, setMapType] =
    useState<"standard" | "satellite">("standard");

  // ==========================================
  // LOAD SETTINGS
  // ==========================================

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const location =
        await AsyncStorage.getItem(
          "locationEnabled"
        );

      const notifications =
        await AsyncStorage.getItem(
          "notificationsEnabled"
        );

      const map =
        await AsyncStorage.getItem("mapType");

      if (location !== null) {
        setLocationEnabled(
          location === "true"
        );
      }

      if (notifications !== null) {
        setNotificationsEnabled(
          notifications === "true"
        );
      }

      if (
        map === "standard" ||
        map === "satellite"
      ) {
        setMapType(map);
      }
    } catch (error) {
      console.log(
        "LOAD SETTINGS ERROR:",
        error
      );
    }
  };

  // ==========================================
  // SAVE SETTING
  // ==========================================

  const saveSetting = async (
    key: string,
    value: string
  ) => {
    try {
      await AsyncStorage.setItem(
        key,
        value
      );
    } catch (error) {
      console.log(
        "SAVE SETTING ERROR:",
        error
      );
    }
  };

  // ==========================================
  // LOCATION
  // ==========================================

  const handleLocation = async (
    value: boolean
  ) => {
    setLocationEnabled(value);

    await saveSetting(
      "locationEnabled",
      String(value)
    );
  };

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  const handleNotifications = async (
    value: boolean
  ) => {
    setNotificationsEnabled(value);

    await saveSetting(
      "notificationsEnabled",
      String(value)
    );
  };

  // ==========================================
  // DARK MODE
  // ==========================================

  const handleDarkMode = async (
    value: boolean
  ) => {
    await setDarkMode(value);
  };

  // ==========================================
  // DISTANCE UNIT
  // ==========================================

  const handleDistance = async (
    value: "km" | "mi"
  ) => {
    await setDistanceUnit(value);
  };

  // ==========================================
  // MAP TYPE
  // ==========================================

  const handleMapType = async (
    value: "standard" | "satellite"
  ) => {
    setMapType(value);

    await saveSetting(
      "mapType",
      value
    );
  };

  // ==========================================
  // RESET SETTINGS
  // ==========================================

  const resetSettings = () => {
    Alert.alert(
      "Reset Settings",
      "Reset all settings?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",

          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                "locationEnabled",
                "notificationsEnabled",
                "darkMode",
                "distanceUnit",
                "mapType",
              ]);

              setLocationEnabled(true);

              setNotificationsEnabled(
                true
              );

              setMapType("standard");

              // กลับเป็น KM ผ่าน Context
              await setDistanceUnit("km");

              // กลับเป็น Light Mode
              await setDarkMode(false);

              Alert.alert(
                "Reset Complete",
                "All settings have been reset."
              );
            } catch (error) {
              console.log(
                "RESET SETTINGS ERROR:",
                error
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            colors.background,
        },
      ]}
    >
      {/* =====================================
          HEADER
      ====================================== */}

      <View
        style={[
          styles.header,
          {
            backgroundColor:
              colors.card,

            borderBottomColor:
              colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              backgroundColor:
                colors.primaryLight,
            },
          ]}
          activeOpacity={0.7}
          onPress={() =>
            router.replace("/")
          }
        >
          <Text
            style={[
              styles.backText,
              {
                color: colors.text,
              },
            ]}
          >
            ‹
          </Text>
        </TouchableOpacity>

        <Text
          style={[
            styles.headerTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Settings
        </Text>

        <View
          style={{
            width: 42,
          }}
        />
      </View>

      {/* =====================================
          CONTENT
      ====================================== */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.content
        }
      >
        {/* =====================================
            LOCATION
        ====================================== */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                colors.secondaryText,
            },
          ]}
        >
          LOCATION
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,

              borderColor:
                colors.border,
            },
          ]}
        >
          <SettingRow
            icon="📍"
            title="Location Services"
            description="Use your location to find nearby stations"
            colors={colors}
          >
            <Switch
              value={locationEnabled}
              onValueChange={
                handleLocation
              }
              trackColor={{
                false: "#64748B",
                true: "#60A5FA",
              }}
              thumbColor="#FFFFFF"
            />
          </SettingRow>
        </View>

        {/* =====================================
            NOTIFICATIONS
        ====================================== */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                colors.secondaryText,
            },
          ]}
        >
          NOTIFICATIONS
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,

              borderColor:
                colors.border,
            },
          ]}
        >
          <SettingRow
            icon="🔔"
            title="Notifications"
            description="Receive charging station updates"
            colors={colors}
          >
            <Switch
              value={
                notificationsEnabled
              }
              onValueChange={
                handleNotifications
              }
              trackColor={{
                false: "#64748B",
                true: "#60A5FA",
              }}
              thumbColor="#FFFFFF"
            />
          </SettingRow>
        </View>

        {/* =====================================
            APPEARANCE
        ====================================== */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                colors.secondaryText,
            },
          ]}
        >
          APPEARANCE
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,

              borderColor:
                colors.border,
            },
          ]}
        >
          <SettingRow
            icon={
              darkMode
                ? "🌙"
                : "☀️"
            }
            title="Dark Mode"
            description={
              darkMode
                ? "Dark appearance enabled"
                : "Use light appearance"
            }
            colors={colors}
          >
            <Switch
              value={darkMode}
              onValueChange={
                handleDarkMode
              }
              trackColor={{
                false: "#64748B",
                true: "#60A5FA",
              }}
              thumbColor="#FFFFFF"
            />
          </SettingRow>
        </View>

        {/* =====================================
            DISTANCE
        ====================================== */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                colors.secondaryText,
            },
          ]}
        >
          DISTANCE
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,

              borderColor:
                colors.border,
            },
          ]}
        >
          <SettingRow
            icon="📏"
            title="Distance Unit"
            description={
              distanceUnit === "km"
                ? "Distances are displayed in kilometers"
                : "Distances are displayed in miles"
            }
            colors={colors}
          />

          <View
            style={styles.options}
          >
            <OptionButton
              title="Kilometer (km)"
              selected={
                distanceUnit === "km"
              }
              onPress={() =>
                handleDistance("km")
              }
              colors={colors}
            />

            <OptionButton
              title="Mile (mi)"
              selected={
                distanceUnit === "mi"
              }
              onPress={() =>
                handleDistance("mi")
              }
              colors={colors}
            />
          </View>
        </View>

        {/* =====================================
            MAP
        ====================================== */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                colors.secondaryText,
            },
          ]}
        >
          MAP
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,

              borderColor:
                colors.border,
            },
          ]}
        >
          <SettingRow
            icon="🗺️"
            title="Map Type"
            description="Choose map appearance"
            colors={colors}
          />

          <View
            style={styles.options}
          >
            <OptionButton
              title="🗺️ Standard"
              selected={
                mapType ===
                "standard"
              }
              onPress={() =>
                handleMapType(
                  "standard"
                )
              }
              colors={colors}
            />

            <OptionButton
              title="🛰️ Satellite"
              selected={
                mapType ===
                "satellite"
              }
              onPress={() =>
                handleMapType(
                  "satellite"
                )
              }
              colors={colors}
            />
          </View>
        </View>

        {/* =====================================
            ABOUT
        ====================================== */}

        <Text
          style={[
            styles.sectionTitle,
            {
              color:
                colors.secondaryText,
            },
          ]}
        >
          ABOUT
        </Text>

        <TouchableOpacity
          style={[
            styles.card,
            {
              backgroundColor:
                colors.card,

              borderColor:
                colors.border,
            },
          ]}
          activeOpacity={0.7}
          onPress={() =>
            Alert.alert(
              "EV Charging Map",
              "EV Charging Map\nVersion 1.0.0"
            )
          }
        >
          <SettingRow
            icon="ℹ️"
            title="About App"
            description="EV Charging Map"
            colors={colors}
          >
            <Text
              style={{
                fontSize: 28,
                color:
                  colors.secondaryText,
              }}
            >
              ›
            </Text>
          </SettingRow>
        </TouchableOpacity>

        {/* =====================================
            RESET
        ====================================== */}

        <TouchableOpacity
          style={[
            styles.resetButton,
            {
              backgroundColor:
                darkMode
                  ? "#3F1D1D"
                  : "#FEF2F2",

              borderColor:
                darkMode
                  ? "#7F1D1D"
                  : "#FCA5A5",
            },
          ]}
          activeOpacity={0.7}
          onPress={
            resetSettings
          }
        >
          <Text
            style={[
              styles.resetText,
              {
                color:
                  colors.danger,
              },
            ]}
          >
            Reset All Settings
          </Text>
        </TouchableOpacity>

        {/* VERSION */}

        <Text
          style={[
            styles.version,
            {
              color:
                colors.secondaryText,
            },
          ]}
        >
          EV Charging Map • v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

// ======================================================
// SETTING ROW
// ======================================================

function SettingRow({
  icon,
  title,
  description,
  colors,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  colors: any;
  children?: React.ReactNode;
}) {
  return (
    <View
      style={styles.settingRow}
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor:
              colors.iconBackground,
          },
        ]}
      >
        <Text style={styles.icon}>
          {icon}
        </Text>
      </View>

      <View
        style={styles.settingInfo}
      >
        <Text
          style={[
            styles.settingTitle,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.description,
            {
              color:
                colors.secondaryText,
            },
          ]}
        >
          {description}
        </Text>
      </View>

      {children}
    </View>
  );
}

// ======================================================
// OPTION BUTTON
// ======================================================

function OptionButton({
  title,
  selected,
  onPress,
  colors,
}: {
  title: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.option,
        {
          backgroundColor:
            selected
              ? colors.primaryLight
              : colors.cardSecondary,

          borderColor:
            selected
              ? colors.primary
              : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.optionText,
          {
            color: selected
              ? colors.primary
              : colors.secondaryText,
          },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: 95,
    paddingTop: 42,
    paddingHorizontal: 18,

    flexDirection: "row",
    alignItems: "center",

    borderBottomWidth: 1,
  },

  backButton: {
    width: 42,
    height: 42,

    borderRadius: 14,

    justifyContent: "center",
    alignItems: "center",
  },

  backText: {
    fontSize: 34,
    lineHeight: 36,
  },

  headerTitle: {
    flex: 1,

    marginLeft: 15,

    fontSize: 22,
    fontWeight: "800",
  },

  content: {
    padding: 18,
    paddingBottom: 50,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",

    letterSpacing: 1,

    marginTop: 18,
    marginBottom: 9,
    marginLeft: 4,
  },

  card: {
    borderRadius: 18,

    padding: 15,

    borderWidth: 1,
  },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBox: {
    width: 44,
    height: 44,

    borderRadius: 13,

    justifyContent: "center",
    alignItems: "center",
  },

  icon: {
    fontSize: 21,
  },

  settingInfo: {
    flex: 1,

    marginLeft: 12,
  },

  settingTitle: {
    fontSize: 15,
    fontWeight: "700",
  },

  description: {
    marginTop: 3,

    fontSize: 11,
    lineHeight: 16,
  },

  options: {
    flexDirection: "row",

    gap: 10,

    marginTop: 15,
  },

  option: {
    flex: 1,

    minHeight: 46,

    borderRadius: 12,

    borderWidth: 1,

    justifyContent: "center",
    alignItems: "center",

    paddingHorizontal: 8,
  },

  optionText: {
    fontSize: 12,
    fontWeight: "700",
  },

  resetButton: {
    height: 52,

    marginTop: 28,

    borderRadius: 15,

    borderWidth: 1,

    justifyContent: "center",
    alignItems: "center",
  },

  resetText: {
    fontSize: 14,
    fontWeight: "700",
  },

  version: {
    textAlign: "center",

    fontSize: 10,

    marginTop: 18,
  },
});