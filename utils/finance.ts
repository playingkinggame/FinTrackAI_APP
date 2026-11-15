import { Transaction } from "@/types";

export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getTotals(items: Transaction[]) {
  return items.reduce(
    (acc, item) => {
      if (item.type === "income") acc.income += item.amount;
      else acc.expenses += item.amount;
      acc.balance = acc.income - acc.expenses;
      return acc;
    },
    { income: 0, expenses: 0, balance: 0 }
  );
}

export function currentMonthTransactions(items: Transaction[]) {
  const key = monthKey();
  return items.filter((item) => item.date.slice(0, 7) === key);
}
