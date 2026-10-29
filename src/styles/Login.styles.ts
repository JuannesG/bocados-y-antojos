import { StyleSheet } from "react-native";
import { colores } from "./tema";

export const styles = StyleSheet.create({
    raiz: { flex: 1, backgroundColor: colores.fondo },
    fila: { flex: 1, flexDirection: "row" },

    lateral: {
        flex: 1,
        backgroundColor: colores.texto,
        alignItems: "center",
        justifyContent: "center",
        padding: 48,
    },
    logoCaja: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: 24,
        width: "100%",
        maxWidth: 380,
    },
    logoGrande: { width: "100%", height: 260 },
    frase: {
        color: colores.textoSobreOscuro,
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
        marginTop: 32,
        maxWidth: 380,
    },
    fraseSuave: {
        color: colores.textoPlaceholder,
        fontSize: 15,
        textAlign: "center",
        marginTop: 10,
    },

    derecha: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    movil: {
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },

    tarjeta: {
        width: "100%",
        maxWidth: 420,
        backgroundColor: colores.tarjeta,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colores.borde,
        padding: 24,
    },
    logoMovil: { width: "100%", height: 150, marginBottom: 12 },
    titulo: { fontSize: 26, fontWeight: "bold", color: colores.texto },
    subtitulo: { fontSize: 14, color: colores.textoSuave, marginTop: 6, marginBottom: 8 },

    etiqueta: {
        fontSize: 13,
        fontWeight: "bold",
        color: colores.texto,
        marginTop: 16,
        marginBottom: 6,
    },
    campo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: colores.fondo,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colores.borde,
        paddingHorizontal: 14,
    },
    entrada: { flex: 1, paddingVertical: 14, fontSize: 16, color: colores.texto },

    error: { color: colores.peligro, marginTop: 14, textAlign: "center", fontSize: 14 },
    boton: {
        backgroundColor: colores.acento,
        borderRadius: 12,
        paddingVertical: 15,
        marginTop: 22,
        alignItems: "center",
    },
    botonInactivo: { opacity: 0.7 },
    botonTexto: { color: colores.textoSobreAcento, fontSize: 16, fontWeight: "bold" },
});