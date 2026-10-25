import { View, Text, StyleSheet } from "react-native";

type Tono = "neutro" | "verde" | "amarillo" | "rojo" | "gris";

const tonos: Record<Tono, { fondo: string; texto: string }> = {
    neutro: { fondo: "#FAFAF9", texto: "#1C1917" },
    verde: { fondo: "#E3F4DE", texto: "#27500A" },
    amarillo: { fondo: "#FFF1C2", texto: "#5C4400" },
    rojo: { fondo: "#FCE0E3", texto: "#8A1F2B" },
    gris: { fondo: "#E5E5E5", texto: "#2E2E2E" },
};

type Props = { texto: string; tono: Tono };

export default function Badge({ texto, tono }: Props) {
    const color = tonos[tono];
    return (
        <View style={[styles.caja, { backgroundColor: color.fondo }]}>
            <Text style={[styles.texto, { color: color.texto }]}>{texto}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    caja: {
        borderRadius: 20,
        paddingVertical: 3,
        paddingHorizontal: 10,
        marginRight: 6,
    },
    texto: { fontSize: 12, fontWeight: "bold" },
});