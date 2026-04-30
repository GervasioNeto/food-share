import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type Donation = {
  id: string;
  food_name: string;
  description: string;
  quantity: number;
  unit: string;
  expiry_date: string;
  pickup_address: string;
  status: "available" | "reserved" | "completed";
  created_at: string;
  profiles: { name: string };
};

export default function HomeScreen({ navigation }: any) {
  const { profile } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [filtered, setFiltered] = useState<Donation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDonations = useCallback(async () => {
    const { data } = await supabase
      .from("donations")
      .select("*, profiles(name)")
      .eq("status", "available")
      .order("created_at", { ascending: false });
    if (data) {
      setDonations(data as Donation[]);
      setFiltered(data as Donation[]);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDonations();
    }, [fetchDonations]),
  );

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(donations);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      donations.filter(
        (d) =>
          d.food_name.toLowerCase().includes(q) ||
          d.pickup_address.toLowerCase().includes(q),
      ),
    );
  }, [search, donations]);

  function daysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / 86400000);
  }

  function expiryColor(days: number) {
    if (days <= 1) return "#FF4D4D";
    if (days <= 3) return "#FFA500";
    return "#3DDC97";
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>
            Olá, {profile?.name?.split(" ")[0] ?? "visitante"} 👋
          </Text>
          <Text style={s.sub}>Veja as doações disponíveis</Text>
        </View>
      </View>

      <TextInput
        style={s.search}
        placeholder="Buscar alimentos..."
        placeholderTextColor="#555"
        value={search}
        onChangeText={setSearch}
      />

      {profile?.role === "donor" && (
        <View style={s.donorActions}>
          <TouchableOpacity
            style={s.actionChip}
            onPress={() => navigation.navigate("MyDonations")}
          >
            <Text style={s.actionChipText}>📦 Minhas doações</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.actionChip}
            onPress={() => navigation.navigate("Requests")}
          >
            <Text style={s.actionChipText}>📬 Solicitações</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 40 }}
          color="#3DDC97"
          size="large"
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchDonations();
              }}
              tintColor="#3DDC97"
            />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🍽️</Text>
              <Text style={s.emptyText}>
                Nenhuma doação disponível no momento
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const days = daysUntil(item.expiry_date);
            return (
              <TouchableOpacity
                style={s.card}
                onPress={() =>
                  navigation.navigate("DonationDetail", { donation: item })
                }
                activeOpacity={0.8}
              >
                <View style={s.cardTop}>
                  <Text style={s.foodName}>{item.food_name}</Text>
                  <View
                    style={[
                      s.expiryBadge,
                      { backgroundColor: expiryColor(days) + "22" },
                    ]}
                  >
                    <Text style={[s.expiryText, { color: expiryColor(days) }]}>
                      {days <= 0 ? "Vence hoje" : `${days}d`}
                    </Text>
                  </View>
                </View>
                <Text style={s.quantity}>
                  {item.quantity} {item.unit}
                </Text>
                <Text style={s.description} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={s.cardFooter}>
                  <Text style={s.address} numberOfLines={1}>
                    📍 {item.pickup_address}
                  </Text>
                  <Text style={s.donor}>por {item.profiles?.name}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {profile?.role === "donor" && (
        <TouchableOpacity
          style={s.fab}
          onPress={() => navigation.navigate("NewDonation")}
          activeOpacity={0.85}
        >
          <Text style={s.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0F0F0F" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: { fontSize: 22, fontWeight: "700", color: "#FFF" },
  sub: { fontSize: 13, color: "#888", marginTop: 2 },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#3DDC97",
    alignItems: "center",
    justifyContent: "center",
  },
  fabText: {
    color: "#0F0F0F",
    fontWeight: "700",
    fontSize: 28,
    lineHeight: 32,
    marginTop: -6,
  },
  search: {
    backgroundColor: "#1E1E1E",
    color: "#FFF",
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#2E2E2E",
    marginBottom: 8,
  },
  donorActions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  actionChip: {
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2E2E2E",
  },
  actionChipText: { color: "#CCC", fontSize: 13 },
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2E2E2E",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  foodName: { fontSize: 17, fontWeight: "700", color: "#FFF", flex: 1 },
  expiryBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  expiryText: { fontSize: 12, fontWeight: "600" },
  quantity: {
    fontSize: 14,
    color: "#3DDC97",
    fontWeight: "600",
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: "#AAA",
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  address: { fontSize: 12, color: "#777", flex: 1 },
  donor: { fontSize: 12, color: "#555" },
  empty: { alignItems: "center", marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { color: "#555", fontSize: 15, textAlign: "center" },
});
