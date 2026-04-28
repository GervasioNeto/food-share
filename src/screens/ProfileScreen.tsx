import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { useFocusEffect } from "@react-navigation/native";

type Stats = {
  total: number;
  completed: number;
  kg_donated: number;
};

export default function ProfileScreen({ navigation }: any) {
  const { profile, signOut, user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    kg_donated: 0,
  });

  // 🔹 função extraída (mesma lógica original)
  const loadStats = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("donations")
      .select("status, quantity")
      .eq("donor_id", user!.id);

    if (data) {
      const total = data.length;
      const completed = data.filter((d) => d.status === "completed").length;
      const kg_donated = data
        .filter((d) => d.status === "completed")
        .reduce((acc, d) => acc + (Number(d.quantity) || 0), 0);

      setStats({ total, completed, kg_donated });
    }
  };

  // 🔹 mantém comportamento original
  useEffect(() => {
    loadStats();
  }, [user]);

  // 🔹 NOVO: atualiza ao voltar pra tela
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [user])
  );

  function handleSignOut() {
    if (Platform.OS === "web") {
      if (window.confirm("Deseja sair da sua conta?")) signOut();
    } else {
      Alert.alert("Sair", "Deseja sair da sua conta?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: signOut },
      ]);
    }
  }

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const roleLabel = profile?.role === "donor" ? "Doador" : "Receptor";
  const roleColor = profile?.role === "donor" ? "#3DDC97" : "#60A5FA";

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.pageTitle}>Perfil & Impacto</Text>

        <View style={s.avatarSection}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <Text style={s.name}>{profile?.name ?? "—"}</Text>
          <View style={[s.roleBadge, { backgroundColor: roleColor + "22" }]}>
            <Text style={[s.roleText, { color: roleColor }]}>{roleLabel}</Text>
          </View>
          {profile?.address && (
            <Text style={s.address}>📍 {profile.address}</Text>
          )}
        </View>

        {profile?.role === "donor" && (
          <View style={s.impactCard}>
            <Text style={s.impactTitle}>🌱 Seu impacto</Text>
            <View style={s.statsRow}>
              <StatBox value={stats.total} label="Doações" />
              <View style={s.divider} />
              <StatBox value={stats.completed} label="Concluídas" />
              <View style={s.divider} />
              <StatBox value={`${stats.kg_donated}kg`} label="Doados" />
            </View>
            <View style={s.progressBar}>
              <View
                style={[
                  s.progressFill,
                  {
                    width: `${Math.min(
                      (stats.completed / Math.max(stats.total, 1)) * 100,
                      100
                    )}%`,
                  },
                ]}
              />
            </View>
            <Text style={s.progressLabel}>
              {stats.total > 0
                ? `${Math.round((stats.completed / stats.total) * 100)}% das suas doações foram concluídas`
                : "Faça sua primeira doação!"}
            </Text>
          </View>
        )}

        <View style={s.infoCard}>
          <InfoRow icon="📧" label="E-mail" value={user?.email ?? "—"} />
          {profile?.phone && (
            <InfoRow icon="📞" label="Telefone" value={profile.phone} />
          )}
        </View>

        <View style={{ gap: 12 }}>
          <TouchableOpacity
            style={s.editProfileBtn}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Text style={s.editProfileText}>Editar perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
            <Text style={s.signOutText}>Sair da conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoIcon}>{icon}</Text>
      <View>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={s.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0F0F0F" },
  container: { padding: 20, paddingBottom: 48 },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 24,
  },
  avatarSection: { alignItems: "center", marginBottom: 24 },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#1a2e25",
    borderWidth: 2,
    borderColor: "#3DDC97",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: "700", color: "#3DDC97" },
  name: { fontSize: 22, fontWeight: "700", color: "#FFF", marginBottom: 8 },
  roleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 8,
  },
  roleText: { fontSize: 13, fontWeight: "600" },
  address: { fontSize: 13, color: "#666", marginTop: 4 },
  impactCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2E2E2E",
    marginBottom: 16,
  },
  impactTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 16,
  },
  statsRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  divider: { width: 1, height: 32, backgroundColor: "#2E2E2E" },
  statValue: { fontSize: 24, fontWeight: "800", color: "#3DDC97" },
  statLabel: { fontSize: 12, color: "#888", marginTop: 2 },
  progressBar: {
    height: 6,
    backgroundColor: "#2E2E2E",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: "100%", backgroundColor: "#3DDC97", borderRadius: 3 },
  progressLabel: { fontSize: 12, color: "#666", textAlign: "center" },
  infoCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2E2E2E",
    marginBottom: 24,
    gap: 12,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  infoIcon: { fontSize: 20 },
  infoLabel: { fontSize: 12, color: "#888" },
  infoValue: { fontSize: 14, color: "#FFF", fontWeight: "500" },
  editProfileBtn: {
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#3DDC97",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  editProfileText: { color: "#3DDC97", fontWeight: "600", fontSize: 15 },
  signOutBtn: {
    borderWidth: 1,
    borderColor: "#FF4D4D",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  signOutText: { color: "#FF4D4D", fontWeight: "600", fontSize: 15 },
});