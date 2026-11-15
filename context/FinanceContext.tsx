import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";
import { Budget, Transaction } from "@/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type TransactionInput = Omit<Transaction, "id" | "createdAt">;

type FinanceContextValue = {
  transactions: Transaction[];
  budgets: Budget[];
  loading: boolean;
  /** true when the data is stored in the signed-in user's cloud account */
  isCloud: boolean;
  /** id of the signed-in user, or null when signed out */
  userId: string | null;
  /** false until the app has finished checking for a saved login */
  authReady: boolean;
  addTransaction: (data: TransactionInput) => void;
  updateTransaction: (id: string, data: TransactionInput) => void;
  deleteTransaction: (id: string) => void;
  addBudget: (data: Omit<Budget, "id">) => void;
  deleteBudget: (id: string) => void;
  refreshCloud: () => Promise<void>;
};

// Data saved while signed out (this is also where older app versions saved everything).
const GUEST_KEY = "@fintrack-ai/v1";
// Local cache for each signed-in account, so the app opens instantly.
const userKey = (userId: string) => `@fintrack-ai/v2/${userId}`;

const makeId = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });

const FinanceContext = createContext<FinanceContextValue | null>(null);

// Demo records saved by early versions of the app. They are dropped on load.
const isSeedTransaction = (t: Transaction) => String(t.id).startsWith("demo-");
const isSeedBudget = (b: Budget) => b.id === "budget-1" || b.id === "budget-2";

type Snapshot = { transactions: Transaction[]; budgets: Budget[] };

async function readLocal(key: string): Promise<Snapshot> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return { transactions: [], budgets: [] };
    const parsed = JSON.parse(raw);
    return {
      transactions: (parsed.transactions ?? []).filter((t: Transaction) => !isSeedTransaction(t)),
      budgets: (parsed.budgets ?? []).filter((b: Budget) => !isSeedBudget(b)),
    };
  } catch (error) {
    console.warn("Could not load local finance data", error);
    return { transactions: [], budgets: [] };
  }
}

// ---- Database <-> app mapping --------------------------------------------

const txFromRow = (row: any): Transaction => ({
  id: row.id,
  title: row.title,
  amount: Number(row.amount),
  type: row.type,
  category: row.category,
  note: row.notes ?? "",
  date: row.transaction_date,
  createdAt: row.created_at,
});

const txToRow = (t: TransactionInput & { id?: string; createdAt?: string }, userId?: string) => ({
  ...(t.id ? { id: t.id } : {}),
  ...(userId ? { user_id: userId } : {}),
  title: t.title.slice(0, 120),
  amount: t.amount,
  type: t.type,
  category: t.category,
  notes: t.note ? t.note : null,
  transaction_date: t.date,
  ...(t.createdAt ? { created_at: t.createdAt } : {}),
});

const budgetFromRow = (row: any): Budget => ({
  id: row.id,
  category: row.category,
  limit: Number(row.amount),
  month: String(row.month).slice(0, 7), // "2026-11-01" -> "2026-11"
});

async function fetchCloud(): Promise<Snapshot> {
  if (!supabase) return { transactions: [], budgets: [] };
  // Note: Supabase returns up to 1000 rows per request by default.
  const [t, b] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("budgets").select("*"),
  ]);
  if (t.error) throw t.error;
  if (b.error) throw b.error;
  return {
    transactions: (t.data ?? []).map(txFromRow),
    budgets: (b.data ?? []).map(budgetFromRow),
  };
}

/**
 * One-time move of data that was saved on the phone before accounts existed.
 * Runs only when the account is still empty in the cloud, then clears the local copy.
 */
async function migrateGuestData(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const guest = await readLocal(GUEST_KEY);
  if (!guest.transactions.length && !guest.budgets.length) return false;
  try {
    if (guest.transactions.length) {
      const { error } = await supabase
        .from("transactions")
        .insert(guest.transactions.map((t) => txToRow(t, userId)));
      if (error) throw error;
    }
    if (guest.budgets.length) {
      const { error } = await supabase.from("budgets").upsert(
        guest.budgets.map((b) => ({
          user_id: userId,
          category: b.category,
          amount: b.limit,
          month: `${b.month}-01`,
        })),
        { onConflict: "user_id,category,month" },
      );
      if (error) throw error;
    }
    await AsyncStorage.setItem(GUEST_KEY, JSON.stringify({ transactions: [], budgets: [] }));
    return true;
  } catch (error) {
    console.warn("Could not move local data to your account", error);
    return false; // keep the local copy so nothing is lost
  }
}

// ---------------------------------------------------------------------------

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  // Which storage key the data currently in memory belongs to.
  const [dataOwner, setDataOwner] = useState<string | null>(null);

  // Refs so the action functions always see the latest data when rolling back.
  const txRef = useRef(transactions);
  const budgetRef = useRef(budgets);
  txRef.current = transactions;
  budgetRef.current = budgets;

  const cloud = Boolean(userId && supabase && isSupabaseConfigured);

  const syncFailed = (what: string, error: any) => {
    console.warn(`Could not ${what}`, error);
    Alert.alert("Couldn't save to your account", `Could not ${what}. Check your internet connection and try again.`);
  };

  // 1. Who is signed in?
  useEffect(() => {
    if (!supabase) {
      setUserId(null);
      setAuthReady(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setAuthReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // 2. Load data whenever the signed-in user changes (sign in / sign out / switch account).
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      const key = userId ? userKey(userId) : GUEST_KEY;

      // Show the local copy right away.
      const cached = await readLocal(key);
      if (cancelled) return;
      setTransactions(cached.transactions);
      setBudgets(cached.budgets);
      setDataOwner(key);

      // Then bring it up to date from the account.
      if (userId) {
        try {
          let fresh = await fetchCloud();
          if (!fresh.transactions.length && !fresh.budgets.length) {
            if (await migrateGuestData(userId)) fresh = await fetchCloud();
          }
          if (cancelled) return;
          setTransactions(fresh.transactions);
          setBudgets(fresh.budgets);
        } catch (error) {
          console.warn("Could not load data from your account", error);
        }
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, userId]);

  // 3. Keep the local copy up to date (always written to the key the data belongs to).
  useEffect(() => {
    if (!dataOwner || loading) return;
    AsyncStorage.setItem(dataOwner, JSON.stringify({ transactions, budgets })).catch((error) =>
      console.warn("Could not save finance data", error),
    );
  }, [transactions, budgets, dataOwner, loading]);

  // ---- Transactions --------------------------------------------------------

  const addTransaction: FinanceContextValue["addTransaction"] = async (data) => {
    const item: Transaction = { ...data, id: makeId(), createdAt: new Date().toISOString() };
    setTransactions((old) => [item, ...old]);
    if (!cloud || !supabase || !userId) return;
    const { error } = await supabase.from("transactions").insert(txToRow(item, userId));
    if (error) {
      setTransactions((old) => old.filter((t) => t.id !== item.id));
      syncFailed("add the transaction", error);
    }
  };

  const updateTransaction: FinanceContextValue["updateTransaction"] = async (id, data) => {
    const previous = txRef.current.find((t) => t.id === id);
    setTransactions((old) => old.map((item) => (item.id === id ? { ...item, ...data } : item)));
    if (!cloud || !supabase) return;
    const { error } = await supabase.from("transactions").update(txToRow(data)).eq("id", id);
    if (error) {
      if (previous) setTransactions((old) => old.map((item) => (item.id === id ? previous : item)));
      syncFailed("update the transaction", error);
    }
  };

  const deleteTransaction: FinanceContextValue["deleteTransaction"] = async (id) => {
    const previous = txRef.current.find((t) => t.id === id);
    setTransactions((old) => old.filter((item) => item.id !== id));
    if (!cloud || !supabase) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      if (previous) setTransactions((old) => [previous, ...old]);
      syncFailed("delete the transaction", error);
    }
  };

  // ---- Budgets -------------------------------------------------------------

  const addBudget: FinanceContextValue["addBudget"] = async (data) => {
    const before = budgetRef.current;
    const tempId = makeId();
    setBudgets((old) => [
      ...old.filter((b) => !(b.category === data.category && b.month === data.month)),
      { ...data, id: tempId },
    ]);
    if (!cloud || !supabase || !userId) return;
    const { data: row, error } = await supabase
      .from("budgets")
      .upsert(
        { user_id: userId, category: data.category, amount: data.limit, month: `${data.month}-01` },
        { onConflict: "user_id,category,month" },
      )
      .select()
      .single();
    if (error || !row) {
      setBudgets(before);
      syncFailed("save the budget", error);
      return;
    }
    // Use the id the database assigned so deleting later works.
    setBudgets((old) => old.map((b) => (b.id === tempId ? budgetFromRow(row) : b)));
  };

  const deleteBudget: FinanceContextValue["deleteBudget"] = async (id) => {
    const previous = budgetRef.current.find((b) => b.id === id);
    setBudgets((old) => old.filter((b) => b.id !== id));
    if (!cloud || !supabase) return;
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) {
      if (previous) setBudgets((old) => [...old, previous]);
      syncFailed("remove the budget", error);
    }
  };

  // ---- Manual refresh ------------------------------------------------------

  const refreshCloud = async () => {
    if (!cloud) return;
    const fresh = await fetchCloud();
    setTransactions(fresh.transactions);
    setBudgets(fresh.budgets);
  };

  const value = useMemo(
    () => ({
      transactions,
      budgets,
      loading,
      isCloud: cloud,
      userId,
      authReady,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addBudget,
      deleteBudget,
      refreshCloud,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [transactions, budgets, loading, cloud, userId, authReady],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const value = useContext(FinanceContext);
  if (!value) throw new Error("useFinance must be used inside FinanceProvider");
  return value;
}