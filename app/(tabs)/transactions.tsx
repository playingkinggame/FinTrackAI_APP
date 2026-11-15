import React, { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Screen, Panel } from "@/components/Screen";
import { TransactionRow } from "@/components/TransactionRow";
import { useFinance } from "@/context/FinanceContext";
import { colors } from "@/lib/theme";

export default function Transactions() {
  const { transactions, deleteTransaction } = useFinance();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(() => transactions.filter(t => {
    const matches = `${t.title} ${t.category}`.toLowerCase().includes(query.toLowerCase());
    return matches && (filter === "all" || t.type === filter);
  }).sort((a,b) => b.date.localeCompare(a.date)), [transactions, query, filter]);

  const openItem = (id: string) => Alert.alert("Transaction", "Choose an action.", [
    { text: "Edit", onPress: () => router.push({ pathname: "/add-transaction", params: { id } }) },
    { text: "Delete", style: "destructive", onPress: () => Alert.alert("Delete transaction?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteTransaction(id) }
    ]) },
    { text: "Cancel", style: "cancel" },
  ]);

  return <Screen>
    <Text style={styles.heading}>Transactions</Text>
    <TextInput value={query} onChangeText={setQuery} placeholder="Search transactions..." placeholderTextColor={colors.muted} style={styles.search} />
    <View style={styles.filters}>
      {["all", "expense", "income"].map(f => <Pressable key={f} onPress={() => setFilter(f)} style={[styles.filter, filter === f && styles.active]}>
        <Text style={[styles.filterText, filter === f && { color: colors.accent }]}>{f[0].toUpperCase()+f.slice(1)}</Text>
      </Pressable>)}
    </View>
    <Panel style={{ paddingVertical: 5 }}>
      {filtered.length ? filtered.map(item => <TransactionRow key={item.id} item={item} onPress={() => openItem(item.id)} />) :
        <Text style={styles.empty}>No matching transactions found.</Text>}
    </Panel>
  </Screen>;
}
const styles = StyleSheet.create({
  heading: { color: colors.text, fontSize: 26, fontWeight: "800", marginTop: 12, marginBottom: 17 },
  search: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, borderRadius: 13, padding: 14, color: colors.text, marginBottom: 12 },
  filters: { flexDirection: "row", gap: 8, marginBottom: 14 },
  filter: { backgroundColor: colors.panel, borderColor: colors.border, borderWidth: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 9 },
  active: { borderColor: colors.accent, backgroundColor: "#173E49" },
  filterText: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  empty: { color: colors.muted, padding: 20, textAlign: "center" },
});
