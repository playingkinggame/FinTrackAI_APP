import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { FinanceProvider, useFinance } from "@/context/FinanceContext";
import { isSupabaseConfigured } from "@/lib/supabase";
import { colors } from "@/lib/theme";

// Defined once (not inside the component) so the navigator doesn't see new options on every render.
const screenOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  contentStyle: { backgroundColor: colors.bg },
  headerShadowVisible: false,
};

function RootNavigator() {
  const { userId, authReady } = useFinance();

  // Wait until we know whether a saved login exists, so the navigator
  // starts with the right screens and never has to switch at startup.
  if (!authReady) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  // Signed-in users get the app. Everyone else only sees the login screen.
  // (If Supabase isn't configured at all, the app runs in local-only mode.)
  const allowed = !isSupabaseConfigured || Boolean(userId);

  return (
    <Stack screenOptions={screenOptions}>
      {/* Only reachable when signed in */}
      <Stack.Protected guard={allowed}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="add-transaction" options={{ title: "New transaction", presentation: "modal" }} />
        <Stack.Screen name="budgets" options={{ title: "Monthly budgets" }} />
      </Stack.Protected>

      {/* Only reachable when signed out */}
      <Stack.Protected guard={!allowed}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <FinanceProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </FinanceProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
});