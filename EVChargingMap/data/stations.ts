export type Station = {
  id: string;
  name: string;
  address: string;
  distance: string;
  status: "Available" | "In Use" | "Offline";
  chargers: number;
  power: string;
  connector: string[];
  price: string;
  latitude: number;
  longitude: number;
};

const stations: Station[] = [
  {
    id: "1",
    name: "EV Station Central",
    address: "Central Bangkok",
    distance: "0.8 km",
    status: "Available",
    chargers: 4,
    power: "120 kW",
    connector: ["CCS2", "Type 2"],
    price: "7.50 THB/kWh",
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
    power: "180 kW",
    connector: ["CCS2", "CHAdeMO"],
    price: "8.00 THB/kWh",
    latitude: 13.8211,
    longitude: 100.5146,
  },
  {
    id: "3",
    name: "Green Charge",
    address: "Bang Sue, Bangkok",
    distance: "2.4 km",
    status: "Available",
    chargers: 8,
    power: "240 kW",
    connector: ["CCS2", "Type 2"],
    price: "7.00 THB/kWh",
    latitude: 13.8215,
    longitude: 100.5140,
  },
  {
    id: "4",
    name: "Fast Charge Station",
    address: "Ratchada, Bangkok",
    distance: "3.1 km",
    status: "Offline",
    chargers: 4,
    power: "150 kW",
    connector: ["CCS2"],
    price: "7.90 THB/kWh",
    latitude: 13.7804,
    longitude: 100.5742,
  },
];

export default stations;