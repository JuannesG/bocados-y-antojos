import { View, Text, StyleSheet } from "react-native";

type Props = { titulo: string; valor: string; fondo: string; nota?: string };

export default function TarjetaDato({ titulo, valor, fondo, nota }: Props) {
    return (
        <View style={[styles.tarjeta, { backgroundColor: fondo }]}>
            <Text style={styles.titulo}>{titulo}</Text>
            <Text style={styles.valor}>{valor}</Text>
            {nota ? <Text style={styles.nota}>{nota}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    tarjeta: {
        flexBasis: "47%",
        flexGrow: 1,
        borderRadius: 14,
        padding: 14,
    },
    titulo: { fontSize: 13, color: "#4E2E1E" },
    valor: { fontSize: 20, fontWeight: "bold", color: "#4E2E1E", marginTop: 6 },
    nota: { fontSize: 12, color: "#7A5A45", marginTop: 4 },
});