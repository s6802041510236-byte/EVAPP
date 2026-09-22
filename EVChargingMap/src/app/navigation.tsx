import React, { useEffect, useMemo, useRef, useState } from "react";

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
  PROVIDER_GOOGLE,
} from "react-native-maps";

import * as Location from "expo-location";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { stations } from "../data/stations";
import { getDirections } from "../services/directions";

const { width, height } =
  Dimensions.get("window");

/* =========================================================
   TYPES
========================================================= */

type Station = {
  id: string | number;
  name: string;
  address: string;

  latitude: number;
  longitude: number;

  power?: string;

  availableChargers?:
    | string
    | number;

  status?:
    | "Available"
    | "In Use"
    | "Offline";
};

type Coordinate = {
  latitude: number;
  longitude: number;
};

type RouteInfo = {
  coordinates: Coordinate[];
  distanceKm: number;
  durationMin: number;
};

/* =========================================================
   GOOGLE API KEY
========================================================= */

const GOOGLE_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

/* =========================================================
   POLYLINE DECODER
========================================================= */

function decodePolyline(
  encoded: string
): Coordinate[] {
  let index = 0;

  let lat = 0;
  let lng = 0;

  const coordinates: Coordinate[] = [];

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;

    let byte: number;

    do {
      byte =
        encoded.charCodeAt(index++) - 63;

      result |=
        (byte & 0x1f) << shift;

      shift += 5;
    } while (byte >= 0x20);

    const deltaLat =
      result & 1
        ? ~(result >> 1)
        : result >> 1;

    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte =
        encoded.charCodeAt(index++) - 63;

      result |=
        (byte & 0x1f) << shift;

      shift += 5;
    } while (byte >= 0x20);

    const deltaLng =
      result & 1
        ? ~(result >> 1)
        : result >> 1;

    lng += deltaLng;

    coordinates.push({
      latitude: lat / 100000,
      longitude: lng / 100000,
    });
  }

  return coordinates;
}

/* =========================================================
   GOOGLE DIRECTIONS
========================================================= */

async function getRoute(
  origin: Coordinate,
  destination: Coordinate
): Promise<RouteInfo> {
  if (!GOOGLE_API_KEY) {
    throw new Error(
      "ไม่พบ Google Maps API Key"
    );
  }

  const url =
    "https://maps.googleapis.com/maps/api/directions/json" +
    `?origin=${origin.latitude},${origin.longitude}` +
    `&destination=${destination.latitude},${destination.longitude}` +
    "&mode=driving" +
    "&language=th" +
    `&key=${GOOGLE_API_KEY}`;

  console.log(
    "DIRECTIONS URL:",
    url.replace(
      GOOGLE_API_KEY,
      "HIDDEN_API_KEY"
    )
  );

  const response =
    await fetch(url);

  const data =
    await response.json();

  console.log(
    "DIRECTIONS STATUS:",
    data.status
  );

  if (data.status !== "OK") {
    throw new Error(
      `Google Directions: ${data.status}`
    );
  }

  if (
    !data.routes ||
    data.routes.length === 0
  ) {
    throw new Error(
      "ไม่พบเส้นทาง"
    );
  }

  const route =
    data.routes[0];

  const leg =
    route.legs[0];

  const coordinates =
    route.overview_polyline?.points
      ? decodePolyline(
          route.overview_polyline.points
        )
      : [
          origin,
          destination,
        ];

  return {
    coordinates,

    distanceKm:
      (leg.distance?.value || 0) /
      1000,

    durationMin:
      Math.ceil(
        (leg.duration?.value || 0) /
          60
      ),
  };
}

/* =========================================================
   SCREEN
========================================================= */

export default function NavigationScreen() {
  const params =
    useLocalSearchParams<{
      id?: string;
      stationId?: string;
    }>();

  /*
   * รองรับทั้ง
   *
   * /navigation?id=1
   *
   * และ
   *
   * /navigation?stationId=1
   */

  const stationId =
    params.id ??
    params.stationId;

  const mapRef =
    useRef<MapView>(null);

  const [userLocation, setUserLocation] =
    useState<Coordinate | null>(
      null
    );

  const [route, setRoute] =
    useState<RouteInfo | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [heading, setHeading] =
    useState(0);

  /* =======================================================
     DEBUG
  ======================================================= */

  console.log(
    "NAVIGATION PARAMS:",
    params
  );

  console.log(
    "STATION ID:",
    stationId
  );

  /* =======================================================
     FIND STATION
  ======================================================= */

  const station =
    useMemo(() => {
      if (
        stationId === undefined
      ) {
        return undefined;
      }

      const found =
        (stations as Station[]).find(
          (item) =>
            String(item.id).trim() ===
            String(stationId).trim()
        );

      console.log(
        "FOUND STATION:",
        found
      );

      return found;
    }, [stationId]);

  /* =======================================================
     START
  ======================================================= */

  useEffect(() => {
    startNavigation();
  }, [station]);

  /* =======================================================
     START NAVIGATION
  ======================================================= */

  async function startNavigation() {
    try {
      setLoading(true);

      /* -----------------------------------------------
         CHECK STATION
      ------------------------------------------------ */

      if (!station) {
        console.log(
          "AVAILABLE STATIONS:",
          stations
        );

        Alert.alert(
          "ไม่พบพิกัดสถานี EV",
          `ID ที่ได้รับ: ${
            stationId ?? "ไม่มี"
          }`,
          [
            {
              text: "ตกลง",
              onPress: () =>
                router.back(),
            },
          ]
        );

        return;
      }

      /* -----------------------------------------------
         CHECK COORDINATES
      ------------------------------------------------ */

      const stationLat =
        Number(station.latitude);

      const stationLng =
        Number(station.longitude);

      if (
        !Number.isFinite(
          stationLat
        ) ||
        !Number.isFinite(
          stationLng
        )
      ) {
        Alert.alert(
          "ข้อมูลสถานีไม่ครบ",
          `สถานี ${station.name} ไม่มี latitude / longitude`
        );

        return;
      }

      /* -----------------------------------------------
         LOCATION PERMISSION
      ------------------------------------------------ */

      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (
        permission.status !==
        "granted"
      ) {
        Alert.alert(
          "ต้องเปิด Location",
          "กรุณาอนุญาตให้แอปเข้าถึงตำแหน่งของคุณ"
        );

        return;
      }

      /* -----------------------------------------------
         CURRENT LOCATION
      ------------------------------------------------ */

      const location =
        await Location.getCurrentPositionAsync(
          {
            accuracy:
              Location.Accuracy.Highest,
          }
        );

      const current: Coordinate =
        {
          latitude:
            location.coords.latitude,

          longitude:
            location.coords.longitude,
        };

      setUserLocation(
        current
      );

      if (
        location.coords.heading !==
          null &&
        location.coords.heading >= 0
      ) {
        setHeading(
          location.coords.heading
        );
      }

      /* -----------------------------------------------
         DESTINATION
      ------------------------------------------------ */

      const destination: Coordinate =
        {
          latitude:
            stationLat,

          longitude:
            stationLng,
        };

      console.log(
        "CURRENT LOCATION:",
        current
      );

      console.log(
        "EV LOCATION:",
        destination
      );

      /* -----------------------------------------------
         GET ROUTE
      ------------------------------------------------ */

      const result =
        await getDirections(
          current,
          destination
        );

      setRoute(result);

      /* -----------------------------------------------
         FIT MAP
      ------------------------------------------------ */

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          result.coordinates,
          {
            edgePadding: {
              top: 160,
              right: 50,
              bottom: 160,
              left: 50,
            },

            animated: true,
          }
        );
      }, 500);
    } catch (error: any) {
      console.log(
        "NAVIGATION ERROR:",
        error
      );

      Alert.alert(
        "ไม่สามารถสร้างเส้นทาง",
        error?.message ||
          "เกิดข้อผิดพลาด"
      );
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     RECENTER
  ======================================================= */

  function recenter() {
    if (!userLocation) {
      return;
    }

    mapRef.current?.animateCamera(
      {
        center:
          userLocation,

        zoom: 17,

        heading,

        pitch: 0,
      },
      {
        duration: 500,
      }
    );
  }

  /* =======================================================
     FIT ROUTE
  ======================================================= */

  function fitRoute() {
    if (
      !route ||
      route.coordinates.length ===
        0
    ) {
      return;
    }

    mapRef.current?.fitToCoordinates(
      route.coordinates,
      {
        edgePadding: {
          top: 150,
          right: 50,
          bottom: 150,
          left: 50,
        },

        animated: true,
      }
    );
  }

  /* =======================================================
     NO STATION
  ======================================================= */

  if (!station) {
    return (
      <View
        style={styles.errorScreen}
      >
        <Text
          style={styles.errorIcon}
        >
          ⚡
        </Text>

        <Text
          style={styles.errorTitle}
        >
          ไม่พบสถานี EV
        </Text>

        <Text
          style={styles.errorDetail}
        >
          ID:{" "}
          {stationId ?? "ไม่มี"}
        </Text>

        <TouchableOpacity
          style={styles.errorButton}
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={
              styles.errorButtonText
            }
          >
            กลับ
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* =======================================================
     MAP
  ======================================================= */

  return (
    <View
      style={styles.container}
    >
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={
          DARK_MAP_STYLE
        }
        showsCompass={false}
        showsTraffic={false}
        showsBuildings={true}
        rotateEnabled={true}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={false}
      >
        {/* ===============================================
            ROUTE SHADOW
        =============================================== */}

        {route && (
          <Polyline
            coordinates={
              route.coordinates
            }
            strokeColor="#111111"
            strokeWidth={12}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* ===============================================
            ROUTE
        =============================================== */}

        {route && (
          <Polyline
            coordinates={
              route.coordinates
            }
            strokeColor="#5148FF"
            strokeWidth={7}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* ===============================================
            USER
        =============================================== */}

        {userLocation && (
          <Marker
            coordinate={
              userLocation
            }
            anchor={{
              x: 0.5,
              y: 0.5,
            }}
            rotation={heading}
            flat
          >
            <View
              style={
                styles.userLocation
              }
            >
              <View
                style={
                  styles.userDot
                }
              />
            </View>
          </Marker>
        )}

        {/* ===============================================
            EV
        =============================================== */}

        <Marker
          coordinate={{
            latitude:
              Number(
                station.latitude
              ),

            longitude:
              Number(
                station.longitude
              ),
          }}
          title={station.name}
          description={
            station.address
          }
        >
          <View
            style={styles.evMarker}
          >
            <Text
              style={
                styles.evMarkerText
              }
            >
              ⚡
            </Text>
          </View>
        </Marker>
      </MapView>

      {/* =================================================
          TOP BAR
      ================================================= */}

      <View
        style={styles.topBar}
      >
        <Text
          style={styles.arrow}
        >
          ↑
        </Text>

        <View
          style={styles.topTexts}
        >
          <Text
            style={styles.toward}
          >
            toward
          </Text>

          <Text
            style={styles.stationTitle}
            numberOfLines={1}
          >
            {station.name}
          </Text>
        </View>
      </View>

      {/* =================================================
          ETA
      ================================================= */}

      {route && (
        <View
          style={styles.eta}
        >
          <Text
            style={styles.etaText}
          >
            {route.durationMin} min
          </Text>
        </View>
      )}

      {/* =================================================
          RIGHT CONTROLS
      ================================================= */}

      <View
        style={styles.controls}
      >
        <View
          style={styles.compass}
        >
          <Text
            style={styles.north}
          >
            N
          </Text>

          <Text
            style={[
              styles.compassArrow,
              {
                transform: [
                  {
                    rotate:
                      `${-heading}deg`,
                  },
                ],
              },
            ]}
          >
            ▲
          </Text>
        </View>

        <TouchableOpacity
          style={
            styles.controlButton
          }
          onPress={fitRoute}
        >
          <Text
            style={
              styles.controlText
            }
          >
            🔍
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.controlButton
          }
          onPress={() =>
            Alert.alert(
              "Navigation",
              "ระบบเสียงนำทางจะเพิ่มในขั้นต่อไป"
            )
          }
        >
          <Text
            style={
              styles.controlText
            }
          >
            🔊
          </Text>
        </TouchableOpacity>
      </View>

      {/* =================================================
          RECENTER
      ================================================= */}

      <TouchableOpacity
        style={styles.recenter}
        onPress={recenter}
      >
        <Text
          style={styles.recenterIcon}
        >
          ➤
        </Text>

        <Text
          style={styles.recenterText}
        >
          Re-center
        </Text>
      </TouchableOpacity>

      {/* =================================================
          BOTTOM
      ================================================= */}

      <View
        style={styles.bottomBar}
      >
        <Text
          style={styles.timeText}
        >
          {route
            ? `${route.durationMin} min`
            : "-- min"}
        </Text>

        <Text
          style={styles.bottomDistance}
        >
          {route
            ? `${route.distanceKm.toFixed(
                1
              )} km`
            : "-- km"}
        </Text>
      </View>

      {/* =================================================
          CLOSE
      ================================================= */}

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() =>
          router.back()
        }
      >
        <Text
          style={styles.closeText}
        >
          ×
        </Text>
      </TouchableOpacity>

      {/* =================================================
          LOADING
      ================================================= */}

      {loading && (
        <View
          style={styles.loading}
        >
          <View
            style={styles.loadingCard}
          >
            <ActivityIndicator
              size="large"
              color="#FFFFFF"
            />

            <Text
              style={
                styles.loadingText
              }
            >
              กำลังค้นหาเส้นทาง...
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
    elementType:
      "labels.text.fill",
    stylers: [
      {
        color: "#AAB7C6",
      },
    ],
  },

  {
    elementType:
      "labels.text.stroke",
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
        color: "#3D5068",
      },
    ],
  },

  {
    featureType:
      "road.highway",
    elementType: "geometry",
    stylers: [
      {
        color: "#536B87",
      },
    ],
  },

  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      {
        color: "#0C2037",
      },
    ],
  },

  {
    featureType:
      "poi.park",
    elementType: "geometry",
    stylers: [
      {
        color: "#193A2E",
      },
    ],
  },
];

/* =========================================================
   STYLES
========================================================= */

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#101827",
    },

    map: {
      width,
      height,
    },

    /* TOP */

    topBar: {
      position:
        "absolute",

      top: 0,
      left: 0,
      right: 0,

      height: 94,

      backgroundColor:
        "#007A78",

      borderBottomLeftRadius: 15,
      borderBottomRightRadius: 15,

      flexDirection: "row",

      alignItems:
        "center",

      paddingHorizontal: 14,

      elevation: 10,
    },

    arrow: {
      color: "#FFFFFF",

      fontSize: 56,

      fontWeight: "900",

      width: 70,

      textAlign: "center",
    },

    topTexts: {
      flex: 1,
    },

    toward: {
      color: "#FFFFFF",

      fontSize: 13,

      fontWeight: "600",
    },

    stationTitle: {
      color: "#FFFFFF",

      fontSize: 21,

      fontWeight: "900",

      marginTop: 2,
    },

    /* ETA */

    eta: {
      position:
        "absolute",

      top: 230,

      left:
        width / 2 - 55,

      width: 110,
      height: 43,

      borderRadius: 10,

      backgroundColor:
        "#237BAA",

      borderWidth: 2,

      borderColor:
        "#70D8FF",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    etaText: {
      color: "#FFFFFF",

      fontSize: 16,

      fontWeight: "900",
    },

    /* USER */

    userLocation: {
      width: 36,
      height: 36,

      borderRadius: 18,

      backgroundColor:
        "rgba(50,120,255,0.25)",

      borderWidth: 2,

      borderColor:
        "#FFFFFF",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    userDot: {
      width: 16,
      height: 16,

      borderRadius: 8,

      backgroundColor:
        "#2878FF",

      borderWidth: 2,

      borderColor:
        "#FFFFFF",
    },

    /* EV */

    evMarker: {
      width: 56,
      height: 56,

      borderRadius: 28,

      backgroundColor:
        "#18294A",

      borderWidth: 3,

      borderColor:
        "#FFFFFF",

      alignItems:
        "center",

      justifyContent:
        "center",

      elevation: 10,
    },

    evMarkerText: {
      fontSize: 30,
    },

    /* CONTROLS */

    controls: {
      position:
        "absolute",

      right: 12,

      top: 280,

      alignItems:
        "center",

      gap: 10,
    },

    compass: {
      width: 62,
      height: 62,

      borderRadius: 31,

      backgroundColor:
        "#050505",

      borderWidth: 2,

      borderColor:
        "#333333",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    north: {
      position:
        "absolute",

      top: 6,

      color: "#FFFFFF",

      fontSize: 14,

      fontWeight: "900",
    },

    compassArrow: {
      color: "#F02020",

      fontSize: 23,

      marginTop: 10,
    },

    controlButton: {
      width: 62,
      height: 62,

      borderRadius: 31,

      backgroundColor:
        "#050505",

      borderWidth: 2,

      borderColor:
        "#333333",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    controlText: {
      fontSize: 25,
    },

    /* RECENTER */

    recenter: {
      position:
        "absolute",

      left: 12,

      bottom: 100,

      height: 54,

      paddingHorizontal: 20,

      borderRadius: 27,

      backgroundColor:
        "#050505",

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    recenterIcon: {
      color: "#FFFFFF",

      fontSize: 22,

      marginRight: 8,
    },

    recenterText: {
      color: "#FFFFFF",

      fontSize: 15,

      fontWeight: "900",
    },

    /* BOTTOM */

    bottomBar: {
      position:
        "absolute",

      left: 0,
      right: 0,

      bottom: 0,

      height: 78,

      backgroundColor:
        "rgba(0,0,0,0.95)",

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    timeText: {
      color: "#78E0A1",

      fontSize: 27,

      fontWeight: "900",
    },

    bottomDistance: {
      color: "#FFFFFF",

      fontSize: 18,

      fontWeight: "800",

      marginLeft: 20,
    },

    /* CLOSE */

    closeButton: {
      position:
        "absolute",

      top: 105,

      left: 12,

      width: 48,
      height: 48,

      borderRadius: 24,

      backgroundColor:
        "rgba(0,0,0,0.8)",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    closeText: {
      color: "#FFFFFF",

      fontSize: 32,

      lineHeight: 34,
    },

    /* LOADING */

    loading: {
      position:
        "absolute",

      top: 0,
      left: 0,
      right: 0,
      bottom: 0,

      backgroundColor:
        "rgba(0,0,0,0.4)",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    loadingCard: {
      backgroundColor:
        "#182337",

      borderRadius: 18,

      paddingVertical: 25,

      paddingHorizontal: 30,

      alignItems:
        "center",
    },

    loadingText: {
      color: "#FFFFFF",

      fontSize: 15,

      fontWeight: "700",

      marginTop: 12,
    },

    /* ERROR */

    errorScreen: {
      flex: 1,

      backgroundColor:
        "#101827",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    errorIcon: {
      fontSize: 55,

      marginBottom: 10,
    },

    errorTitle: {
      color: "#FFFFFF",

      fontSize: 23,

      fontWeight: "900",
    },

    errorDetail: {
      color: "#AAB7C6",

      fontSize: 15,

      marginTop: 8,
    },

    errorButton: {
      backgroundColor:
        "#237BAA",

      paddingHorizontal: 35,

      paddingVertical: 14,

      borderRadius: 12,

      marginTop: 25,
    },

    errorButtonText: {
      color: "#FFFFFF",

      fontSize: 16,

      fontWeight: "800",
    },
  });
