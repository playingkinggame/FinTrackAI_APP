import React, { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen, Panel } from "@/components/Screen";
import { useFinance } from "@/context/FinanceContext";
import { colors } from "@/lib/theme";
import { formatINR, monthKey, currentMonthTransactions } from "@/utils/finance";

const categories = ["Food","Travel","Shopping","Bills","Health","Entertainment","Other"];

export default function Budgets() {
  const { budgets, addBudget, deleteBudget, transactions } = useFinance();
  const [category,setCategory] = useState("Food");
  const [limit,setLimit] = useState("");
  const active = budgets.filter(b => b.month === monthKey());
  const expenses = currentMonthTransactions(transactions).filter(t => t.type === "expense");

  const save = () => {
    const n = Number(limit);
    if (!Number.isFinite(n) || n <= 0) return Alert.alert("Invalid limit","Enter a budget greater than zero.");
    addBudget({ category, limit: n, month: monthKey() });
    setLimit("");
    Alert.alert("Budget saved", `${category} budget updated.`);
  };

  return <Screen>
    <Text style={styles.heading}>Monthly budgets</Text>
    <Panel>
      <Text style={styles.title}>Create or update a budget</Text>
      <View style={styles.chips}>{categories.map(c=><Pressable key={c} onPress={()=>setCategory(c)} style={[styles.chip,category===c&&styles.chipActive]}><Text style={{color:category===c?colors.accent:colors.muted,fontSize:12}}>{c}</Text></Pressable>)}</View>
      <TextInput value={limit} onChangeText={setLimit} keyboardType="decimal-pad" placeholder="Monthly limit in INR" placeholderTextColor={colors.muted} style={styles.input}/>
      <Pressable onPress={save} style={styles.button}><Text style={styles.buttonText}>Save budget</Text></Pressable>
    </Panel>
    <Text style={styles.section}>Your budgets</Text>
    {active.map(b=>{
      const spent=expenses.filter(t=>t.category===b.category).reduce((s,t)=>s+t.amount,0);
      const pct=Math.min(1,spent/b.limit);
      return <Panel key={b.id} style={{marginBottom:10}}>
        <View style={styles.budgetHead}><Text style={styles.title}>{b.category}</Text><Pressable onPress={()=>deleteBudget(b.id)}><Text style={{color:colors.red}}>Remove</Text></Pressable></View>
        <Text style={styles.spent}>{formatINR(spent)} <Text style={styles.muted}>of {formatINR(b.limit)}</Text></Text>
        <View style={styles.track}><View style={[styles.fill,{width:`${pct*100}%`,backgroundColor:pct>=1?colors.red:colors.accent}]}/></View>
      </Panel>;
    })}
    {!active.length&&<Text style={styles.muted}>No budgets created for this month.</Text>}
  </Screen>;
}
const styles=StyleSheet.create({
  heading:{color:colors.text,fontSize:26,fontWeight:"800",marginTop:12,marginBottom:18},
  title:{color:colors.text,fontSize:15,fontWeight:"800"},
  chips:{flexDirection:"row",flexWrap:"wrap",gap:7,marginVertical:12},
  chip:{paddingHorizontal:11,paddingVertical:8,backgroundColor:colors.panel2,borderRadius:20,borderWidth:1,borderColor:colors.border},
  chipActive:{borderColor:colors.accent,backgroundColor:"#173E49"},
  input:{backgroundColor:colors.panel2,color:colors.text,borderColor:colors.border,borderWidth:1,borderRadius:12,padding:13,marginTop:7},
  button:{backgroundColor:colors.accent,borderRadius:12,padding:14,alignItems:"center",marginTop:12},
  buttonText:{color:"#06121B",fontWeight:"900"},
  section:{color:colors.text,fontWeight:"800",fontSize:18,marginTop:23,marginBottom:12},
  budgetHead:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
  spent:{color:colors.text,fontSize:17,fontWeight:"800",marginVertical:12},
  muted:{color:colors.muted,fontSize:12},
  track:{height:9,backgroundColor:colors.panel2,borderRadius:9,overflow:"hidden"},
  fill:{height:9,borderRadius:9},
});
