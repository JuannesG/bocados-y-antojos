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
    nombre: { fontSize: 15, fontWeight: "bold", color: colores.texto },
    precio: {
        fontSize: 15,
        fontWeight: "bold",
        color: colores.texto,
        textAlign: "right",
    },
    costo: { fontSize: 14, color: colores.textoSuave, textAlign: "right" },
    detalleAbierto: {
        paddingHorizontal: 14,
        paddingBottom: 14,
        backgroundColor: colores.fondo,
    },
    subtitulo: {
        fontSize: 13,
        fontWeight: "bold",
        color: colores.textoSuave,
        marginTop: 14,
    },
    filaReceta: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 5,
    },
    recetaTexto: { fontSize: 14, color: colores.texto },
    aviso: { fontSize: 13, color: colores.textoSuave, marginTop: 14 },
    botones: { flexDirection: "row", gap: 10, marginTop: 10 },
});