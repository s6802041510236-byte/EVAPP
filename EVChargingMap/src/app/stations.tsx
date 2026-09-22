import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Station, StationStatus, stations } from "../data/stations";
import { useDistance } from "../context/DistanceContext";
import { useFavorites } from "../context/FavoritesContext";
import { useTheme } from "../context/ThemeContext";

type StatusFilter = "All" | StationStatus;

const filters: StatusFilter[] = ["All", "Available", "In Use", "Offline"];
const statusPalette: Record<StationStatus, { light: string; dark: string }> = {
  Available: { light: "#DCFCE7", dark: "#14532D" },
  "In Use": { light: "#FEF3C7", dark: "#713F12" },
  Offline: { light: "#FEE2E2", dark: "#7F1D1D" },
};
const statusText: Record<StationStatus, string> = {
  Available: "#15803D", "In Use": "#B45309", Offline: "#B91C1C",
};

export default function StationsScreen() {
  const { colors, darkMode } = useTheme();
  const { formatDistance } = useDistance();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("All");

  const visibleStations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return stations.filter((station) => {
      const matchesFilter = filter === "All" || station.status === filter;
      const matchesQuery = !normalizedQuery || `${station.name} ${station.address}`.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Charging stations</Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>Find the right charger for your journey</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open saved stations" onPress={() => router.push("/favorites")} style={({ pressed }) => [styles.headerButton, { backgroundColor: colors.primaryLight }, pressed && styles.pressed]}>
            <Text style={[styles.headerButtonText, { color: colors.primary }]}>♥</Text>
          </Pressable>
        </View>

        <View style={[styles.searchBox, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
          <Text style={[styles.searchIcon, { color: colors.secondaryText }]}>⌕</Text>
          <TextInput value={query} onChangeText={setQuery} placeholder="Search by station or area" placeholderTextColor={colors.secondaryText} returnKeyType="search" style={[styles.searchInput, { color: colors.text }]} />
          {query.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery("")} hitSlop={8}><Text style={[styles.clearButton, { color: colors.secondaryText }]}>×</Text></Pressable>}
        </View>

        <View style={styles.filterRow}>
          {filters.map((item) => {
            const selected = item === filter;
            return <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setFilter(item)} style={({ pressed }) => [styles.filterChip, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }, pressed && styles.pressed]}><Text style={[styles.filterText, { color: selected ? "#FFFFFF" : colors.secondaryText }]}>{item}</Text></Pressable>;
          })}
        </View>

        <FlatList
          data={visibleStations}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<Text style={[styles.resultText, { color: colors.secondaryText }]}>{visibleStations.length} stations found</Text>}
          ListEmptyComponent={<View style={styles.emptyState}><Text style={styles.emptyIcon}>⌕</Text><Text style={[styles.emptyTitle, { color: colors.text }]}>No stations found</Text><Text style={[styles.emptyText, { color: colors.secondaryText }]}>Try a different search or filter.</Text></View>}
          renderItem={({ item }) => {
            const favorite = isFavorite(item.id);
            const badgeBackground = darkMode ? statusPalette[item.status].dark : statusPalette[item.status].light;
            return <Pressable accessibilityRole="button" accessibilityLabel={`View details for ${item.name}`} onPress={() => router.push(`/station/${item.id}`)} style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.cardPressed]}>
              <View style={styles.cardHeader}><View style={[styles.stationIcon, { backgroundColor: colors.primaryLight }]}><Text style={[styles.stationIconText, { color: colors.primary }]}>⚡</Text></View><Pressable accessibilityRole="button" accessibilityLabel={favorite ? "Remove from favorites" : "Add to favorites"} hitSlop={8} onPress={(event) => { event.stopPropagation(); toggleFavorite(item.id); }} style={({ pressed }) => [styles.favoriteButton, { backgroundColor: favorite ? "#FEF2F2" : colors.cardSecondary }, pressed && styles.pressed]}><Text style={[styles.favoriteIcon, favorite && styles.favoriteIconActive]}>{favorite ? "♥" : "♡"}</Text></Pressable></View>
              <View style={styles.nameRow}><Text numberOfLines={1} style={[styles.stationName, { color: colors.text }]}>{item.name}</Text><View style={[styles.statusBadge, { backgroundColor: badgeBackground }]}><View style={[styles.statusDot, { backgroundColor: statusText[item.status] }]} /><Text style={[styles.statusText, { color: statusText[item.status] }]}>{item.status}</Text></View></View>
              <Text numberOfLines={1} style={[styles.address, { color: colors.secondaryText }]}>{item.address}</Text>
              <View style={[styles.detailsRow, { borderColor: colors.border }]}><InfoItem label="Distance" value={formatDistance(parseFloat(item.distance))} color={colors.text} /><InfoItem label="Power" value={item.power} color={colors.text} /><InfoItem label="Available" value={`${item.availableChargers}/${item.chargers}`} color={colors.text} /></View>
              <View style={styles.cardFooter}><Text style={[styles.price, { color: colors.secondaryText }]}>{item.price}</Text><Text style={[styles.viewDetails, { color: colors.primary }]}>View details →</Text></View>
            </Pressable>;
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function InfoItem({ label, value, color }: { label: string; value: string; color: string }) {
  return <View style={styles.infoItem}><Text style={styles.infoLabel}>{label}</Text><Text style={[styles.infoValue, { color }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 }, container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 14, paddingBottom: 20 }, title: { fontSize: 27, fontWeight: "800", letterSpacing: -0.6 }, subtitle: { marginTop: 4, fontSize: 13 }, headerButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 14 }, headerButtonText: { fontSize: 22 },
  searchBox: { height: 52, flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 16, paddingHorizontal: 14 }, searchIcon: { fontSize: 26, lineHeight: 28, marginRight: 8 }, searchInput: { flex: 1, height: "100%", fontSize: 15 }, clearButton: { fontSize: 27, lineHeight: 28 },
  filterRow: { flexDirection: "row", gap: 8, paddingVertical: 15 }, filterChip: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 13, paddingVertical: 8 }, filterText: { fontSize: 12, fontWeight: "700" }, listContent: { paddingBottom: 28 }, resultText: { fontSize: 12, fontWeight: "600", marginBottom: 10 },
  card: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 12 }, cardPressed: { transform: [{ scale: 0.985 }], opacity: 0.88 }, pressed: { opacity: 0.72 }, cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, stationIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" }, stationIconText: { fontSize: 23 }, favoriteButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" }, favoriteIcon: { fontSize: 24, color: "#9CA3AF" }, favoriteIconActive: { color: "#EF4444" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 13 }, stationName: { flex: 1, fontSize: 17, fontWeight: "800", letterSpacing: -0.2 }, statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 5 }, statusDot: { width: 6, height: 6, borderRadius: 3 }, statusText: { fontSize: 10, fontWeight: "800" }, address: { fontSize: 13, marginTop: 5 },
  detailsRow: { flexDirection: "row", borderTopWidth: 1, borderBottomWidth: 1, marginTop: 15, paddingVertical: 12 }, infoItem: { flex: 1 }, infoLabel: { color: "#94A3B8", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 }, infoValue: { fontSize: 12, fontWeight: "800", marginTop: 4 }, cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 13 }, price: { fontSize: 12, fontWeight: "600" }, viewDetails: { fontSize: 12, fontWeight: "800" },
  emptyState: { alignItems: "center", paddingTop: 70 }, emptyIcon: { fontSize: 42, color: "#94A3B8" }, emptyTitle: { marginTop: 12, fontSize: 18, fontWeight: "800" }, emptyText: { marginTop: 5, fontSize: 13 },
});
