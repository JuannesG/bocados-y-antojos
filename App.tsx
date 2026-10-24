import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from './src/lib/supabase';
import LoginScreen from './src/screens/LoginScreen';
import { type Session } from '@supabase/supabase-js';


export default function App() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: escucha } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion);
    });

    return () => escucha.subscription.unsubscribe();
  }, []);

  const [session, setSession] = useState<Session | null>(null);

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.saludo}>Hola, {session.user.email}</Text>
      <Pressable style={styles.boton} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.botonTexto}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: "center", 
    padding: 24, 
    backgroundColor: "#FFF3E0"
  },
  saludo: {
    fontSize: 20, 
    color: "#4E2E1E", 
    textAlign: "center"
  },
  boton: {
        backgroundColor: "#4E2E1E",
        borderRadius: 12, 
        padding: 14, 
        marginTop: 24, 
        alignItems: "center",
    },
    botonTexto: {
        color: "#FFF3E0", 
        fontSize: 16, 
        fontWeight: "bold"
    },
})