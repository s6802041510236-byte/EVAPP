import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { router } from "expo-router";

import { stations } from "../data/stations";
import { useTheme } from "../context/ThemeContext";
import { useDistance } from "../context/DistanceContext";


type Station = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  power: string;
  availableChargers: number;
  status: "Available" | "In Use" | "Offline";
};

type StationWithDistance = Station & {
  distanceKm: number;
};

const DEFAULT_REGION: Region = {
  latitude: 13.7563,
  longitude: 100.5018,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

/* =====================================================
   DARK MAP
===================================================== */

const DARK_MAP_STYLE = [
  {
    elementType: "geometry",
    stylers: [{ color: "#212121" }],
  },
  {
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#212121" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9E9E9E" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#BDBDBD" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#252525" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#181818" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#2C2C2C" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8A8A8A" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#373737" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3C3C3C" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#454545" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#BDBDBD" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2F2F2F" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#BDBDBD" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3D3D3D" }],
  },
];

/* =====================================================
   HOME
===================================================== */

export default function Index() {
  const { colors, darkMode } = useTheme();
  const { formatDistance } = useDistance();

  const [region, setRegion] =
    useState<Region>(DEFAULT_REGION);

  const [userLocation, setUserLocation] =
    useState<{
      latitude: number;
      longitude: number;
    } | null>(null);

  const [nearbyStations, setNearbyStations] =
    useState<StationWithDistance[]>([]);

  const [search, setSearch] = useState("");

  const [loadingLocation, setLoadingLocation] =
    useState(false);

  const [locationFound, setLocationFound] =
    useState(false);

  /* ===================================================
     CALCULATE DISTANCE
  =================================================== */

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371;

    const dLat =
      ((lat2 - lat1) * Math.PI) / 180;

    const dLon =
      ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return R * c;
  };

  /* ===================================================
     GPS
  =================================================== */

  const findNearbyStations = async () => {
    try {
      setLoadingLocation(true);

      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "ไม่ได้รับอนุญาต",
          "กรุณาอนุญาตให้แอปเข้าถึงตำแหน่งของคุณ"
        );
        return;
      }

      const gpsEnabled =
        await Location.hasServicesEnabledAsync();

      if (!gpsEnabled) {
        Alert.alert(
          "GPS ถูกปิด",
          "กรุณาเปิด Location / GPS ก่อนใช้งาน"
        );
        return;
      }

      const current =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const latitude =
        current.coords.latitude;

      const longitude =
        current.coords.longitude;

      const location = {
        latitude,
        longitude,
      };

      setUserLocation(location);

      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });

      /* ===============================================
         คำนวณระยะห่างจากสถานีใน stations.ts
      =============================================== */

      const calculated =
        (stations as Station[])
          .filter(
            (station) =>
              typeof station.latitude === "number" &&
              typeof station.longitude === "number"
          )
          .map((station) => {
            const distanceKm =
              calculateDistance(
                latitude,
                longitude,
                station.latitude,
                station.longitude
              );

            return {
              ...station,
              distanceKm,
            };
          })
          .sort(
            (a, b) =>
              a.distanceKm - b.distanceKm
          );

      setNearbyStations(calculated);
      setLocationFound(true);
    } catch (error) {
      console.log(
        "LOCATION ERROR:",
        error
      );

      Alert.alert(
        "ไม่สามารถค้นหาตำแหน่ง",
        "กรุณาตรวจสอบ GPS แล้วลองใหม่"
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  /* ===================================================
     SEARCH
  =================================================== */

  const filteredStations = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    if (!keyword) {
      return nearbyStations;
    }

    return nearbyStations.filter(
      (station) =>
        station.name
          .toLowerCase()
          .includes(keyword) ||
        station.address
          .toLowerCase()
          .includes(keyword)
    );
  }, [search, nearbyStations]);

  /* ===================================================
     UI
  =================================================== */

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
      {/* =================================================
          HEADER
      ================================================= */}

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
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>
            ⚡
          </Text>

          <View>
            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                },
              ]}
            >
              EV Charging Map
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
              Find charging stations
              near you
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.settingsButton,
            {
              backgroundColor:
                colors.primaryLight,
            },
          ]}
          onPress={() =>
            router.push("/settings")
          }
        >
          <Text
            style={[
              styles.settingsIcon,
              {
                color:
                  colors.primary,
              },
            ]}
          >
            ⚙
          </Text>
        </TouchableOpacity>
      </View>

      {/* =================================================
          SEARCH
      ================================================= */}

      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor:
              colors.inputBackground,
            borderColor:
              colors.border,
          },
        ]}
      >
        <Text style={styles.searchIcon}>
          🔎
        </Text>

        <TextInput
          style={[
            styles.searchInput,
            {
              color: colors.text,
            },
          ]}
          placeholder="Search charging station..."
          placeholderTextColor={
            colors.secondaryText
          }
          value={search}
          onChangeText={setSearch}
        />

        {search.length > 0 && (
          <TouchableOpacity
            onPress={() =>
              setSearch("")
            }
          >
            <Text
              style={[
                styles.clearText,
                {
                  color:
                    colors.secondaryText,
                },
              ]}
            >
              ✕
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* =================================================
          MAP
      ================================================= */}

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={region}
          onRegionChangeComplete={
            setRegion
          }

          /* ⭐ DARK MAP */
          customMapStyle={
            darkMode
              ? DARK_MAP_STYLE
              : []
          }

          zoomEnabled
          scrollEnabled
          rotateEnabled={false}
          pitchEnabled={false}
          showsUserLocation={false}
          showsMyLocationButton={false}
        >
          {/* USER */}

          {userLocation && (
            <Marker
              coordinate={
                userLocation
              }
              title="ตำแหน่งของคุณ"
            >
              <View
                style={
                  styles.userMarker
                }
              >
                <View
                  style={
                    styles.userMarkerInner
                  }
                />
              </View>
            </Marker>
          )}

          {/* STATIONS */}

          {filteredStations.map(
            (station) => (
              <Marker
                key={station.id}
                coordinate={{
                  latitude:
                    station.latitude,
                  longitude:
                    station.longitude,
                }}
                title={
                  station.name
                }
                description={`${formatDistance(
                  station.distanceKm
                )} • ${station.power}`}
                onCalloutPress={() =>
                  router.push(
                    `/station/${station.id}`
                  )
                }
              >
                <View
                  style={
                    station.status ===
                    "Available"
                      ? styles.stationMarker
                      : styles.stationMarkerBusy
                  }
                >
                  <Text
                    style={
                      styles.markerText
                    }
                  >
                    ⚡
                  </Text>
                </View>
              </Marker>
            )
          )}
        </MapView>

        {/* GPS STATUS */}

        <View
          style={[
            styles.gpsStatus,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.gpsDot,
              {
                backgroundColor:
                  locationFound
                    ? "#22C55E"
                    : "#94A3B8",
              },
            ]}
          />

          <Text
            style={[
              styles.gpsStatusText,
              {
                color:
                  colors.text,
              },
            ]}
          >
            {locationFound
              ? "GPS Active"
              : "GPS Ready"}
          </Text>
        </View>

        {/* GPS BUTTON */}

        <TouchableOpacity
          style={[
            styles.gpsButton,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}
          onPress={
            findNearbyStations
          }
          disabled={
            loadingLocation
          }
        >
          {loadingLocation ? (
            <ActivityIndicator
              size="small"
              color={
                colors.primary
              }
            />
          ) : (
            <Text
              style={
                styles.gpsButtonIcon
              }
            >
              🎯
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* =================================================
          NEARBY HEADER
      ================================================= */}

      <View
        style={
          styles.nearbyHeader
        }
      >
        <View>
          <Text
            style={[
              styles.nearbyTitle,
              {
                color:
                  colors.text,
              },
            ]}
          >
            Nearby Stations
          </Text>

          <Text
            style={[
              styles.nearbySubtitle,
              {
                color:
                  colors.secondaryText,
              },
            ]}
          >
            {locationFound
              ? `${filteredStations.length} stations found near you`
              : "กด 🎯 เพื่อค้นหาสถานีใกล้คุณ"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() =>
            router.push(
              "/stations"
            )
          }
        >
          <Text
            style={[
              styles.viewAll,
              {
                color:
                  colors.primary,
              },
            ]}
          >
            View All →
          </Text>
        </TouchableOpacity>
      </View>

      {/* =================================================
          STATIONS
      ================================================= */}

      {locationFound ? (
        <FlatList
          data={filteredStations.slice(
            0,
            5
          )}
          horizontal
          showsHorizontalScrollIndicator={
            false
          }
          keyExtractor={(item) =>
            item.id
          }
          contentContainerStyle={
            styles.stationList
          }
          renderItem={({
            item,
          }) => (
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
              activeOpacity={0.85}
              onPress={() =>
                router.push(
                  `/station/${item.id}`
                )
              }
            >
              <View
                style={
                  styles.cardTop
                }
              >
                <View
                  style={[
                    styles.stationIconContainer,
                    {
                      backgroundColor:
                        colors.iconBackground,
                    },
                  ]}
                >
                  <Text
                    style={
                      styles.stationIcon
                    }
                  >
                    ⚡
                  </Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    item.status ===
                    "Available"
                      ? styles.availableBadge
                      : item.status ===
                        "In Use"
                      ? styles.inUseBadge
                      : styles.offlineBadge,
                  ]}
                >
                  <Text
                    style={
                      styles.statusBadgeText
                    }
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.stationName,
                  {
                    color:
                      colors.text,
                  },
                ]}
                numberOfLines={1}
              >
                {item.name}
              </Text>

              <Text
                style={[
                  styles.address,
                  {
                    color:
                      colors.secondaryText,
                  },
                ]}
                numberOfLines={1}
              >
                📍 {item.address}
              </Text>

              <View
                style={
                  styles.infoRow
                }
              >
                <Text
                  style={[
                    styles.distance,
                    {
                      color:
                        colors.primary,
                    },
                  ]}
                >
                  📏{" "}
                  {formatDistance(
                    item.distanceKm
                  )}
                </Text>

                <Text
                  style={[
                    styles.power,
                    {
                      color:
                        colors.text,
                    },
                  ]}
                >
                  ⚡ {item.power}
                </Text>
              </View>

              <View
                style={[
                  styles.chargerRow,
                  {
                    borderTopColor:
                      colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chargerText,
                    {
                      color:
                        colors.secondaryText,
                    },
                  ]}
                >
                  🔌{" "}
                  {
                    item.availableChargers
                  }{" "}
                  Available
                </Text>
              </View>

              <View
                style={
                  styles.detailsRow
                }
              >
                <Text
                  style={[
                    styles.detailsText,
                    {
                      color:
                        colors.primary,
                    },
                  ]}
                >
                  View Details
                </Text>

                <Text
                  style={[
                    styles.arrow,
                    {
                      color:
                        colors.primary,
                    },
                  ]}
                >
                  →
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View
          style={[
            styles.emptyNearby,
            {
              backgroundColor:
                colors.card,
              borderColor:
                colors.border,
            },
          ]}
        >
          <Text style={styles.emptyIcon}>
            ⚡
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
            Find EV Chargers Near
            You
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
            กดปุ่ม 🎯 บนแผนที่
            เพื่อค้นหาสถานีชาร์จ EV
            ใกล้ตำแหน่งของคุณ
          </Text>

          <TouchableOpacity
            style={[
              styles.findNearbyLarge,
              {
                backgroundColor:
                  colors.primary,
              },
            ]}
            onPress={
              findNearbyStations
            }
            disabled={
              loadingLocation
            }
          >
            {loadingLocation ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={
                  styles.findNearbyLargeText
                }
              >
                📍 ค้นหาสถานีใกล้ฉัน
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* =================================================
          BOTTOM NAV
      ================================================= */}

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
        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.replace("/")
          }
        >
          <Text
            style={
              styles.navIconActive
            }
          >
            🗺️
          </Text>

          <Text
            style={[
              styles.navTextActive,
              {
                color:
                  colors.primary,
              },
            ]}
          >
            Map
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.replace(
              "/stations"
            )
          }
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

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.replace(
              "/favorites"
            )
          }
        >
          <Text style={styles.navIcon}>
            ♡
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
            Favorites
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            router.replace(
              "/settings"
            )
          }
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

/* =====================================================
   STYLES
===================================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    height: 104,
    paddingTop: 38,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    fontSize: 34,
    marginRight: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 2,
    fontSize: 13,
  },

  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  settingsIcon: {
    fontSize: 23,
  },

  searchContainer: {
    height: 50,
    marginHorizontal: 15,
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  searchIcon: {
    fontSize: 18,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },

  clearText: {
    fontSize: 16,
    padding: 5,
  },

  mapContainer: {
    height: 320,
    marginTop: 12,
    marginHorizontal: 15,
    borderRadius: 20,
    overflow: "hidden",
  },

  map: {
    flex: 1,
  },

  gpsStatus: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },

  gpsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  gpsStatusText: {
    fontSize: 10,
    fontWeight: "700",
  },

  gpsButton: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },

  gpsButtonIcon: {
    fontSize: 23,
  },

  userMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor:
      "rgba(37,99,235,0.25)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2563EB",
  },

  userMarkerInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2563EB",
  },

  stationMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  stationMarkerBusy: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F59E0B",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  markerText: {
    fontSize: 17,
  },

  nearbyHeader: {
    paddingHorizontal: 20,
    paddingTop: 13,
    paddingBottom: 5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  nearbyTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  nearbySubtitle: {
    marginTop: 3,
    fontSize: 11,
  },

  viewAll: {
    fontSize: 12,
    fontWeight: "700",
  },

  stationList: {
    paddingHorizontal: 15,
    paddingTop: 5,
    paddingBottom: 10,
  },

  card: {
    width: 280,
    borderRadius: 18,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  stationIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },

  stationIcon: {
    fontSize: 22,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
  },

  availableBadge: {
    backgroundColor: "#DCFCE7",
  },

  inUseBadge: {
    backgroundColor: "#FEF3C7",
  },

  offlineBadge: {
    backgroundColor: "#FEE2E2",
  },

  statusBadgeText: {
    fontSize: 9,
    fontWeight: "700",
  },

  stationName: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: "800",
  },

  address: {
    marginTop: 5,
    fontSize: 11,
  },

  infoRow: {
    marginTop: 13,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  distance: {
    fontSize: 11,
    fontWeight: "800",
  },

  power: {
    fontSize: 11,
    fontWeight: "700",
  },

  chargerRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },

  chargerText: {
    fontSize: 10,
  },

  detailsRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  detailsText: {
    fontSize: 11,
    fontWeight: "700",
  },

  arrow: {
    fontSize: 18,
    fontWeight: "700",
  },

  emptyNearby: {
    marginHorizontal: 15,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
  },

  emptyIcon: {
    fontSize: 35,
  },

  emptyTitle: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
  },

  findNearbyLarge: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
  },

  findNearbyLargeText: {
    color: "#FFFFFF",
    fontSize: 12,
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

  navIconActive: {
    fontSize: 20,
  },

  navText: {
    marginTop: 3,
    fontSize: 11,
  },

  navTextActive: {
    marginTop: 3,
    fontSize: 11,
    fontWeight: "700",
  },
});
