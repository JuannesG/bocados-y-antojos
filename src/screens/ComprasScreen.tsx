import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import RegistroCompras from "../components/RegistroCompras";
import MaterialesScreen from "./MaterialesScreen";

export default function ComprasScreen() {
    const [vista, setVista] = useState<"compras" | "materiales">("compras");

    return (
        <View style={styles.container}>
            <View style={styles.selector}>
                <Pressable
                    style={[styles.opcion, vista === "compras" && styles.opcionActiva]}
                    onPress={() => setVista("compras")}
                >
                    <Text style={styles.opcionTexto}>Compras</Text>
                </Pressable>
                <Pressable
                    style={[styles.opcion, vista === "materiales" && styles.opcionActiva]}
                    onPress={() => setVista("materiales")}
                >
                    <Text style={styles.opcionTexto}>Materiales</Text>
                </Pressable>
            </View>

            {vista === "compras" ? <RegistroCompras /> : <MaterialesScreen />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFF3E0" },
    selector: {
        flexDirection: "row",
        margin: 16,
        marginBottom: 0,
        backgroundColor: "white",
        borderRadius: 12,
        padding: 4,
    },
    opcion: { flex: 1, padding: 10, borderRadius: 10, alignItems: "center" },
    opcionActiva: { backgroundColor: "#FF8A00" },
    opcionTexto: { color: "#4E2E1E", fontWeight: "bold" },
});