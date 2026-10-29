import { View, TextInput, Pressable, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
    busqueda: string;
    onBusqueda: (texto: string) => void;
    placeholder: string;
    textoBoton: string;
    onBoton: () => void;
};

export default function BarraAcciones({
    busqueda,
    onBusqueda,
    placeholder,
    textoBoton,
    onBoton,
}: Props) {
    return (
        <View style={styles.fila}>
            <View style={styles.buscador}>
                <Ionicons name="search-outline" size={18} color="#78716C" />
                <TextInput placeholderTextColor="#A8A29E"
                    style={styles.input}
                    placeholder={placeholder}
                    value={busqueda}
                    onChangeText={onBusqueda}
                />
            </View>
            <Pressable style={styles.boton} onPress={onBoton}>
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.botonTexto}>{textoBoton}</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    fila: { flexDirection: "row", gap: 10, alignItems: "center" },
    buscador: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "white",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E7E5E4",
        paddingHorizontal: 12,
    },
    input: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#1C1917" },
    boton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#EA580C",
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    botonTexto: { color: "#FFFFFF", fontWeight: "bold", fontSize: 15 },
});