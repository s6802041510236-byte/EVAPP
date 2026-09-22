# Firebase and map setup

## Firebase Realtime Database

1. Create a Firebase project and a Realtime Database.
2. Add a Web app in Project settings and copy its values into `.env` using `.env.example` as the template.
3. For a classroom/demo database, give clients access to the `favorites` path. Before release, enable Firebase Authentication and write rules based on `auth.uid`.

The app stores favorites at `favorites/{deviceId}` and keeps AsyncStorage as an offline fallback.

## Map and directions

The app uses MapLibre with OpenFreeMap for its base map, so no Google Maps SDK, card, or map API key is needed. Route lines are calculated with OSRM using OpenStreetMap road data and also do not need an API key.

MapLibre contains native code, so create a new Android development build after installing dependencies. It cannot run in Expo Go.
