import { router } from "expo-router";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useFavorites } from "../context/FavoritesContext";
import { useTheme } from "../context/ThemeContext";
import { useDistance } from "../context/DistanceContext";
import { stations } from "../data/stations";

export default function Favorites() {
  const { favorites, toggleFavorite } =
    useFavorites();

  const { colors, darkMode } =
    useTheme();

  // ==========================================
  // DISTANCE
  // ==========================================

  const { formatDistance } =
    useDistance();

  // ==========================================
  // FAVORITE STATIONS
  // ==========================================

  const favoriteStations = stations.filter(
    (station) =>
      favorites.includes(station.id)
  );

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
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.backText,
              {
                color:
                  colors.primary,
              },
            ]}
          >
            ←
          </Text>
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text
            style={[
              styles.title,
              {
                color:
                  colors.text,
              },
            ]}
          >
            ♥ Favorites
          </Text>

          <Text
            style={[
              styles.subtitle,
              {
                color:
                  colors.secondaryText,
              },
            ]}
          >
            Your saved charging stations
          </Text>
        </View>
      </View>

      {/* =====================================
          CONTENT
      ====================================== */}

      {favoriteStations.length === 0 ? (
        <View style={styles.empty}>
          <Text
            style={[
              styles.emptyIcon,
              {
                color:
                  colors.border,
              },
            ]}
          >
            ♡
          </Text>

          <Text
            style={[
              styles.emptyTitle,
              {
                color:
                  colors.text,
              },
            ]}
          >
            No Favorites Yet
          </Text>

          <Text
            style={[
              styles.emptyText,
              {
                color:
                  colors.secondaryText,
              },
            ]}
          >
            Save your favorite charging
            stations and they will appear
            here.
          </Text>

          <TouchableOpacity
            style={[
              styles.findButton,
              {
                backgroundColor:
                  colors.primary,
              },
            ]}
            onPress={() =>
              router.push("/stations")
            }
            activeOpacity={0.8}
          >
            <Text
              style={
                styles.findButtonText
              }
            >
              Find Stations
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favoriteStations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            styles.list
          }
          showsVerticalScrollIndicator={
            false
          }
          renderItem={({ item }) => (
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
              activeOpacity={0.8}
              onPress={() =>
                router.push(
                  `/station/${item.id}`
                )
              }
            >
              {/* =================================
                  CARD TOP
              ================================== */}

              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.iconContainer,
                    {
                      backgroundColor:
                        colors.iconBackground,
                    },
                  ]}
                >
                  <Text
                    style={styles.icon}
                  >
                    ⚡
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.heartButton,
                    {
                      backgroundColor:
                        darkMode
                          ? "#3F1D2B"
                          : "#FEF2F2",
                    },
                  ]}
                  onPress={(event) => {
                    event.stopPropagation();

                    toggleFavorite(
                      item.id
                    );
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={styles.heart}
                  >
                    ♥
                  </Text>
                </TouchableOpacity>
              </View>

              {/* =================================
                  NAME
              ================================== */}

              <Text
                style={[
                  styles.stationName,
                  {
                    color:
                      colors.text,
                  },
                ]}
              >
                {item.name}
              </Text>

              {/* =================================
                  ADDRESS
              ================================== */}

              <Text
                style={[
                  styles.address,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
              >
                📍 {item.address}
              </Text>

              {/* =================================
                  INFORMATION
              ================================== */}

              <View
                style={[
                  styles.infoRow,
                  {
                    borderColor:
                      colors.border,
                  },
                ]}
              >
                {/* DISTANCE */}

                <Text
                  style={[
                    styles.info,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  📏{" "}
                  {formatDistance(
                    Number(item.distance)
                  )}
                </Text>

                {/* POWER */}

                <Text
                  style={[
                    styles.info,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  ⚡ {item.power}
                </Text>

                {/* CHARGERS */}

                <Text
                  style={[
                    styles.info,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  🔌{" "}
                  {
                    item.availableChargers
                  }
                </Text>
              </View>

              {/* =================================
                  FOOTER
              ================================== */}

              <View
                style={styles.footer}
              >
                <View
                  style={[
                    styles.status,

                    item.status ===
                    "Available"
                      ? {
                          backgroundColor:
                            darkMode
                              ? "#14532D"
                              : "#DCFCE7",
                        }
                      : item.status ===
                        "In Use"
                      ? {
                          backgroundColor:
                            darkMode
                              ? "#713F12"
                              : "#FEF3C7",
                        }
                      : {
                          backgroundColor:
                            darkMode
                              ? "#7F1D1D"
                              : "#FEE2E2",
                        },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          item.status ===
                          "Available"
                            ? darkMode
                              ? "#86EFAC"
                              : "#166534"
                            : item.status ===
                              "In Use"
                            ? darkMode
                              ? "#FDE68A"
                              : "#92400E"
                            : darkMode
                            ? "#FCA5A5"
                            : "#991B1B",
                      },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.details,
                    {
                      color:
                        colors.primary,
                    },
                  ]}
                >
                  View Details →
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* =====================================
          BOTTOM NAV
      ====================================== */}

      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor:
              colors.bottomNav,
            borderTopColor:
              colors.border,
          },
        ]}
      >
        {/* MAP */}

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.replace("/")
          }
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>
            🗺️
          </Text>

          <Text
            style={[
              styles.navText,
              {
                color:
                  colors.secondaryText,
              },
            ]}
          >
            Map
          </Text>
        </TouchableOpacity>

        {/* STATIONS */}

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.replace(
              "/stations"
            )
          }
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>
            ⚡
          </Text>

          <Text
            style={[
              styles.navText,
              {
                color:
                  colors.secondaryText,
              },
            ]}
          >
            Stations
          </Text>
        </TouchableOpacity>

        {/* FAVORITES */}

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.replace(
              "/favorites"
            )
          }
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>
            ♥
          </Text>

          <Text
            style={[
              styles.activeText,
              {
                color:
                  colors.primary,
              },
            ]}
          >
            Favorites
          </Text>
        </TouchableOpacity>

        {/* SETTINGS */}

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.replace(
              "/settings"
            )
          }
          activeOpacity={0.7}
        >
          <Text style={styles.navIcon}>
            ⚙
          </Text>

          <Text
            style={[
              styles.navText,
              {
                color:
                  colors.secondaryText,
              },
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 15,

    flexDirection: "row",
    alignItems: "center",

    borderBottomWidth: 1,
  },

  backButton: {
    width: 42,
    height: 42,

    borderRadius: 21,

    justifyContent: "center",
    alignItems: "center",

    marginRight: 12,
  },

  backText: {
    fontSize: 24,
    fontWeight: "600",
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 23,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 3,
    fontSize: 12,
  },

  list: {
    padding: 15,
    paddingBottom: 20,
  },

  card: {
    borderRadius: 18,

    padding: 16,
    marginBottom: 12,

    borderWidth: 1,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent:
      "space-between",
  },

  iconContainer: {
    width: 48,
    height: 48,

    borderRadius: 14,

    justifyContent: "center",
    alignItems: "center",
  },

  icon: {
    fontSize: 23,
  },

  heartButton: {
    width: 42,
    height: 42,

    borderRadius: 21,

    justifyContent: "center",
    alignItems: "center",
  },

  heart: {
    fontSize: 22,
    color: "#EF4444",
  },

  stationName: {
    marginTop: 12,

    fontSize: 18,
    fontWeight: "800",
  },

  address: {
    marginTop: 5,
    fontSize: 12,
  },

  infoRow: {
    marginTop: 15,

    paddingVertical: 11,

    borderTopWidth: 1,
    borderBottomWidth: 1,

    flexDirection: "row",

    justifyContent:
      "space-between",
  },

  info: {
    fontSize: 11,
    fontWeight: "700",
  },

  footer: {
    marginTop: 12,

    flexDirection: "row",

    justifyContent:
      "space-between",

    alignItems: "center",
  },

  status: {
    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 9,
  },

  statusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  details: {
    fontSize: 12,
    fontWeight: "700",
  },

  empty: {
    flex: 1,

    paddingHorizontal: 35,

    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    fontSize: 65,
  },

  emptyTitle: {
    marginTop: 15,

    fontSize: 21,
    fontWeight: "800",
  },

  emptyText: {
    marginTop: 7,

    fontSize: 13,
    lineHeight: 20,

    textAlign: "center",
  },

  findButton: {
    marginTop: 20,

    paddingHorizontal: 25,
    paddingVertical: 13,

    borderRadius: 13,
  },

  findButtonText: {
    color: "#FFFFFF",

    fontWeight: "800",
  },

  bottomNav: {
    height: 75,

    borderTopWidth: 1,

    flexDirection: "row",
  },

  navItem: {
    flex: 1,

    justifyContent: "center",
    alignItems: "center",
  },

  navIcon: {
    fontSize: 20,
  },

  navText: {
    marginTop: 3,
    fontSize: 11,
  },

  activeText: {
    marginTop: 3,

    fontSize: 11,
    fontWeight: "700",
  },
});