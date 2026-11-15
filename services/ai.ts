import { supabase } from "@/lib/supabase";
import { Transaction } from "@/types";
import { currentMonthTransactions, getTotals } from "@/utils/finance";
import { FunctionsHttpError } from "@supabase/supabase-js";

export async function askFinancialAssistant(question: string, transactions: Transaction[]) {
  if (!supabase) {
    throw new Error("AI assistant needs Supabase configuration. Set your project URL and anon key, then deploy the Edge Function.");
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Sign in to use the cloud AI assistant.");

  const monthItems = currentMonthTransactions(transactions);
  const totals = getTotals(monthItems);
  const categoryTotals = monthItems.filter(t=>t.type==="expense").reduce((acc:Record<string,number>,t)=>{
    acc[t.category]=(acc[t.category]??0)+t.amount; return acc;
  },{});
  const { data, error } = await supabase.functions.invoke("financial-assistant", {
    body: {
      question,
      summary: {
        currency: "INR",
        month: new Date().toISOString().slice(0,7),
        income: totals.income,
        expenses: totals.expenses,
        balance: totals.balance,
        categoryExpenses: categoryTotals,
      },
    },
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      let detail = "";
      try { detail = JSON.stringify(await error.context.json()); } catch {}
      throw new Error(`Function returned ${error.context.status}: ${detail}`);
    }
    throw error;
  }
  if (!data?.answer) throw new Error("The AI service returned an empty response.");
  return String(data.answer);
}
