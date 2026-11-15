import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Panel } from "@/components/Screen";
import { useFinance } from "@/context/FinanceContext";
import { colors } from "@/lib/theme";
import { askFinancialAssistant } from "@/services/ai";
import { ChatMessage } from "@/types";

export default function Assistant() {
  const { transactions } = useFinance();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi! I can help you understand your spending. Try asking: “Summarize my expenses this month.”",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Keep the newest message visible when messages change or the keyboard opens.
  const scrollToEnd = () => scrollRef.current?.scrollToEnd({ animated: true });
  useEffect(() => {
    const t = setTimeout(scrollToEnd, 50);
    return () => clearTimeout(t);
  }, [messages, busy]);

  const send = async () => {
    const q = question.trim();
    if (!q || busy) return;
    setQuestion("");
    setMessages((old) => [
      ...old,
      { id: Date.now().toString(), role: "user", text: q, createdAt: new Date().toISOString() },
    ]);
    setBusy(true);
    try {
      const answer = await askFinancialAssistant(q, transactions);
      setMessages((old) => [
        ...old,
        { id: (Date.now() + 1).toString(), role: "assistant", text: answer, createdAt: new Date().toISOString() },
      ]);
    } catch (e: any) {
      const msg = e?.message ?? "Something went wrong.";
      setMessages((old) => [
        ...old,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          text: `I couldn't reach the AI service: ${msg}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const disabled = busy || !question.trim();

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Messages scroll here; the input bar below stays pinned above the keyboard */}
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onContentSizeChange={scrollToEnd}
      >
        <Text style={styles.heading}>FinTrack AI</Text>
        <Text style={styles.sub}>Your personal spending explainer</Text>
        <Panel style={styles.notice}>
          <Ionicons name="shield-checkmark-outline" size={17} color={colors.accent} />
          <Text style={styles.noticeText}>
            Only a monthly summary is sent to the AI service, not your full transaction list.
          </Text>
        </Panel>

        {messages.map((m) => (
          <View key={m.id} style={[styles.bubble, m.role === "user" ? styles.user : styles.assistant]}>
            <Text style={styles.role}>{m.role === "user" ? "YOU" : "FINTRACK AI"}</Text>
            <Text style={styles.message}>{m.text}</Text>
          </View>
        ))}
        {busy && <ActivityIndicator color={colors.accent} style={{ margin: 12 }} />}
        <Text style={styles.disclaimer}>
          AI responses can be wrong. Verify calculations in the app. Not financial advice.
        </Text>
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          value={question}
          onChangeText={setQuestion}
          placeholder="Ask about your spending..."
          placeholderTextColor={colors.muted}
          style={styles.input}
          multiline
          onFocus={() => setTimeout(scrollToEnd, 300)}
        />
        <Pressable onPress={send} disabled={disabled} style={[styles.send, disabled && { opacity: 0.4 }]}>
          <Ionicons name="arrow-up" size={20} color="#06121B" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 12 },
  heading: { color: colors.text, fontSize: 26, fontWeight: "800", marginTop: 12 },
  sub: { color: colors.muted, marginTop: 5, marginBottom: 15 },
  notice: { flexDirection: "row", gap: 9, alignItems: "center", padding: 12, marginBottom: 16 },
  noticeText: { color: colors.muted, fontSize: 11, flex: 1, lineHeight: 16 },
  bubble: { padding: 15, borderRadius: 17, marginBottom: 12, maxWidth: "94%" },
  user: { backgroundColor: "#173E49", alignSelf: "flex-end" },
  assistant: { backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.border, alignSelf: "flex-start" },
  role: { color: colors.accent, fontSize: 9, fontWeight: "900", letterSpacing: 1, marginBottom: 6 },
  message: { color: colors.text, fontSize: 13, lineHeight: 20 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 9,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 110,
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 15,
    padding: 13,
    color: colors.text,
  },
  send: { width: 45, height: 48, borderRadius: 15, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  disclaimer: { color: "#68788D", fontSize: 10, textAlign: "center", marginTop: 14 },
});