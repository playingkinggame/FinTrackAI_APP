import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Screen, Panel } from "@/components/Screen";
import { useFinance } from "@/context/FinanceContext";
import { colors } from "@/lib/theme";
import { currentMonthTransactions, formatINR, getTotals } from "@/utils/finance";

export default function Analytics() {
  const { transactions, budgets } = useFinance();
  const items = currentMonthTransactions(transactions);
  const totals = getTotals(items);
  const byCategory = Object.entries(items.filter(t => t.type === "expense").reduce((acc: Record<string, number>, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount; return acc;
  }, {})).sort((a,b) => b[1]-a[1]);
  const max = Math.max(1, ...byCategory.map(x => x[1]));
  const activeBudgets = budgets.filter(b => b.month === new Date().toISOString().slice(0,7));

  return <Screen>
    <Text style={styles.heading}>Insights</Text>
    <Text style={styles.sub}>A snapshot of your current month</Text>
    <View style={styles.cards}>
      <Panel style={styles.metric}><Text style={styles.caption}>INCOME</Text><Text style={[styles.metricValue,{color:colors.green}]}>{formatINR(totals.income)}</Text></Panel>
      <Panel style={styles.metric}><Text style={styles.caption}>SPENT</Text><Text style={styles.metricValue}>{formatINR(totals.expenses)}</Text></Panel>
    </View>
    <Panel>
      <Text style={styles.title}>Spending by category</Text>
      {byCategory.length ? byCategory.map(([category, amount]) => <View key={category} style={styles.barRow}>
        <View style={styles.barLabel}><Text style={styles.name}>{category}</Text><Text style={styles.value}>{formatINR(amount)}</Text></View>
        <View style={styles.track}><View style={[styles.fill,{width:`${amount/max*100}%`}]} /></View>
      </View>) : <Text style={styles.empty}>Add expenses to see your category breakdown.</Text>}
    </Panel>
    <Panel style={{ marginTop: 14 }}>
      <Text style={styles.title}>Budget overview</Text>
      {activeBudgets.length ? activeBudgets.map(b => {
        const spent = items.filter(t => t.type === "expense" && t.category === b.category).reduce((s,t)=>s+t.amount,0);
        const ratio = Math.min(1, spent / b.limit);
        return <View key={b.id} style={{ marginTop: 14 }}>
          <View style={styles.barLabel}><Text style={styles.name}>{b.category}</Text><Text style={styles.value}>{formatINR(spent)} / {formatINR(b.limit)}</Text></View>
          <View style={styles.track}><View style={[styles.fill,{width:`${ratio*100}%`,backgroundColor:ratio>=1?colors.red:colors.accent}]} /></View>
        </View>;
      }) : <Text style={styles.empty}>No budgets yet. Add one from the home screen.</Text>}
    </Panel>
  </Screen>;
}
const styles = StyleSheet.create({
  heading:{color:colors.text,fontSize:26,fontWeight:"800",marginTop:12},
  sub:{color:colors.muted,fontSize:13,marginTop:5,marginBottom:18},
  cards:{flexDirection:"row",gap:10,marginBottom:14},
  metric:{flex:1,padding:15},
  caption:{color:colors.muted,fontSize:10,fontWeight:"800",letterSpacing:1},
  metricValue:{color:colors.text,fontSize:19,fontWeight:"800",marginTop:8},
  title:{color:colors.text,fontSize:16,fontWeight:"800",marginBottom:15},
  barRow:{marginBottom:14},
  barLabel:{flexDirection:"row",justifyContent:"space-between",marginBottom:7},
  name:{color:colors.text,fontSize:12,fontWeight:"700"},
  value:{color:colors.muted,fontSize:11},
  track:{height:9,backgroundColor:colors.panel2,borderRadius:10,overflow:"hidden"},
  fill:{height:9,backgroundColor:colors.accent,borderRadius:10},
  empty:{color:colors.muted,fontSize:12,lineHeight:19},
});
