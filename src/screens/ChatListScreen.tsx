import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type ChatRoom = {
  id: string;
  donation_id: string;
  donor_id: string;
  requester_id: string;
  created_at: string;
  donation: { food_name: string } | null;
  donor: { name: string } | null;
  requester: { name: string } | null;
  last_message: { content: string; created_at: string } | null;
};

export default function ChatListScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("chat_rooms")
      .select(
        `id, donation_id, donor_id, requester_id, created_at,
         donation:donations(food_name),
         donor:profiles!chat_rooms_donor_id_fkey(name),
         requester:profiles!chat_rooms_requester_id_fkey(name)`
      )
      .or(`donor_id.eq.${profile.id},requester_id.eq.${profile.id}`)
      .order("created_at", { ascending: false });

    if (error || !data) {
      setLoading(false);
      return;
    }

    // busca última mensagem de cada sala
    const roomsWithLastMessage = await Promise.all(
      data.map(async (room: any) => {
        const { data: msgs } = await supabase
          .from("messages")
          .select("content, created_at")
          .eq("room_id", room.id)
          .order("created_at", { ascending: false })
          .limit(1);

        return {
          ...room,
          last_message: msgs && msgs.length > 0 ? msgs[0] : null,
        };
      })
    );

    setRooms(roomsWithLastMessage);
    setLoading(false);
  }, [profile]);

  useFocusEffect(
    useCallback(() => {
      fetchRooms();
    }, [fetchRooms])
  );

  // subscription em tempo real: qualquer mensagem nova recarrega a lista
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel("chatlist_messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => { fetchRooms(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile, fetchRooms]);

  function getOtherPersonName(room: ChatRoom): string {
    if (!profile) return "";
    return profile.id === room.donor_id
      ? room.requester?.name ?? "Usuário"
      : room.donor?.name ?? "Usuário";
  }

  function getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3DDC97" />
      </View>
    );
  }

  if (rooms.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>💬</Text>
        <Text style={styles.emptyTitle}>Nenhuma conversa ainda</Text>
        <Text style={styles.emptySubtitle}>
          Quando uma doação for aceita, o chat aparece aqui.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mensagens</Text>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => {
          const otherName = getOtherPersonName(item);
          const time = item.last_message
            ? formatTime(item.last_message.created_at)
            : formatTime(item.created_at);

          return (
            <TouchableOpacity
              style={styles.roomCard}
              onPress={() =>
                navigation.navigate("Chat", {
                  roomId: item.id,
                  otherName,
                  donationName: item.donation?.food_name ?? "Doação",
                })
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitial(otherName)}</Text>
              </View>
              <View style={styles.roomInfo}>
                <View style={styles.roomRow}>
                  <Text style={styles.roomName} numberOfLines={1}>
                    {otherName}
                  </Text>
                  <Text style={styles.roomTime}>{time}</Text>
                </View>
                <Text style={styles.roomDonation} numberOfLines={1}>
                  🍱 {item.donation?.food_name ?? "Doação"}
                </Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.last_message
                    ? item.last_message.content
                    : "Conversa iniciada — diga olá!"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
    paddingTop: 60,
  },
  centered: {
    flex: 1,
    backgroundColor: "#0F0F0F",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  header: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    color: "#666",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  roomCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E1E",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3DDC97",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#0F0F0F",
    fontSize: 20,
    fontWeight: "700",
  },
  roomInfo: {
    flex: 1,
  },
  roomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  roomName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  roomTime: {
    color: "#666",
    fontSize: 11,
  },
  roomDonation: {
    color: "#3DDC97",
    fontSize: 11,
    marginBottom: 2,
  },
  lastMessage: {
    color: "#888",
    fontSize: 13,
  },
});
