import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Transaction } from "@/types";
import { colors } from "@/lib/theme";
import { formatINR } from "@/utils/finance";

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  Food: "restaurant-outline", Travel: "train-outline", Shopping: "bag-outline",
  Bills: "receipt-outline", Health: "heart-outline", Work: "briefcase-outline",
  Entertainment: "game-controller-outline", Other: "ellipsis-horizontal-circle-outline",
};

export function TransactionRow({ item, onPress }: { item: Transaction; onPress?: () => void }) {
  const positive = item.type === "income";
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.icon}>
        <Ionicons name={iconMap[item.category] ?? "wallet-outline"} size={20} color={colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.sub}>{item.category} · {item.date}</Text>
      </View>
      <Text style={[styles.amount, { color: positive ? colors.green : colors.text }]}>
        {positive ? "+" : "−"}{formatINR(item.amount)}
      </Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.panel2, alignItems: "center", justifyContent: "center" },
  title: { color: colors.text, fontWeight: "700", fontSize: 14 },
  sub: { color: colors.muted, fontSize: 11, marginTop: 4 },
  amount: { fontWeight: "700", fontSize: 13 },
});
