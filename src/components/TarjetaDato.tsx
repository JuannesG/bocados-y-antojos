import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type Porcentaje = `${number}%`;

type Props = {
    titulo: string;
    valor: string;
    icono: keyof typeof Ionicons.glyphMap;
    base: Porcentaje;
    nota?: string;
};

export default function TarjetaDato({ titulo, valor, icono, base, nota }: Props) {
    return (
        <View style={[styles.tarjeta, { flexBasis: base }]}>
            <View style={styles.icono}>
                <Ionicons name={icono} size={22} color="#EA580C" />
            </View>
            <Text style={styles.titulo}>{titulo}</Text>
            <Text style={styles.valor}>{valor}</Text>
            {nota ? <Text style={styles.nota}>{nota}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    tarjeta: {
        flexGrow: 1,
        backgroundColor: "white",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: "#E7E5E4",
    },
    icono: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "#FFEDD5",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    titulo: { fontSize: 13, color: "#78716C" },
    valor: { fontSize: 20, fontWeight: "bold", color: "#1C1917", marginTop: 4 },
    nota: { fontSize: 12, color: "#78716C", marginTop: 4 },
});