import { ArrowLeft } from "lucide-react-native";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={s.btn}>
      <View style={s.inner}>
        <ArrowLeft size={18} color="#3DDC97" />
        <Text style={s.label}>Voltar</Text>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 12,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    color: "#3DDC97",
    fontSize: 15,
    fontWeight: "500",
  },
});