import React from "react";
import { Link, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen, Panel } from "@/components/Screen";
import { TransactionRow } from "@/components/TransactionRow";
import { useFinance } from "@/context/FinanceContext";
import { colors } from "@/lib/theme";
import { currentMonthTransactions, formatINR, getTotals } from "@/utils/finance";

export default function Dashboard() {
  const { transactions } = useFinance();
  const monthItems = currentMonthTransactions(transactions);
  const totals = getTotals(monthItems);
  const recent = [...transactions].sort((a,b) => b.createdAt.localeCompare(a.createdAt)).slice(0,5);

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>YOUR MONEY, CLEARER</Text>
          <Text style={styles.brand}>FinTrack <Text style={{ color: colors.accent }}>AI</Text></Text>
        </View>
        <View style={styles.avatar}><Ionicons name="person" color={colors.accent} size={19} /></View>
      </View>

      <Panel style={styles.balanceCard}>
        <Text style={styles.label}>TOTAL BALANCE THIS MONTH</Text>
        <Text style={styles.balance}>{formatINR(totals.balance)}</Text>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <View style={styles.statIcon}><Ionicons name="arrow-down" color={colors.green} size={15} /></View>
            <Text style={styles.label}>INCOME</Text>
            <Text style={styles.statValue}>{formatINR(totals.income)}</Text>
          </View>
          <View style={styles.stat}>
            <View style={styles.statIcon}><Ionicons name="arrow-up" color={colors.red} size={15} /></View>
            <Text style={styles.label}>EXPENSES</Text>
            <Text style={styles.statValue}>{formatINR(totals.expenses)}</Text>
          </View>
        </View>
      </Panel>

      <View style={styles.quickRow}>
        <Pressable style={styles.addButton} onPress={() => router.push("/add-transaction")}>
          <Ionicons name="add-circle" color="#06121B" size={19} />
          <Text style={styles.addText}>Add transaction</Text>
        </Pressable>
        <Pressable style={styles.budgetButton} onPress={() => router.push("/budgets")}>
          <Ionicons name="pie-chart-outline" color={colors.accent} size={18} />
          <Text style={styles.budgetText}>Budgets</Text>
        </Pressable>
      </View>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Recent activity</Text>
        <Link href="/(tabs)/transactions" style={styles.link}>See all</Link>
      </View>
      <Panel style={{ paddingVertical: 5 }}>
        {recent.length ? recent.map(item => <TransactionRow key={item.id} item={item} />) :
          <Text style={styles.empty}>No transactions yet. Add your first one.</Text>}
      </Panel>

      <Panel style={styles.aiCard}>
        <View style={styles.aiIcon}><Ionicons name="sparkles" color={colors.accent} size={19} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.aiTitle}>Your AI money companion</Text>
          <Text style={styles.aiSub}>Ask questions about your spending and get clear summaries.</Text>
          <Pressable onPress={() => router.push("/(tabs)/assistant")}><Text style={styles.link}>Ask FinTrack AI →</Text></Pressable>
        </View>
      </Panel>
      <Text style={styles.disclaimer}>For personal tracking and education. Not financial advice.</Text>
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, marginBottom: 22 },
  eyebrow: { color: colors.muted, fontSize: 10, letterSpacing: 2, fontWeight: "700" },
  brand: { color: colors.text, fontSize: 27, fontWeight: "800", marginTop: 4 },
  avatar: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.panel2, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  balanceCard: { backgroundColor: "#14263D", borderColor: "#29435F", padding: 21 },
  label: { color: "#9EB0C7", fontSize: 10, letterSpacing: 1, fontWeight: "700" },
  balance: { color: colors.text, fontSize: 32, fontWeight: "800", marginTop: 9, marginBottom: 23 },
  stats: { flexDirection: "row", gap: 22 },
  stat: { flex: 1 },
  statIcon: { width: 25, height: 25, borderRadius: 9, backgroundColor: "#203B4C", alignItems: "center", justifyContent: "center", marginBottom: 7 },
  statValue: { color: colors.text, fontSize: 15, fontWeight: "700", marginTop: 5 },
  quickRow: { flexDirection: "row", gap: 10, marginVertical: 18 },
  addButton: { flex: 1.4, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7, backgroundColor: colors.accent, borderRadius: 14, padding: 14 },
  addText: { color: "#06121B", fontWeight: "800", fontSize: 13 },
  budgetButton: { flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7, backgroundColor: colors.panel, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 },
  budgetText: { color: colors.text, fontWeight: "700", fontSize: 13 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 11, marginTop: 7 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  link: { color: colors.accent, fontSize: 12, fontWeight: "700" },
  empty: { color: colors.muted, padding: 18, textAlign: "center" },
  aiCard: { flexDirection: "row", gap: 13, marginTop: 18, backgroundColor: "#111E31" },
  aiIcon: { width: 39, height: 39, borderRadius: 13, backgroundColor: "#203B4C", alignItems: "center", justifyContent: "center" },
  aiTitle: { color: colors.text, fontWeight: "800", fontSize: 14 },
  aiSub: { color: colors.muted, fontSize: 12, lineHeight: 18, marginVertical: 5 },
  disclaimer: { color: "#66758A", textAlign: "center", fontSize: 10, marginTop: 20 },
});
