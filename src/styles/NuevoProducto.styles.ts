
import { StyleSheet } from "react-native";
import { colores } from "./tema";

export const styles = StyleSheet.create({
    etiqueta: { fontSize: 14, color: colores.texto, marginTop: 20 },
    nota: { fontSize: 13, color: colores.textoSuave, marginTop: 12 },
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
    ingrediente: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: colores.tarjeta,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colores.borde,
        padding: 12,
        marginTop: 8,
    },
    nombre: { fontSize: 15, color: colores.texto },
    quitar: { color: colores.peligro, fontSize: 18, paddingHorizontal: 8 },
    resumen: { marginTop: 16, color: colores.texto, fontWeight: "bold" },
});