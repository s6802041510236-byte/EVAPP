export type StationStatus =
  | "Available"
  | "In Use"
  | "Offline";

export type Station = {
  id: string;
  name: string;
  address: string;
  distance: string;
  status: StationStatus;
  chargers: number;
  availableChargers: number;
  power: string;
  price: string;
  openingHours: string;
  latitude: number;
  longitude: number;
};

export const stations: Station[] = [
  {
    id: "1",
    name: "EV Station Central",
    address: "Bangkok, Thailand",
    distance: "0.8 km",
    status: "Available",
    chargers: 4,
    availableChargers: 3,
    power: "120 kW",
    price: "8.00 ฿ / kWh",
    openingHours: "24 Hours",
    latitude: 13.819552,
    longitude: 100.514812,
  },
  {
    id: "2",
    name: "EV Power Station",
    address: "Chatuchak, Bangkok",
    distance: "1.6 km",
    status: "In Use",
    chargers: 6,
    availableChargers: 2,
    power: "180 kW",
    price: "7.50 ฿ / kWh",
    openingHours: "24 Hours",
    latitude: 13.827,
    longitude: 100.559,
  },
  {
    id: "3",
    name: "Green Charge",
    address: "Bang Sue, Bangkok",
    distance: "2.4 km",
    status: "Available",
    chargers: 8,
    availableChargers: 6,
    power: "240 kW",
    price: "7.00 ฿ / kWh",
    openingHours: "06:00 - 24:00",
    latitude: 13.820,
    longitude: 100.530,
  },
  {
    id: "4",
    name: "Fast EV Hub",
    address: "Ratchada, Bangkok",
    distance: "3.1 km",
    status: "Available",
    chargers: 10,
    availableChargers: 8,
    power: "360 kW",
    price: "9.00 ฿ / kWh",
    openingHours: "24 Hours",
    latitude: 13.765,
    longitude: 100.570,
  },
  {
    id: "5",
    name: "City Charge",
    address: "Siam, Bangkok",
    distance: "4.2 km",
    status: "Offline",
    chargers: 4,
    availableChargers: 0,
    power: "100 kW",
    price: "7.50 ฿ / kWh",
    openingHours: "08:00 - 22:00",
    latitude: 13.746,
    longitude: 100.534,
  },
  {
    id: "6",
    name: "EV Green Point",
    address: "Ladprao, Bangkok",
    distance: "5.0 km",
    status: "Available",
    chargers: 6,
    availableChargers: 4,
    power: "150 kW",
    price: "7.80 ฿ / kWh",
    openingHours: "24 Hours",
    latitude: 13.804,
    longitude: 100.575,
  },
];

export function getStationById(id: string) {
  return stations.find((station) => station.id === id);
}