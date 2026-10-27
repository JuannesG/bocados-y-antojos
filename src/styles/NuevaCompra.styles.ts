import { StyleSheet } from "react-native";
import { colores } from "./tema";

export const styles = StyleSheet.create({
    subtitulo: {
        fontSize: 16,
        fontWeight: "bold",
        color: colores.texto,
        marginTop: 16,
    },
    chips: { flexDirection: "row", marginTop: 12 },
    chip: {
        backgroundColor: colores.tarjeta,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colores.borde,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 8,
    },
    chipActivo: { backgroundColor: colores.texto, borderColor: colores.texto },
    chipTexto: { color: colores.texto, fontWeight: "bold" },
    chipTextoActivo: { color: colores.textoSobreOscuro },
    linea: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colores.tarjeta,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colores.borde,
        padding: 12,
        marginTop: 8,
    },
    quitar: { color: colores.peligro, fontSize: 18, paddingHorizontal: 8 },
    resumen: { marginTop: 16, color: colores.texto, fontWeight: "bold", fontSize: 18 },
    nombre: { fontSize: 16, color: colores.texto, fontWeight: "bold" },
    detalle: { fontSize: 13, color: colores.textoSuave, marginTop: 2 },
    total: { fontSize: 16, fontWeight: "bold", color: colores.texto },
});