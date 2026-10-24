import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import RegistroCompras from "../components/RegistroCompras";
import ReportesScreen from "./ReportesScreen";

type Vista = "menu" | "compras" | "reportes";

export default function MasScreen() {
    const [vista, setVista] = useState<Vista>("menu");

    if (vista !== "menu") {
        return (
            <View style={styles.pantalla}>
                <Pressable style={styles.volver} onPress={() => setVista("menu")}>
                    <Text style={styles.volverTexto}>← Volver al menú</Text>
                </Pressable>
                {vista === "compras" ? <RegistroCompras /> : <ReportesScreen />}
            </View>
        );
    }

    return (
        <View style={styles.pantalla}>
            <View style={styles.menu}>
                <Pressable style={styles.item} onPress={() => setVista("compras")}>
                    <Ionicons name="cart-outline" size={24} color="#4E2E1E" />
                    <Text style={styles.itemTexto}>Compras</Text>
                    <Ionicons name="chevron-forward" size={20} color="#4E2E1E" />
                </Pressable>

                <Pressable style={styles.item} onPress={() => setVista("reportes")}>
                    <Ionicons name="bar-chart-outline" size={24} color="#4E2E1E" />
                    <Text style={styles.itemTexto}>Reportes</Text>
                    <Ionicons name="chevron-forward" size={20} color="#4E2E1E" />
                </Pressable>

                <Pressable style={styles.item} onPress={() => supabase.auth.signOut()}>
                    <Ionicons name="log-out-outline" size={24} color="#E63946" />
                    <Text style={[styles.itemTexto, { color: "#E63946" }]}>Cerrar sesión</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    pantalla: { flex: 1, backgroundColor: "#FFF3E0" },
    menu: { padding: 16 },
    item: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 14,
        padding: 16,
        marginBottom: 10,
        gap: 12,
    },
    itemTexto: { flex: 1, fontSize: 17, color: "#4E2E1E", fontWeight: "bold" },
    volver: { padding: 16, paddingBottom: 0 },
    volverTexto: { color: "#4E2E1E", fontWeight: "bold", fontSize: 15 },
});