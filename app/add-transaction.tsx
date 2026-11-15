import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen, Panel } from "@/components/Screen";
import { useFinance } from "@/context/FinanceContext";
import { colors } from "@/lib/theme";
import { TransactionType } from "@/types";

const categories = ["Food", "Travel", "Shopping", "Bills", "Health", "Work", "Entertainment", "Other"];

export default function AddTransaction() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { transactions, addTransaction, updateTransaction } = useFinance();
  const existing = transactions.find(t => t.id === params.id);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [type, setType] = useState<TransactionType>(existing?.type ?? "expense");
  const [category, setCategory] = useState(existing?.category ?? "Food");
  const [date, setDate] = useState(existing?.date ?? new Date().toISOString().slice(0,10));
  const [note, setNote] = useState(existing?.note ?? "");

  const save = () => {
    const numeric = Number(amount);
    if (!title.trim()) return Alert.alert("Missing title", "Enter a transaction name.");
    if (!Number.isFinite(numeric) || numeric <= 0) return Alert.alert("Invalid amount", "Enter an amount greater than zero.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Alert.alert("Invalid date", "Use YYYY-MM-DD.");
    const data = { title: title.trim(), amount: numeric, type, category, date, note: note.trim() };
    if (existing) updateTransaction(existing.id, data);
    else addTransaction(data);
    router.back();
  };

  return (
    <Screen>
      <Text style={styles.heading}>{existing ? "Edit transaction" : "Add a transaction"}</Text>
      <Panel>
        <Text style={styles.label}>TRANSACTION TYPE</Text>
        <View style={styles.row}>
          {(["expense", "income"] as const).map(v => (
            <Pressable key={v} onPress={() => setType(v)} style={[styles.type, type === v && styles.selected]}>
              <Text style={[styles.typeText, type === v && styles.selectedText]}>{v.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.label}>TITLE</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Lunch" placeholderTextColor={colors.muted} style={styles.input} />
        <Text style={styles.label}>AMOUNT (INR)</Text>
        <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.muted} style={styles.amountInput} />
        <Text style={styles.label}>CATEGORY</Text>
        <View style={styles.categories}>
          {categories.map(c => <Pressable key={c} onPress={() => setCategory(c)} style={[styles.chip, category === c && styles.chipSelected]}>
            <Text style={[styles.chipText, category === c && styles.selectedText]}>{c}</Text>
          </Pressable>)}
        </View>
        <Text style={styles.label}>DATE (YYYY-MM-DD)</Text>
        <TextInput value={date} onChangeText={setDate} placeholder="2026-01-31" placeholderTextColor={colors.muted} style={styles.input} />
        <Text style={styles.label}>NOTE (OPTIONAL)</Text>
        <TextInput value={note} onChangeText={setNote} placeholder="Add a note" placeholderTextColor={colors.muted} style={styles.input} />
        <Pressable onPress={save} style={styles.save}><Text style={styles.saveText}>{existing ? "Save changes" : "Save transaction"}</Text></Pressable>
      </Panel>
    </Screen>
  );
}
const styles = StyleSheet.create({
  heading: { color: colors.text, fontSize: 24, fontWeight: "800", marginVertical: 8 },
  label: { color: colors.muted, fontSize: 10, letterSpacing: 1, fontWeight: "800", marginTop: 18, marginBottom: 9 },
  row: { flexDirection: "row", gap: 9 },
  type: { flex: 1, padding: 13, alignItems: "center", borderRadius: 12, backgroundColor: colors.panel2, borderWidth: 1, borderColor: colors.border },
  selected: { backgroundColor: "#173E49", borderColor: colors.accent },
  typeText: { color: colors.muted, fontWeight: "800", fontSize: 12 },
  selectedText: { color: colors.accent },
  input: { backgroundColor: colors.panel2, borderWidth: 1, borderColor: colors.border, borderRadius: 12, color: colors.text, padding: 14, fontSize: 14 },
  amountInput: { backgroundColor: colors.panel2, borderWidth: 1, borderColor: colors.border, borderRadius: 12, color: colors.text, padding: 15, fontSize: 24, fontWeight: "800" },
  categories: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 20, backgroundColor: colors.panel2, borderWidth: 1, borderColor: colors.border },
  chipSelected: { borderColor: colors.accent, backgroundColor: "#173E49" },
  chipText: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  save: { backgroundColor: colors.accent, borderRadius: 13, padding: 16, alignItems: "center", marginTop: 24 },
  saveText: { color: "#06121B", fontWeight: "900" },
});
