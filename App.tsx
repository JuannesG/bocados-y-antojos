import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { supabase } from "./src/lib/supabase";
import LoginScreen from "./src/screens/LoginScreen";
import Layout from "./src/layout/Layout";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: escucha } = supabase.auth.onAuthStateChange(
      (_evento, nuevaSesion) => {
        setSession(nuevaSesion);
      }
    );

    return () => escucha.subscription.unsubscribe();
  }, []);

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <SafeAreaProvider>
      <Layout email={session.user.email ?? ""} />
    </SafeAreaProvider>
  );
}