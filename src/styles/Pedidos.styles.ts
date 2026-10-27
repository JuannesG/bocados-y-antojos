import { StyleSheet } from "react-native";
import { colores } from "./tema";

export const styles = StyleSheet.create({
    container: { padding: 16 },
    lista: { marginTop: 14 },
    tarjeta: {
        backgroundColor: colores.tarjeta,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colores.borde,
        padding: 14,
        marginBottom: 10,
    },
    filaSuperior: { flexDirection: "row", justifyContent: "space-between" },
    cliente: { fontSize: 17, fontWeight: "bold", color: colores.texto },
    total: { fontSize: 17, fontWeight: "bold", color: colores.texto },
    detalle: { fontSize: 13, color: colores.textoSuave, marginTop: 4 },
    badges: { flexDirection: "row", marginTop: 10 },
    acciones: {
        marginTop: 14,
        borderTopWidth: 1,
        borderTopColor: colores.borde,
        paddingTop: 12,
    },
});