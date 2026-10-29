import { StyleSheet } from "react-native";
import { colores } from "./tema";

export const styles = StyleSheet.create({
    etiqueta: { fontSize: 14, color: colores.texto, marginTop: 20 },
    nota: { fontSize: 13, color: colores.textoSuave, marginTop: 14 },
    item: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colores.tarjeta,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colores.borde,
        padding: 12,
        marginTop: 8,
        gap: 10,
    },
    texto: { color: colores.texto, fontSize: 15 },
    detalle: { color: colores.textoSuave, fontSize: 12, marginTop: 2 },
    quitar: { color: colores.peligro, fontSize: 18, paddingHorizontal: 8 },
    resumen: {
        marginTop: 16,
        backgroundColor: colores.fondoTabla,
        borderRadius: 12,
        padding: 12,
    },
    subtotal: { color: colores.textoSuave, fontSize: 15 },
    descuento: { color: colores.acento, fontSize: 15, fontWeight: "bold", marginTop: 4 },
    total: { marginTop: 8, color: colores.texto, fontWeight: "bold", fontSize: 18 },
});