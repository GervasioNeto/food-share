import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
 Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type Request = {
  id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  requester_id: string;
  donation_id: string;

  donations:
    | {
        food_name: string;
        quantity: number;
        unit: string;
        donor_id: string;
      }[]
    | null;

  profiles:
    | {
        name: string;
        phone?: string;
      }[]
    | null;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  accepted: "Aceita",
  rejected: "Recusada",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "#FFA500",
  accepted: "#3DDC97",
  rejected: "#FF4D4D",
};

export default function RequestsScreen({ navigation }: any) {
  const { user } = useAuth();

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("requests")
        .select(`
          id,
          status,
          created_at,
          requester_id,
          donation_id,
          donations!inner (
            food_name,
            quantity,
            unit,
            donor_id
          ),
          profiles:requester_id (
            name,
            phone
          )
        `)
        .eq("donations.donor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setRequests(data as Request[]);
    } catch (err) {
      console.error("fetchRequests error:", err);

      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível carregar solicitações.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchRequests();
    }, [fetchRequests]),
  );

  async function updateStatus(
    id: string,
    status: "accepted" | "rejected",
    request: Request,
  ) {
    const requesterName =
      request.profiles?.[0]?.name ?? "usuário";

    const actionLabel =
      status === "accepted" ? "Aceitar" : "Recusar";

    Alert.alert(
      `${actionLabel} solicitação`,
      `${actionLabel} pedido de ${requesterName}?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: actionLabel,
          style:
            status === "rejected"
              ? "destructive"
              : "default",
          onPress: () =>
            executeUpdate(id, status, request),
        },
      ],
    );
  }

  async function executeUpdate(
    id: string,
    status: "accepted" | "rejected",
    request: Request,
  ) {
    setActionLoading(id);

    try {
      if (status === "rejected") {
        const { error } = await supabase
          .from("requests")
          .update({ status: "rejected" })
          .eq("id", id);

        if (error) throw error;
      }

      
      if (status === "accepted") {
        const { error: acceptError } = await supabase
          .from("requests")
          .update({ status: "accepted" })
          .eq("id", id);
        if (acceptError) throw acceptError;

        
        const { error: rejectOthersError } =
          await supabase
            .from("requests")
            .update({ status: "rejected" })
            .eq(
              "donation_id",
              request.donation_id,
            )
            .neq("id", id);

        if (rejectOthersError)
          throw rejectOthersError;

        
        const { error: donationError } =
          await supabase
            .from("donations")
            .update({ status: "reserved" })
            .eq("id", request.donation_id);

        if (donationError) throw donationError;

        
        if (user) {
          const { error: chatError } =
            await supabase
              .from("chat_rooms")
              .insert({
                request_id: id,
                donor_id: user.id,
                requester_id:
                  request.requester_id,
                donation_id:
                  request.donation_id,
              });

          if (chatError) throw chatError;
        }
      }

     
      const foodName =
        request.donations?.[0]?.food_name ??
        "doação";

      const { error: notificationError } =
        await supabase
          .from("notifications")
          .insert({
            user_id: request.requester_id,
            title:
              status === "accepted"
                ? "Solicitação aceita! 🎉"
                : "Solicitação recusada",
            body:
              status === "accepted"
                ? `Sua solicitação de "${foodName}" foi aceita. Acesse a aba Chats para combinar a entrega.`
                : `Sua solicitação de "${foodName}" não foi aceita desta vez.`,
            type: status,
            read: false,
          });

      if (notificationError)
        throw notificationError;

     
      setRequests((prev) =>
        prev.map((r) => {
          if (r.id === id) {
            return {
              ...r,
              status,
            };
          }

          if (
            status === "accepted" &&
            r.donation_id ===
              request.donation_id
          ) {
            return {
              ...r,
              status: "rejected",
            };
          }

          return r;
        }),
      );

      
      Toast.show({
        type: "success",
        text1:
          status === "accepted"
            ? "Pedido aceito 🎉"
            : "Pedido recusado",
        text2:
          status === "accepted"
            ? "Chat criado com sucesso."
            : "O usuário foi notificado.",
        position: "top",
        visibilityTime: 2500,
      });
    } catch (err: any) {
      console.error(
        "executeUpdate error:",
        err,
      );

      Toast.show({
        type: "error",
        text1: "Erro",
        text2:
          err.message ??
          "Não foi possível atualizar.",
      });

      Alert.alert(
        "Erro",
        err.message ??
          "Não foi possível atualizar a solicitação.",
      );
    } finally {
      setActionLoading(null);
    }
  }

  function timeAgo(dateStr: string) {
    const diff =
      (Date.now() -
        new Date(dateStr).getTime()) /
      1000;

    if (diff < 60) return "agora";

    if (diff < 3600)
      return `${Math.floor(
        diff / 60,
      )}min atrás`;

    if (diff < 86400)
      return `${Math.floor(
        diff / 3600,
      )}h atrás`;

    return `${Math.floor(
      diff / 86400,
    )}d atrás`;
  }

  const pending = requests.filter(
    (r) => r.status === "pending",
  );

  const others = requests.filter(
    (r) => r.status !== "pending",
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
        >
          <Text style={s.back}>
            ← Voltar
          </Text>
        </TouchableOpacity>

        <Text style={s.title}>
          Solicitações
        </Text>

        <View style={{ width: 60 }} />
      </View>

      {pending.length > 0 && (
        <View style={s.pendingBanner}>
          <Text style={s.pendingBannerText}>
            📬 {pending.length} solicitaç
            {pending.length > 1
              ? "ões"
              : "ão"}{" "}
            aguardando resposta
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator
          color="#3DDC97"
          size="large"
          style={{ marginTop: 40 }}
        />
      ) : (
        <FlatList
          data={[...pending, ...others]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 16,
            gap: 12,
            paddingBottom: 32,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchRequests();
              }}
              tintColor="#3DDC97"
            />
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyIcon}>
                📬
              </Text>

              <Text style={s.emptyText}>
                Nenhuma solicitação ainda
              </Text>

              <Text style={s.emptySub}>
                Publique doações para
                receber pedidos
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isProcessing =
              actionLoading === item.id;

            return (
              <View
                style={[
                  s.card,
                  item.status ===
                    "pending" &&
                    s.cardPending,
                ]}
              >
                <View style={s.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={s.requesterName}
                    >
                      {item.profiles?.[0]
                        ?.name ??
                        "Usuário"}
                    </Text>

                    {item.profiles?.[0]
                      ?.phone && (
                      <Text style={s.phone}>
                        📞{" "}
                        {
                          item.profiles?.[0]
                            ?.phone
                        }
                      </Text>
                    )}
                  </View>

                  <View
                    style={[
                      s.badge,
                      {
                        backgroundColor:
                          STATUS_COLOR[
                            item.status
                          ] + "22",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.badgeText,
                        {
                          color:
                            STATUS_COLOR[
                              item.status
                            ],
                        },
                      ]}
                    >
                      {
                        STATUS_LABEL[
                          item.status
                        ]
                      }
                    </Text>
                  </View>
                </View>

                <View
                  style={s.donationInfo}
                >
                  <Text
                    style={s.donationName}
                  >
                    🥦{" "}
                    {item.donations?.[0]
                      ?.food_name ??
                      "Doação"}
                  </Text>

                  <Text
                    style={s.donationQty}
                  >
                    {
                      item.donations?.[0]
                        ?.quantity
                    }{" "}
                    {
                      item.donations?.[0]
                        ?.unit
                    }
                  </Text>
                </View>

                <Text style={s.time}>
                  {timeAgo(
                    item.created_at,
                  )}
                </Text>

                {item.status ===
                  "pending" && (
                  <View style={s.actions}>
                    <TouchableOpacity
                      style={[
                        s.rejectBtn,
                        isProcessing &&
                          s.btnDisabled,
                      ]}
                      onPress={() =>
                        updateStatus(
                          item.id,
                          "rejected",
                          item,
                        )
                      }
                      disabled={
                        isProcessing
                      }
                    >
                      {isProcessing ? (
                        <ActivityIndicator
                          color="#FF4D4D"
                          size="small"
                        />
                      ) : (
                        <Text
                          style={
                            s.rejectBtnText
                          }
                        >
                          ❌ Recusar
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        s.acceptBtn,
                        isProcessing &&
                          s.btnDisabled,
                      ]}
                      onPress={() =>
                        updateStatus(
                          item.id,
                          "accepted",
                          item,
                        )
                      }
                      disabled={
                        isProcessing
                      }
                    >
                      {isProcessing ? (
                        <ActivityIndicator
                          color="#3DDC97"
                          size="small"
                        />
                      ) : (
                        <Text
                          style={
                            s.acceptBtnText
                          }
                        >
                          ✅ Aceitar
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },

  header: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },

  back: {
    color: "#3DDC97",
    fontSize: 15,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },

  pendingBanner: {
    backgroundColor: "#FFA50022",
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFA50044",
    marginBottom: 4,
  },

  pendingBannerText: {
    color: "#FFA500",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2E2E2E",
  },

  cardPending: {
    borderColor: "#FFA50044",
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },

  requesterName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 2,
  },

  phone: {
    fontSize: 13,
    color: "#888",
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  donationInfo: {
    backgroundColor: "#252525",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
  },

  donationName: {
    color: "#CCC",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },

  donationQty: {
    color: "#3DDC97",
    fontSize: 13,
    fontWeight: "600",
  },

  time: {
    color: "#555",
    fontSize: 12,
    marginBottom: 10,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
  },

  acceptBtn: {
    flex: 1,
    backgroundColor: "#1a2e25",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3DDC97",
  },

  acceptBtnText: {
    color: "#3DDC97",
    fontWeight: "700",
    fontSize: 14,
  },

  rejectBtn: {
    flex: 1,
    backgroundColor: "#2e1a1a",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF4D4D",
  },

  rejectBtnText: {
    color: "#FF4D4D",
    fontWeight: "700",
    fontSize: 14,
  },

  btnDisabled: {
    opacity: 0.5,
  },

  empty: {
    alignItems: "center",
    marginTop: 60,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },

  emptyText: {
    color: "#555",
    fontSize: 15,
    marginBottom: 4,
  },

  emptySub: {
    color: "#444",
    fontSize: 13,
  },
});