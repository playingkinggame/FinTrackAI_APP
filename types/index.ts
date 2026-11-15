export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  note?: string;
  date: string; // ISO date
  createdAt: string;
};

export type Budget = {
  id: string;
  category: string;
  limit: number;
  month: string; // YYYY-MM
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
};
