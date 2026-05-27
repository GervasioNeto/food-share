import React, { useState, useEffect, useRef } from "react";
import {
  Alert,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type Message = {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type RouteParams = {
  roomId: string;
  otherName: string;
  donationName: string;
};

export default function ChatScreen() {
  const { profile } = useAuth();
  const navigation = useNavigation();
  const route = useRoute();
  const { roomId, otherName, donationName } = route.params as RouteParams;

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();
  }, [roomId]);

  useEffect(() => {
    const channel = supabase
      .channel(`room_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMsg.id);
            if (exists) return prev;
            return [...prev, newMsg];
          });
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  async function fetchMessages() {
    setLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    setMessages(data ?? []);
    setLoading(false);
    setTimeout(scrollToBottom, 100);
  }

  function scrollToBottom() {
    listRef.current?.scrollToEnd({ animated: true });
  }

async function sendMessage() {
  const trimmed = text.trim();

  if (!trimmed || !profile || sending) {
    return;
  }

  setSending(true);

  try {
    const { error } = await supabase
      .from("messages")
      .insert({
        room_id: roomId,
        sender_id: profile.id,
        content: trimmed,
      });

    if (error) {
      throw error;
    }

    setText("");

    scrollToBottom();
  } catch (err: any) {
    console.error(
      "sendMessage error:",
      err
    );
    Alert.alert(
      "Erro ao enviar mensagem",
      err?.message ??
        "Verifique sua conexão e tente novamente."
    );
  } finally {
    setSending(false);
  }
}

  function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function isMine(msg: Message): boolean {
    return msg.sender_id === profile?.id;
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3DDC97" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
     
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {otherName}
          </Text>
          <Text style={styles.headerDonation} numberOfLines={1}>
            🍱 {donationName}
          </Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={scrollToBottom}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatText}>
              Diga olá e combine a entrega!
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const mine = isMine(item);
          const prevMsg = messages[index - 1];
          const showDateSeparator =
            !prevMsg ||
            new Date(item.created_at).toDateString() !==
              new Date(prevMsg.created_at).toDateString();

          return (
            <>
              {showDateSeparator && (
                <View style={styles.dateSeparator}>
                  <Text style={styles.dateSeparatorText}>
                    {new Date(item.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                    })}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.bubbleWrapper,
                  mine ? styles.bubbleWrapperMine : styles.bubbleWrapperOther,
                ]}
              >
                <View
                  style={[
                    styles.bubble,
                    mine ? styles.bubbleMine : styles.bubbleOther,
                  ]}
                >
                  <Text style={mine ? styles.bubbleTextMine : styles.bubbleTextOther}>
                    {item.content}
                  </Text>
                  <Text style={styles.bubbleTime}>{formatTime(item.created_at)}</Text>
                </View>
              </View>
            </>
          );
        }}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Digite uma mensagem..."
          placeholderTextColor="#555"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!text.trim() || sending}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },
  centered: {
    flex: 1,
    backgroundColor: "#0F0F0F",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: "#1a1a1a",
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a2a",
  },
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  backText: {
    color: "#3DDC97",
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  headerDonation: {
    color: "#3DDC97",
    fontSize: 12,
    marginTop: 2,
  },
  messageList: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyChat: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyChatText: {
    color: "#555",
    fontSize: 14,
  },
  dateSeparator: {
    alignItems: "center",
    marginVertical: 12,
  },
  dateSeparatorText: {
    color: "#555",
    fontSize: 11,
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bubbleWrapper: {
    marginBottom: 4,
    flexDirection: "row",
  },
  bubbleWrapperMine: {
    justifyContent: "flex-end",
  },
  bubbleWrapperOther: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleMine: {
    backgroundColor: "#3DDC97",
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: "#1E1E1E",
    borderBottomLeftRadius: 4,
  },
  bubbleTextMine: {
    color: "#0F0F0F",
    fontSize: 14,
  },
  bubbleTextOther: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  bubbleTime: {
    color: "rgba(0,0,0,0.4)",
    fontSize: 10,
    alignSelf: "flex-end",
    marginTop: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 10,
    backgroundColor: "#1a1a1a",
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#0F0F0F",
    color: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  sendBtn: {
    backgroundColor: "#3DDC97",
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#1E1E1E",
  },
  sendIcon: {
    color: "#0F0F0F",
    fontSize: 16,
    fontWeight: "700",
  },
});
