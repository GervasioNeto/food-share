import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';

function ToastBase({ color, icon, text1, text2 }: BaseToastProps & { color: string; icon: string }) {
  return (
    <View style={[s.container, { borderLeftColor: color }]}>
      <Text style={s.icon}>{icon}</Text>
      <View style={s.content}>
        <Text style={s.title} numberOfLines={1}>{text1}</Text>
        {text2 ? <Text style={s.message} numberOfLines={2}>{text2}</Text> : null}
      </View>
    </View>
  );
}

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <ToastBase {...props} color="#3DDC97" icon="✅" />
  ),
  error: (props: BaseToastProps) => (
    <ToastBase {...props} color="#FF4D4D" icon="❌" />
  ),
  info: (props: BaseToastProps) => (
    <ToastBase {...props} color="#4DA6FF" icon="ℹ️" />
  ),
};

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 12,
  },
  icon: { fontSize: 26 },
  content: { flex: 1 },
  title: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  message: { color: '#AAA', fontSize: 13, marginTop: 3 },
});
