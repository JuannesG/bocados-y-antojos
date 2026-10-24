import { View, Text, Pressable, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";

export default function InicioScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.titulo}>Inicio</Text>
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
        alignItems: "center",
        backgroundColor: "#FFF3E0",
    },
    titulo: {
        fontSize: 22,
        color: "#4E2E1E",
        fontWeight: "bold",
    },
    boton: {
        backgroundColor: "#4E2E1E",
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        marginTop: 24,
    },
    botonTexto: {
        color: "#FFF3E0",
        fontSize: 16,
        fontWeight: "bold",
    },
});