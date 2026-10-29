import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    Image,
    ScrollView,
    ActivityIndicator,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { colores } from "../styles/tema";
import { styles } from "../styles/Login.styles";

const logo = require("../../assets/logo.png");

export default function LoginScreen() {
    const { width } = useWindowDimensions();
    const esAncha = width >= 900;

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [verClave, setVerClave] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    async function entrar() {
        if (!email.trim() || !password) {
            setError("Escribe tu correo y tu contraseña");
            return;
        }
        setError("");
        setCargando(true);

        const { error: fallo } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        setCargando(false);
        if (fallo) {
            setError("Correo o contraseña incorrectos");
        }
    }

    const formulario = (
        <View style={styles.tarjeta}>
            {!esAncha ? (
                <Image source={logo} style={styles.logoMovil} resizeMode="contain" />
            ) : null}

            <Text style={styles.titulo}>Bienvenido</Text>
            <Text style={styles.subtitulo}>Inicia sesión para administrar tu negocio</Text>

            <Text style={styles.etiqueta}>Correo</Text>
            <View style={styles.campo}>
                <Ionicons name="mail-outline" size={20} color={colores.textoSuave} />
                <TextInput placeholderTextColor="#A8A29E"
                    style={styles.entrada}
                    placeholder="tucorreo@ejemplo.com"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                />
            </View>

            <Text style={styles.etiqueta}>Contraseña</Text>
            <View style={styles.campo}>
                <Ionicons name="lock-closed-outline" size={20} color={colores.textoSuave} />
                <TextInput placeholderTextColor="#A8A29E"
                    style={styles.entrada}
                    placeholder="Tu contraseña"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!verClave}
                    autoComplete="current-password"
                    returnKeyType="go"
                    onSubmitEditing={entrar}
                />
                <Pressable onPress={() => setVerClave(!verClave)}>
                    <Ionicons
                        name={verClave ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={colores.textoSuave}
                    />
                </Pressable>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
                style={[styles.boton, cargando && styles.botonInactivo]}
                onPress={entrar}
                disabled={cargando}
            >
                {cargando ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.botonTexto}>Entrar</Text>
                )}
            </Pressable>
        </View>
    );

    if (esAncha) {
        return (
            <SafeAreaView style={styles.raiz}>
                <View style={styles.fila}>
                    <View style={styles.lateral}>
                        <View style={styles.logoCaja}>
                            <Image source={logo} style={styles.logoGrande} resizeMode="contain" />
                        </View>
                        <Text style={styles.frase}>
                            Compras, inventario, pedidos y ventas en un solo lugar.
                        </Text>
                        <Text style={styles.fraseSuave}>Pequeños bocados, grandes antojos.</Text>
                    </View>
                    <View style={styles.derecha}>{formulario}</View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.raiz}>
            <ScrollView
                contentContainerStyle={styles.movil}
                keyboardShouldPersistTaps="handled"
            >
                {formulario}
            </ScrollView>
        </SafeAreaView>
    );
}