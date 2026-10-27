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
    nombre: { fontSize: 15, color: colores.texto },
    cantidad: {
        fontSize: 15,
        fontWeight: "bold",
        color: colores.texto,
        textAlign: "right",
    },
    unidad: { fontSize: 14, color: colores.textoSuave, paddingLeft: 10 },
    detalleAbierto: {
        paddingHorizontal: 14,
        paddingBottom: 14,
        backgroundColor: colores.fondo,
    },
    subtitulo: {
        fontSize: 13,
        fontWeight: "bold",
        color: colores.textoSuave,
        marginTop: 16,
    },
    nota: { fontSize: 12, color: colores.textoSuave, marginTop: 6 },
    aviso: { fontSize: 13, color: colores.textoSuave, marginTop: 14 },
    botones: { flexDirection: "row", gap: 10, marginTop: 10 },
    selector: {
        flexDirection: "row",
        marginTop: 12,
        backgroundColor: colores.tarjeta,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colores.borde,
        padding: 4,
    },
    opcion: { flex: 1, padding: 10, borderRadius: 10, alignItems: "center" },
    opcionActiva: { backgroundColor: colores.texto },
    opcionTexto: { color: colores.texto, fontWeight: "bold" },
    opcionTextoActivo: { color: colores.textoSobreOscuro },
});