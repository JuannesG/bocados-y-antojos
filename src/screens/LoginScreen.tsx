import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function entrar() {
        setError("");
        const { error: fallo } = await supabase.auth.signInWithPassword({ email, password });

        if (fallo) {
            setError("Correo o contraseña incorrectos");
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>Bocados y Antojos</Text>
            <TextInput
                style={styles.input}
                placeholder="Correo"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <TextInput
                style={styles.input}
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            <Pressable style={styles.boton} onPress={entrar}>
                <Text style={styles.botonTexto}>Entrar</Text>
            </Pressable>
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#FFF3E0",
    },
    titulo: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#4E2E1E",
        textAlign: "center",
    },
    input: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
        fontSize: 16,
    },
    boton: {
        backgroundColor: "#FF8A00",
        borderRadius: 12, 
        padding: 14, 
        marginTop: 24, 
        alignItems: "center",
    },
    botonTexto: {
        color: "#4E2E1E", 
        fontSize: 16, 
        fontWeight: "bold"
    },
    error: {
        color: "#E63946", 
        marginTop: 16,
        textAlign: "center"
    }
});
