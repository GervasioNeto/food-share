import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  Platform,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type RequestStatus = "pending" | "accepted" | "rejected";

type ContactInfo = {
  name: string;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
};

type RequestDetail = {
  id: string;
  status: RequestStatus;
  created_at: string;
  donation_id: string;
  requester_id: string;
  requester: ContactInfo;
  donation: {
    id: string;
    food_name: string;
    quantity: number;
    unit: string;
    pickup_address: string;
    expiry_date: string;
    image_url: string | null;
    donor: ContactInfo | null;
  };
};

const STATUS_CONFIG: Record<
  RequestStatus,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Pendente", color: "#FFA500", bg: "#FFA50022" },
  accepted: { label: "Aceita", color: "#3DDC97", bg: "#3DDC9722" },
  rejected: { label: "Recusada", color: "#FF4D4D", bg: "#FF4D4D22" },
};

// Tipos de notificação vistos pelo RECEPTOR (mostram info do doador)
const RECEIVER_VIEW_TYPES = new Set(["accepted", "rejected"]);

export default function NotificationDetailScreen({ route, navigation }: any) {
  const { notificationId } = route.params;
  const { user } = useAuth();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifType, setNotifType] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<
    "accepted" | "rejected" | null
  >(null);

  useEffect(() => {
    loadData();
  }, [notificationId]);

  async function loadData() {
    try {
      const { data: notif, error: notifErr } = await supabase
        .from("notifications")
        .select("title, type, request_id")
        .eq("id", notificationId)
        .single();

      if (notifErr) throw notifErr;
      setNotifTitle(notif.title);
      setNotifType(notif.type ?? "");

      if (!notif.request_id) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("requests")
        .select(
          `
          id, status, created_at, donation_id, requester_id,
          requester:requester_id ( name, phone, address, avatar_url ),
          donation:donation_id (
            id, food_name, quantity, unit, pickup_address, expiry_date, image_url,
            donor:donor_id ( name, phone, address, avatar_url )
          )
        `,
        )
        .eq("id", notif.request_id)
        .single();

      if (error) throw error;
      setRequest(data as unknown as RequestDetail);
    } catch (err: any) {
      console.error("loadData error:", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: "accepted" | "rejected") {
    if (!request || !user) return;
    const label = action === "accepted" ? "aceitar" : "recusar";

    const confirmed =
      Platform.OS === "web"
        ? window.confirm(
            `Deseja ${label} o pedido de ${request.requester.name}?`,
          )
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              `${action === "accepted" ? "Aceitar" : "Recusar"} solicitação`,
              `Deseja ${label} o pedido de ${request.requester.name}?`,
              [
                {
                  text: "Cancelar",
                  style: "cancel",
                  onPress: () => resolve(false),
                },
                {
                  text: action === "accepted" ? "Aceitar" : "Recusar",
                  style: action === "rejected" ? "destructive" : "default",
                  onPress: () => resolve(true),
                },
              ],
            );
          });

    if (!confirmed) return;
    executeAction(action);
  }

  async function executeAction(action: "accepted" | "rejected") {
    if (!request || !user) return;
    setActionLoading(action);

    try {
      const { error: reqErr } = await supabase
        .from("requests")
        .update({ status: action })
        .eq("id", request.id);

      if (reqErr) throw reqErr;

      if (action === "accepted") {
        await supabase
          .from("donations")
          .update({ status: "reserved" })
          .eq("id", request.donation_id);

        await supabase.from("chat_rooms").insert({
          request_id: request.id,
          donor_id: user.id,
          requester_id: request.requester_id,
          donation_id: request.donation_id,
        });
      }

      await supabase.from("notifications").insert({
        user_id: request.requester_id,
        title:
          action === "accepted"
            ? "Solicitação aceita! 🎉"
            : "Solicitação recusada",
        body:
          action === "accepted"
            ? `Sua solicitação de "${request.donation.food_name}" foi aceita. Acesse a aba Chats para combinar a entrega.`
            : `Sua solicitação de "${request.donation.food_name}" não foi aceita desta vez.`,
        type: action,
        read: false,
        request_id: request.id,
      });

      setRequest((prev) => (prev ? { ...prev, status: action } : prev));

      const successMsg =
        action === "accepted"
          ? `${request.requester.name} foi notificado(a).`
          : "O receptor foi notificado.";

      if (Platform.OS === "web") {
        window.alert(successMsg);
        action === "accepted"
          ? navigation.navigate("Main", { screen: "Início" })
          : navigation.goBack();
      } else {
        Alert.alert(
          action === "accepted"
            ? "Solicitação aceita ✅"
            : "Solicitação recusada",
          successMsg,
          [
            {
              text: "OK",
              onPress: () =>
                action === "accepted"
                  ? navigation.navigate("Main", { screen: "Início" })
                  : navigation.goBack(),
            },
          ],
        );
      }
    } catch (err: any) {
      const msg = err.message ?? "Não foi possível processar a ação.";
      Platform.OS === "web"
        ? window.alert(`Erro: ${msg}`)
        : Alert.alert("Erro", msg);
    } finally {
      setActionLoading(null);
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("pt-BR");
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  function openPhone(phone: string) {
    Linking.openURL(`tel:${phone}`);
  }

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator
          style={{ marginTop: 40 }}
          color="#3DDC97"
          size="large"
        />
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={s.safe}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Voltar</Text>
        </TouchableOpacity>
        <View style={s.emptyWrapper}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🔔</Text>
          <Text style={s.emptyText}>{notifTitle}</Text>
          <Text style={s.emptySub}>Nenhuma solicitação vinculada</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusConf = STATUS_CONFIG[request.status];
  const isPending = request.status === "pending";
  const isReceiverView = RECEIVER_VIEW_TYPES.has(notifType);

  // Quem aparece no card de contato depende da perspectiva
  const contactPerson = isReceiverView
    ? request.donation.donor
    : request.requester;
  const contactLabel = isReceiverView ? "DOADOR" : "SOLICITANTE";

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.container}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Voltar</Text>
        </TouchableOpacity>

        <View style={s.titleRow}>
          <Text style={s.pageTitle}>Solicitação</Text>
          <View style={[s.statusBadge, { backgroundColor: statusConf.bg }]}>
            <Text style={[s.statusText, { color: statusConf.color }]}>
              {statusConf.label}
            </Text>
          </View>
        </View>
        <Text style={s.pageDate}>{formatDate(request.created_at)}</Text>

        {/* Card: Contato (doador ou solicitante conforme perspectiva) */}
        <View style={s.card}>
          <Text style={s.cardLabel}>{contactLabel}</Text>
          <View style={s.requesterRow}>
            {contactPerson?.avatar_url ? (
              <Image
                source={{ uri: contactPerson.avatar_url }}
                style={s.avatar}
              />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarInitials}>
                  {getInitials(contactPerson?.name ?? "?")}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.requesterName}>{contactPerson?.name ?? "—"}</Text>
              {contactPerson?.phone && (
                <Text style={s.requesterMeta}>📞 {contactPerson.phone}</Text>
              )}
              {contactPerson?.address && (
                <Text style={s.requesterMeta}>📍 {contactPerson.address}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Card: Doação */}
        <View style={s.card}>
          <Text style={s.cardLabel}>DOAÇÃO SOLICITADA</Text>
          {request.donation.image_url ? (
            <Image
              source={{ uri: request.donation.image_url }}
              style={s.donationImg}
            />
          ) : (
            <View style={s.donationImgFallback}>
              <Text style={{ fontSize: 36 }}>🥦</Text>
            </View>
          )}
          <Text style={s.donationName}>{request.donation.food_name}</Text>
          <Text style={s.donationQty}>
            {request.donation.quantity} {request.donation.unit}
          </Text>
          <View style={{ gap: 4, marginTop: 8 }}>
            <Text style={s.donationMeta}>
              📅 Validade: {formatDate(request.donation.expiry_date)}
            </Text>
            <Text style={s.donationMeta}>
              📍 Retirada: {request.donation.pickup_address}
            </Text>
          </View>
        </View>

        {/* Ações — só para o DOADOR em solicitações pendentes */}
        {!isReceiverView && isPending && (
          <View style={s.actionsRow}>
            <TouchableOpacity
              style={[s.btn, s.btnReject]}
              onPress={() => handleAction("rejected")}
              disabled={actionLoading !== null}
            >
              {actionLoading === "rejected" ? (
                <ActivityIndicator color="#FF4D4D" />
              ) : (
                <Text style={s.btnRejectText}>✕ Recusar</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btn, s.btnAccept]}
              onPress={() => handleAction("accepted")}
              disabled={actionLoading !== null}
            >
              {actionLoading === "accepted" ? (
                <ActivityIndicator color="#0F0F0F" />
              ) : (
                <Text style={s.btnAcceptText}>✓ Aceitar</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Banner processado — doador após decidir */}
        {!isReceiverView && !isPending && (
          <View style={[s.processedBanner, { borderColor: statusConf.color }]}>
            <Text style={[s.processedText, { color: statusConf.color }]}>
              {request.status === "accepted"
                ? "✓ Você aceitou esta solicitação"
                : "✕ Você recusou esta solicitação"}
            </Text>
          </View>
        )}

        {/* Banner para o RECEPTOR — aceita */}
        {isReceiverView && request.status === "accepted" && (
          <View style={[s.processedBanner, { borderColor: "#3DDC97" }]}>
            <Text style={[s.processedText, { color: "#3DDC97" }]}>
              🎉 Sua solicitação foi aceita! Entre em contato com o doador
              acima.
            </Text>
          </View>
        )}

        {/* Banner para o RECEPTOR — recusada */}
        {isReceiverView && request.status === "rejected" && (
          <View style={[s.processedBanner, { borderColor: "#FF4D4D" }]}>
            <Text style={[s.processedText, { color: "#FF4D4D" }]}>
              ✕ Esta solicitação não foi aceita desta vez.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0F0F0F" },
  container: { padding: 20, paddingBottom: 48 },
  backBtn: { marginBottom: 16 },
  backText: { color: "#3DDC97", fontSize: 15 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  pageTitle: { fontSize: 24, fontWeight: "700", color: "#FFF" },
  pageDate: { fontSize: 13, color: "#888", marginBottom: 20 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "700" },
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#2E2E2E",
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#555",
    letterSpacing: 1,
    marginBottom: 12,
  },
  requesterRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#3DDC97",
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1a2e25",
    borderWidth: 2,
    borderColor: "#3DDC97",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: { fontSize: 20, fontWeight: "700", color: "#3DDC97" },
  requesterName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 4,
  },
  requesterMeta: { fontSize: 13, color: "#888", marginTop: 2 },
  callBtn: {
    marginTop: 14,
    backgroundColor: "#1a2e25",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3DDC97",
  },
  callBtnText: { color: "#3DDC97", fontWeight: "700", fontSize: 14 },
  donationImg: {
    width: "100%",
    height: 130,
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: "#2a2a2a",
  },
  donationImgFallback: {
    width: "100%",
    height: 80,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  donationName: {
    fontSize: 19,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 2,
  },
  donationQty: { fontSize: 14, color: "#3DDC97", fontWeight: "600" },
  donationMeta: { fontSize: 13, color: "#888" },
  actionsRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  btn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnReject: {
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#FF4D4D",
  },
  btnRejectText: { color: "#FF4D4D", fontWeight: "700", fontSize: 15 },
  btnAccept: { backgroundColor: "#3DDC97" },
  btnAcceptText: { color: "#0F0F0F", fontWeight: "700", fontSize: 15 },
  processedBanner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  processedText: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  emptyWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
  },
  emptyText: {
    fontSize: 16,
    color: "#CCC",
    fontWeight: "600",
    marginBottom: 4,
  },
  emptySub: { fontSize: 13, color: "#555" },
});
