import { StyleSheet } from "react-native";
import { colores } from "./tema";

export const styles = StyleSheet.create({
    container: { padding: 16 },
    bloque: { borderTopWidth: 1, borderTopColor: colores.fondoTabla },
    fila: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    fecha: { fontSize: 13, color: colores.textoSuave },
    proveedor: { fontSize: 15, fontWeight: "bold", color: colores.texto },
    detalle: { fontSize: 13, color: colores.textoSuave, marginTop: 2 },
    total: {
        fontSize: 15,
        fontWeight: "bold",
        color: colores.texto,
        textAlign: "right",
    },
    detalleAbierto: {
        paddingHorizontal: 14,
        paddingBottom: 14,
        backgroundColor: colores.fondo,
    },
    filaDetalle: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
    },
    detalleTexto: { fontSize: 14, color: colores.texto },
    aviso: { fontSize: 13, color: colores.textoSuave, marginTop: 12 },
    botones: { flexDirection: "row", gap: 10, marginTop: 10 },
});