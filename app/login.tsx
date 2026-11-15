import React, { useRef, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { colors } from "@/lib/theme";

type Mode = "signin" | "signup";

export default function Login() {
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Correct React Native TextInput instance refs
  const passwordRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const confirmRef = useRef<React.ElementRef<typeof TextInput>>(null);

  const isSignup = mode === "signup";

  const switchMode = () => {
    setMode(isSignup ? "signin" : "signup");
    setError(null);
    setInfo(null);
    setConfirm("");
  };

  const submit = async () => {
    if (!supabase || busy) return;

    setError(null);
    setInfo(null);

    const mail = email.trim();

    // Email validation
    if (!/^\S+@\S+\.\S+$/.test(mail)) {
      return setError("Enter a valid email address.");
    }

    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }

    if (isSignup && password !== confirm) {
      return setError("Passwords do not match.");
    }

    setBusy(true);

    try {
      if (!isSignup) {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email: mail,
          password,
        });

        if (error) {
          setError(error.message);
        }

        // App detects successful authentication automatically.
      } else {
        // Create account
        const { data, error } = await supabase.auth.signUp({
          email: mail,
          password,
        });

        if (error) {
          setError(error.message);
        } else if (!data.session) {
          // Email confirmation enabled in Supabase
          setInfo(
            "Account created. Check your email to confirm your address, then sign in."
          );

          setMode("signin");
          setPassword("");
          setConfirm("");
        }
      }
    } catch (e: any) {
      setError(
        e?.message ??
          "Something went wrong. Check your internet connection."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logo}>
          <Ionicons
            name="sparkles"
            size={28}
            color={colors.accent}
          />
        </View>

        {/* Branding */}
        <Text style={styles.brand}>
          FinTrack <Text style={{ color: colors.accent }}>AI</Text>
        </Text>

        <Text style={styles.tagline}>
          {isSignup
            ? "Create your account to start tracking"
            : "Sign in to see your money, clearer"}
        </Text>

        {/* Authentication Card */}
        <View style={styles.card}>
          {/* Email */}
          <Text style={styles.label}>EMAIL</Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            placeholder="you@example.com"
            placeholderTextColor={colors.muted}
            style={styles.input}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          {/* Password */}
          <Text style={styles.label}>PASSWORD</Text>

          <View style={styles.passwordRow}>
            <TextInput
              ref={passwordRef}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              textContentType={isSignup ? "newPassword" : "password"}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.muted}
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              returnKeyType={isSignup ? "next" : "go"}
              onSubmitEditing={() =>
                isSignup ? confirmRef.current?.focus() : submit()
              }
            />

            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              style={styles.eye}
              hitSlop={8}
            >
              <Ionicons
                name={
                  showPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={20}
                color={colors.muted}
              />
            </Pressable>
          </View>

          {/* Confirm Password */}
          {isSignup && (
            <>
              <Text style={[styles.label, { marginTop: 14 }]}>
                CONFIRM PASSWORD
              </Text>

              <TextInput
                ref={confirmRef}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholder="Re-enter password"
                placeholderTextColor={colors.muted}
                style={[styles.input, { marginBottom: 0 }]}
                returnKeyType="go"
                onSubmitEditing={submit}
              />
            </>
          )}

          {/* Error Message */}
          {error && (
            <Text style={styles.error}>
              {error}
            </Text>
          )}

          {/* Information Message */}
          {info && (
            <Text style={styles.info}>
              {info}
            </Text>
          )}

          {/* Submit Button */}
          <Pressable
            onPress={submit}
            disabled={busy}
            style={[
              styles.button,
              busy && { opacity: 0.6 },
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#06121B" />
            ) : (
              <Text style={styles.buttonText}>
                {isSignup ? "Create account" : "Sign in"}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Switch Sign In / Sign Up */}
        <Pressable
          onPress={switchMode}
          style={styles.switch}
          disabled={busy}
        >
          <Text style={styles.switchText}>
            {isSignup
              ? "Already have an account? "
              : "New here? "}

            <Text
              style={{
                color: colors.accent,
                fontWeight: "800",
              }}
            >
              {isSignup ? "Sign in" : "Create an account"}
            </Text>
          </Text>
        </Pressable>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          FinTrack AI is an educational personal finance tool.
          It is not a bank, investment adviser or tax professional.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Styles
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  logo: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: "#173E49",
    borderWidth: 1,
    borderColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },

  brand: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 16,
  },

  tagline: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 26,
  },

  card: {
    backgroundColor: colors.panel,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },

  label: {
    color: colors.muted,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "800",
    marginBottom: 8,
  },

  input: {
    backgroundColor: colors.panel2,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    color: colors.text,
    fontSize: 14,
    marginBottom: 14,
  },

  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  eye: {
    padding: 6,
  },

  error: {
    color: colors.red,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
  },

  info: {
    color: colors.green,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
  },

  button: {
    backgroundColor: colors.accent,
    borderRadius: 13,
    padding: 15,
    alignItems: "center",
    marginTop: 18,
    minHeight: 50,
    justifyContent: "center",
  },

  buttonText: {
    color: "#06121B",
    fontWeight: "900",
    fontSize: 14,
  },

  switch: {
    alignItems: "center",
    marginTop: 20,
    padding: 6,
  },

  switchText: {
    color: colors.muted,
    fontSize: 13,
  },

  disclaimer: {
    color: "#68788D",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 28,
  },
});
