import React, { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Screen, Panel } from "@/components/Screen";
import { colors } from "@/lib/theme";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function Profile() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [userEmail,setUserEmail]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    if(!supabase)return;
    supabase.auth.getUser().then(({data})=>setUserEmail(data.user?.email??null));
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>setUserEmail(session?.user?.email??null));
    return ()=>subscription.unsubscribe();
  },[]);

  const signIn=async()=>{
    if(!supabase)return;
    if(!email.trim()||password.length<6)return Alert.alert("Check details","Enter a valid email and password (at least 6 characters).");
    setBusy(true);
    const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
    setBusy(false);
    if(error)Alert.alert("Sign in failed",error.message);
  };
  const signUp=async()=>{
    if(!supabase)return;
    if(!email.trim()||password.length<6)return Alert.alert("Check details","Enter a valid email and password (at least 6 characters).");
    setBusy(true);
    const {error}=await supabase.auth.signUp({email:email.trim(),password});
    setBusy(false);
    if(error)Alert.alert("Registration failed",error.message);
    else Alert.alert("Check your email","If email confirmation is enabled, confirm your address before signing in.");
  };
  const signOut=async()=>{if(supabase){await supabase.auth.signOut();setUserEmail(null);}};

  return <Screen>
    <Text style={styles.heading}>Profile & settings</Text>
    <Panel>
      <Text style={styles.title}>Account</Text>
      {!isSupabaseConfigured ? <>
        <Text style={styles.copy}>Local-only mode is active. Your entries are saved on this device. Configure Supabase in .env to enable cloud authentication and AI.</Text>
      </> : userEmail ? <>
        <Text style={styles.copy}>Signed in as {userEmail}</Text>
        <Pressable onPress={signOut} style={styles.button}><Text style={styles.buttonText}>Sign out</Text></Pressable>
      </> : <>
        <Text style={styles.copy}>Create an account or sign in to enable cloud services.</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email address" placeholderTextColor={colors.muted} style={styles.input}/>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password (6+ characters)" placeholderTextColor={colors.muted} style={styles.input}/>
        <View style={{flexDirection:"row",gap:9}}>
          <Pressable disabled={busy} onPress={signIn} style={[styles.button,{flex:1}]}><Text style={styles.buttonText}>Sign in</Text></Pressable>
          <Pressable disabled={busy} onPress={signUp} style={[styles.secondary,{flex:1}]}><Text style={styles.secondaryText}>Create account</Text></Pressable>
        </View>
      </>}
    </Panel>
    <Panel style={{marginTop:14}}>
      <Text style={styles.title}>About FinTrack AI</Text>
      <Text style={styles.copy}>Version 1.0.0 · Personal finance tracking MVP</Text>
      <Text style={styles.copy}>Currency: INR (₹)</Text>
      <Text style={styles.copy}>Your local data stays on this device unless you explicitly configure cloud features.</Text>
    </Panel>
    <Text style={styles.disclaimer}>FinTrack AI is an educational personal finance tool. It is not a bank, investment adviser or tax professional.</Text>
  </Screen>;
}
const styles=StyleSheet.create({
  heading:{color:colors.text,fontSize:26,fontWeight:"800",marginTop:12,marginBottom:18},
  title:{color:colors.text,fontWeight:"800",fontSize:16,marginBottom:10},
  copy:{color:colors.muted,fontSize:12,lineHeight:19,marginBottom:12},
  input:{backgroundColor:colors.panel2,borderColor:colors.border,borderWidth:1,borderRadius:12,padding:13,color:colors.text,marginBottom:10},
  button:{backgroundColor:colors.accent,padding:13,borderRadius:12,alignItems:"center",marginTop:8},
  buttonText:{color:"#06121B",fontWeight:"900",fontSize:12},
  secondary:{backgroundColor:colors.panel2,borderWidth:1,borderColor:colors.border,padding:13,borderRadius:12,alignItems:"center",marginTop:8},
  secondaryText:{color:colors.text,fontWeight:"800",fontSize:12},
  disclaimer:{color:"#68788D",fontSize:10,lineHeight:16,marginTop:18,textAlign:"center"},
});
