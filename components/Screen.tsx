import React from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "@/lib/theme";

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <ScrollView style={styles.root} contentContainerStyle={[styles.content, style]} keyboardShouldPersistTaps="handled">{children}</ScrollView>;
}
export function Panel({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 36 },
  panel: { backgroundColor: colors.panel, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 18 },
});
