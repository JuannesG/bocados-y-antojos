import { StyleSheet } from "react-native";
import { colores } from "./tema";

export const styles = StyleSheet.create({
    container: { padding: 16 },
    tarjeta: {
        backgroundColor: colores.tarjeta,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colores.borde,
        padding: 16,
        marginBottom: 14,
    },
    titulo: { fontSize: 16, fontWeight: "bold", color: colores.texto },
    etiqueta: { fontSize: 13, color: colores.textoSuave, marginTop: 10 },
    valor: { fontSize: 16, color: colores.texto, marginTop: 2 },
    ok: { color: "#16A34A", marginTop: 12, textAlign: "center" },
});