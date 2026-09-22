import { stations } from "../data/stations";

export async function searchEVStations(
  latitude: number,
  longitude: number
) {
  const distance = (station: (typeof stations)[number]) =>
    (station.latitude - latitude) ** 2 +
    (station.longitude - longitude) ** 2;

  // The bundled station list keeps the app usable during a presentation,
  // without a network request or a provider-specific API key.
  return [...stations]
    .sort((first, second) => distance(first) - distance(second))
    .slice(0, 20);
}
