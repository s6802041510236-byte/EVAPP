export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type Route = {
  coordinates: Coordinate[];
  distanceKm: number;
  durationMin: number;
  isEstimated: boolean;
};

// OSRM uses OpenStreetMap road data and does not require an API key.
const OSRM_ROUTE_URL = "https://router.project-osrm.org/route/v1/driving";

export async function getDirections(
  origin: Coordinate,
  destination: Coordinate
): Promise<Route> {
  const fallbackRoute = createEstimatedRoute(origin, destination);
  const coordinates = [
    `${origin.longitude},${origin.latitude}`,
    `${destination.longitude},${destination.latitude}`,
  ].join(";");
  try {
    const response = await fetch(
      `${OSRM_ROUTE_URL}/${coordinates}?overview=full&geometries=geojson&steps=false`
    );
    const data = response.ok ? await response.json() : null;
    const route = data?.routes?.[0];

    if (!route?.geometry?.coordinates?.length) {
      return fallbackRoute;
    }

    return {
      coordinates: route.geometry.coordinates.map(
        ([longitude, latitude]: [number, number]) => ({ latitude, longitude })
      ),
      distanceKm: route.distance / 1000,
      durationMin: Math.max(1, Math.ceil(route.duration / 60)),
      isEstimated: false,
    };
  } catch {
    // Keep navigation usable during a demo when the public routing service is unavailable.
    return fallbackRoute;
  }
}

function createEstimatedRoute(origin: Coordinate, destination: Coordinate): Route {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(destination.latitude - origin.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(origin.latitude)) *
      Math.cos(toRadians(destination.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  const straightDistanceKm = earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = straightDistanceKm * 1.25;

  return {
    coordinates: [origin, destination],
    distanceKm,
    durationMin: Math.max(1, Math.ceil((distanceKm / 35) * 60)),
    isEstimated: true,
  };
}
