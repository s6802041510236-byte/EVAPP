import React, { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import MapView, {
  Marker,
  Polyline,
  Region,
  PROVIDER_GOOGLE,
} from "react-native-maps";

import * as Location from "expo-location";

import { router, useLocalSearchParams } from "expo-router";
import { getDirections } from "../../services/directions";
import { stations } from "../../data/stations";

const { width, height } = Dimensions.get("window");

type Coordinate = {
  latitude: number;
  longitude: number;
};

type RouteData = {
  coordinates: Coordinate[];
  distanceKm: number;
  durationMin: number;
  startAddress?: string;
  endAddress?: string;
};

const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
  "";

/* =========================================================
   POLYLINE DECODER
========================================================= */

function decodePolyline(encoded: string): Coordinate[] {
  let index = 0;
  let lat = 0;
  let lng = 0;

  const coordinates: Coordinate[] = [];

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;

    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat =
      result & 1 ? ~(result >> 1) : result >> 1;

    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng =
      result & 1 ? ~(result >> 1) : result >> 1;

    lng += deltaLng;

    coordinates.push({
      latitude: lat / 100000,
      longitude: lng / 100000,
    });
  }

  return coordinates;
}

/* =========================================================
   DISTANCE CALCULATION
========================================================= */

function calculateDistanceKm(
  start: Coordinate,
  end: Coordinate
) {
  const R = 6371;

  const dLat =
    ((end.latitude - start.latitude) * Math.PI) / 180;

  const dLng =
    ((end.longitude - start.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +
    Math.cos((start.latitude * Math.PI) / 180) *
      Math.cos((end.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c =
    2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/* =========================================================
   GOOGLE DIRECTIONS
========================================================= */

async function getGoogleRoute(
  start: Coordinate,
  destination: Coordinate
): Promise<RouteData> {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error(
      "ไม่พบ EXPO_PUBLIC_GOOGLE_MAPS_API_KEY"
    );
  }

  const origin =
    `${start.latitude},${start.longitude}`;

  const dest =
    `${destination.latitude},${destination.longitude}`;

  const url =
    "https://maps.googleapis.com/maps/api/directions/json" +
    `?origin=${encodeURIComponent(origin)}` +
    `&destination=${encodeURIComponent(dest)}` +
    `&mode=driving` +
    `&language=th` +
    `&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Google Directions HTTP ${response.status}`
    );
  }

  const data = await response.json();

  if (
    data.status !== "OK" ||
    !data.routes ||
    data.routes.length === 0
  ) {
    throw new Error(
      `Directions API: ${data.status || "UNKNOWN_ERROR"}`
    );
  }

  const route = data.routes[0];

  const leg = route.legs?.[0];

  const encoded =
    route.overview_polyline?.points;

  const coordinates =
    encoded
      ? decodePolyline(encoded)
      : [start, destination];

  return {
    coordinates,

    distanceKm:
      (leg?.distance?.value || 0) / 1000,

    durationMin:
      Math.ceil(
        (leg?.duration?.value || 0) / 60
      ),

    startAddress:
      leg?.start_address,

    endAddress:
      leg?.end_address,
  };
}

/* =========================================================
   SCREEN
========================================================= */

export default function NavigationScreen() {
  const params =
    useLocalSearchParams<{
      id?: string;
      name?: string;
      address?: string;
      latitude?: string;
      longitude?: string;
    }>();

  const mapRef =
    useRef<MapView>(null);

  const [userLocation, setUserLocation] =
    useState<Coordinate | null>(null);

  const [routeData, setRouteData] =
    useState<RouteData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [heading, setHeading] =
    useState(0);

  const [mapReady, setMapReady] =
    useState(false);

  const [isFollowing, setIsFollowing] =
    useState(true);

  // Station cards navigate with only /station/:id. Resolve coordinates from
  // the local data when latitude and longitude are absent from the URL.
  const stationId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;

  const stationData = stations.find(
    (item) => item.id === stationId
  );

  const stationLatitude = Number(
    params.latitude ?? stationData?.latitude
  );

  const stationLongitude = Number(
    params.longitude ?? stationData?.longitude
  );

  const station: Coordinate = {
    latitude: stationLatitude,
    longitude: stationLongitude,
  };

  /* =======================================================
     START
  ======================================================= */

  useEffect(() => {
    startNavigation();

    return () => {
      setIsFollowing(false);
    };
  }, []);

  /* =======================================================
     GPS
  ======================================================= */

  async function startNavigation() {
    try {
      setLoading(true);

      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (permission.status !== "granted") {
        Alert.alert(
          "ต้องอนุญาตตำแหน่ง",
          "กรุณาอนุญาตให้แอปใช้ตำแหน่งของคุณ"
        );

        router.back();

        return;
      }

      const current =
        await Location.getCurrentPositionAsync({
          accuracy:
            Location.Accuracy.Highest,
        });

      const currentPosition: Coordinate = {
        latitude:
          current.coords.latitude,

        longitude:
          current.coords.longitude,
      };

      setUserLocation(currentPosition);

      if (
        typeof current.coords.heading ===
          "number" &&
        current.coords.heading >= 0
      ) {
        setHeading(
          current.coords.heading
        );
      }

      if (
        !Number.isFinite(
          station.latitude
        ) ||
        !Number.isFinite(
          station.longitude
        )
      ) {
        throw new Error(
          "ไม่พบพิกัดสถานี EV"
        );
      }

      const result =
        await getDirections(
          currentPosition,
          station
        );

      setRouteData(result);

      setTimeout(() => {
        fitRoute(result.coordinates);
      }, 700);
    } catch (error: any) {
      console.log(
        "NAVIGATION ERROR:",
        error
      );

      Alert.alert(
        "ไม่สามารถสร้างเส้นทาง",
        error?.message ||
          "เกิดข้อผิดพลาดในการคำนวณเส้นทาง"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     FIT ROUTE
  ======================================================= */

  function fitRoute(
    coordinates: Coordinate[]
  ) {
    if (
      !mapRef.current ||
      coordinates.length === 0
    ) {
      return;
    }

    mapRef.current.fitToCoordinates(
      coordinates,
      {
        edgePadding: {
          top: 150,
          right: 45,
          bottom: 170,
          left: 45,
        },

        animated: true,
      }
    );
  }

  /* =======================================================
     RECENTER
  ======================================================= */

  function recenter() {
    if (!userLocation) {
      return;
    }

    setIsFollowing(true);

    mapRef.current?.animateCamera(
      {
        center: userLocation,
        heading: heading,
        zoom: 17,
        pitch: 0,
      },
      {
        duration: 600,
      }
    );
  }

  /* =======================================================
     SHOW DISTANCE
  ======================================================= */

  function formatDistance(
    km: number
  ) {
    if (!Number.isFinite(km)) {
      return "--";
    }

    // ค่าเริ่มต้นเป็น KM
    // ถ้าต้องการ MI ให้เปลี่ยนตรงนี้
    // ตอนต่อ DistanceContext เราจะเชื่อมให้ global
    return `${km.toFixed(1)} km`;
  }

  /* =======================================================
     TOP STREET NAME
  ======================================================= */

  const streetName =
    params.address ||
    stationData?.address ||
    routeData?.endAddress ||
    "สถานีชาร์จ EV";

  /* =======================================================
     MAP
  ======================================================= */

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        mapType="standard"
        customMapStyle={DARK_MAP_STYLE}
        showsCompass={false}
        showsBuildings={true}
        showsTraffic={false}
        showsIndoors={false}
        rotateEnabled={true}
        pitchEnabled={false}
        zoomEnabled={true}
        scrollEnabled={true}
        toolbarEnabled={false}
        onMapReady={() => {
          setMapReady(true);

          if (routeData) {
            setTimeout(() => {
              fitRoute(
                routeData.coordinates
              );
            }, 300);
          }
        }}
        onPanDrag={() => {
          setIsFollowing(false);
        }}
      >
        {/* ===============================================
            ROUTE
        =============================================== */}

        {routeData &&
          routeData.coordinates.length >
            1 && (
            <>
              {/* เงาของเส้นทาง */}

              <Polyline
                coordinates={
                  routeData.coordinates
                }
                strokeColor="#111111"
                strokeWidth={12}
                lineCap="round"
                lineJoin="round"
              />

              {/* เส้นทางจริง */}

              <Polyline
                coordinates={
                  routeData.coordinates
                }
                strokeColor="#4038FF"
                strokeWidth={7}
                lineCap="round"
                lineJoin="round"
              />
            </>
          )}

        {/* ===============================================
            USER LOCATION
        =============================================== */}

        {userLocation && (
          <Marker
            coordinate={userLocation}
            anchor={{
              x: 0.5,
              y: 0.5,
            }}
            flat={true}
            rotation={heading}
          >
            <View style={styles.userOuter}>
              <View
                style={styles.userInner}
              />
            </View>
          </Marker>
        )}

        {/* ===============================================
            EV STATION
        =============================================== */}

        <Marker
          coordinate={station}
          title={
            params.name ||
            stationData?.name ||
            "EV Charging Station"
          }
          description={
            params.address ||
            stationData?.address ||
            "สถานีชาร์จรถยนต์ไฟฟ้า"
          }
        >
          <View style={styles.evMarker}>
            <Text style={styles.evMarkerIcon}>
              ⚡
            </Text>
          </View>
        </Marker>
      </MapView>

      {/* =================================================
          TOP TURN CARD
      ================================================= */}

      <View style={styles.topNavigation}>
        <View style={styles.turnArrowContainer}>
          <Text style={styles.turnArrow}>
            ↑
          </Text>
        </View>

        <View style={styles.topText}>
          <Text style={styles.toward}>
            toward
          </Text>

          <Text
            style={styles.street}
            numberOfLines={1}
          >
            {streetName}
          </Text>
        </View>
      </View>

      {/* =================================================
          SIMILAR ETA
      ================================================= */}

      {routeData && (
        <View style={styles.etaBadge}>
          <Text style={styles.etaBadgeText}>
            {routeData.durationMin} min
          </Text>
        </View>
      )}

      {/* =================================================
          RIGHT CONTROLS
      ================================================= */}

      <View style={styles.rightControls}>
        {/* Compass */}

        <View style={styles.compass}>
          <Text style={styles.compassN}>
            N
          </Text>

          <Text style={styles.compassArrow}>
            ▲
          </Text>
        </View>

        {/* Search */}

        <TouchableOpacity
          style={styles.roundButton}
          onPress={() => {
            if (routeData) {
              fitRoute(
                routeData.coordinates
              );
            }
          }}
        >
          <Text style={styles.buttonIcon}>
            🔍
          </Text>
        </TouchableOpacity>

        {/* Sound */}

        <TouchableOpacity
          style={styles.roundButton}
          onPress={() => {
            Alert.alert(
              "Navigation",
              "ระบบเสียงนำทางจะเพิ่มในขั้นต่อไป"
            );
          }}
        >
          <Text style={styles.buttonIcon}>
            🔊
          </Text>
        </TouchableOpacity>
      </View>

      {/* =================================================
          RE-CENTER
      ================================================= */}

      <TouchableOpacity
        style={styles.recenterButton}
        onPress={recenter}
      >
        <Text style={styles.recenterIcon}>
          ➤
        </Text>

        <Text style={styles.recenterText}>
          Re-center
        </Text>
      </TouchableOpacity>

      {/* =================================================
          BOTTOM ETA
      ================================================= */}

      <View style={styles.bottomPanel}>
        <View style={styles.bottomMain}>
          <Text style={styles.bottomTime}>
            {routeData
              ? `${routeData.durationMin} min`
              : "-- min"}
          </Text>

          <Text style={styles.bottomLeaf}>
            ◒
          </Text>
        </View>

        <View style={styles.bottomDivider} />

        <Text style={styles.bottomDistance}>
          {routeData
            ? formatDistance(
                routeData.distanceKm
              )
            : "-- km"}
        </Text>
      </View>

      {/* =================================================
          CLOSE
      ================================================= */}

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => {
          router.back();
        }}
      >
        <Text style={styles.closeText}>
          ×
        </Text>
      </TouchableOpacity>

      {/* =================================================
          LOADING
      ================================================= */}

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator
              size="large"
              color="#FFFFFF"
            />

            <Text style={styles.loadingText}>
              กำลังคำนวณเส้นทาง...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

/* =========================================================
   DARK GOOGLE MAP
========================================================= */

const DARK_MAP_STYLE = [
  {
    elementType: "geometry",
    stylers: [
      {
        color: "#172337",
      },
    ],
  },

  {
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#a8b5c7",
      },
    ],
  },

  {
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#172337",
      },
    ],
  },

  {
    featureType: "road",
    elementType: "geometry",
    stylers: [
      {
        color: "#40516a",
      },
    ],
  },

  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [
      {
        color: "#526b88",
      },
    ],
  },

  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#d1d9e3",
      },
    ],
  },

  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      {
        color: "#0c2037",
      },
    ],
  },

  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [
      {
        color: "#24352f",
      },
    ],
  },

  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [
      {
        color: "#193a2e",
      },
    ],
  },

  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [
      {
        color: "#26364b",
      },
    ],
  },
];

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#101827",
  },

  map: {
    width,
    height,
  },

  /* TOP */

  topNavigation: {
    position: "absolute",

    top: 0,
    left: 0,
    right: 0,

    height: 94,

    backgroundColor: "#007A78",

    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 14,

    elevation: 10,

    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  turnArrowContainer: {
    width: 65,

    alignItems: "center",
    justifyContent: "center",
  },

  turnArrow: {
    color: "#FFFFFF",

    fontSize: 56,

    fontWeight: "900",

    lineHeight: 60,
  },

  topText: {
    flex: 1,

    justifyContent: "center",
  },

  toward: {
    color: "#FFFFFF",

    fontSize: 14,

    fontWeight: "600",

    opacity: 0.95,
  },

  street: {
    color: "#FFFFFF",

    fontSize: 23,

    fontWeight: "900",

    marginTop: 1,
  },

  /* ETA BADGE */

  etaBadge: {
    position: "absolute",

    top: 225,
    left: width / 2 - 55,

    minWidth: 110,
    height: 42,

    paddingHorizontal: 15,

    borderRadius: 10,

    backgroundColor: "#237BAA",

    borderWidth: 2,

    borderColor: "#7CD7FF",

    alignItems: "center",
    justifyContent: "center",

    elevation: 5,
  },

  etaBadgeText: {
    color: "#FFFFFF",

    fontSize: 16,

    fontWeight: "800",
  },

  /* USER */

  userOuter: {
    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor:
      "rgba(55,120,255,0.25)",

    borderWidth: 2,

    borderColor: "#FFFFFF",

    alignItems: "center",
    justifyContent: "center",
  },

  userInner: {
    width: 15,
    height: 15,

    borderRadius: 8,

    backgroundColor: "#2878FF",

    borderWidth: 2,

    borderColor: "#FFFFFF",
  },

  /* EV */

  evMarker: {
    width: 52,
    height: 52,

    borderRadius: 26,

    backgroundColor: "#18294A",

    borderWidth: 3,

    borderColor: "#FFFFFF",

    alignItems: "center",
    justifyContent: "center",

    elevation: 10,

    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },

  evMarkerIcon: {
    fontSize: 28,
  },

  /* RIGHT */

  rightControls: {
    position: "absolute",

    right: 14,

    top: 270,

    alignItems: "center",

    gap: 10,
  },

  compass: {
    width: 62,
    height: 62,

    borderRadius: 31,

    backgroundColor: "#050505",

    borderWidth: 2,
    borderColor: "#333333",

    alignItems: "center",
    justifyContent: "center",

    elevation: 8,
  },

  compassN: {
    color: "#FFFFFF",

    fontSize: 15,

    fontWeight: "900",

    position: "absolute",

    top: 7,
  },

  compassArrow: {
    color: "#F51D1D",

    fontSize: 22,

    marginTop: 8,
  },

  roundButton: {
    width: 62,
    height: 62,

    borderRadius: 31,

    backgroundColor: "#050505",

    borderWidth: 2,
    borderColor: "#333333",

    alignItems: "center",
    justifyContent: "center",

    elevation: 8,
  },

  buttonIcon: {
    fontSize: 26,
  },

  /* RECENTER */

  recenterButton: {
    position: "absolute",

    left: 14,

    bottom: 100,

    height: 54,

    paddingHorizontal: 20,

    borderRadius: 27,

    backgroundColor: "#050505",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    elevation: 10,

    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },

  recenterIcon: {
    color: "#FFFFFF",

    fontSize: 22,

    marginRight: 9,
  },

  recenterText: {
    color: "#FFFFFF",

    fontSize: 15,

    fontWeight: "800",
  },

  /* BOTTOM */

  bottomPanel: {
    position: "absolute",

    left: 0,
    right: 0,
    bottom: 0,

    height: 76,

    backgroundColor:
      "rgba(0,0,0,0.94)",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",
  },

  bottomMain: {
    flexDirection: "row",

    alignItems: "center",
  },

  bottomTime: {
    color: "#78E0A1",

    fontSize: 27,

    fontWeight: "900",
  },

  bottomLeaf: {
    color: "#78E0A1",

    fontSize: 20,

    marginLeft: 6,
  },

  bottomDivider: {
    width: 1,
    height: 24,

    backgroundColor: "#555555",

    marginHorizontal: 16,
  },

  bottomDistance: {
    color: "#FFFFFF",

    fontSize: 18,

    fontWeight: "700",
  },

  /* CLOSE */

  closeButton: {
    position: "absolute",

    top: 105,
    left: 14,

    width: 45,
    height: 45,

    borderRadius: 23,

    backgroundColor:
      "rgba(0,0,0,0.75)",

    alignItems: "center",
    justifyContent: "center",
  },

  closeText: {
    color: "#FFFFFF",

    fontSize: 31,

    lineHeight: 32,
  },

  /* LOADING */

  loadingOverlay: {
    position: "absolute",

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor:
      "rgba(0,0,0,0.45)",

    alignItems: "center",
    justifyContent: "center",
  },

  loadingBox: {
    minWidth: 190,

    paddingVertical: 22,
    paddingHorizontal: 20,

    borderRadius: 18,

    backgroundColor:
      "rgba(20,30,45,0.95)",

    alignItems: "center",
  },

  loadingText: {
    color: "#FFFFFF",

    fontSize: 15,

    fontWeight: "700",

    marginTop: 12,
  },
});
