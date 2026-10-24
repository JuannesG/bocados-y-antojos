import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { cargarResumen, Resumen } from "../lib/resumen";
import { fechaHace, hoy, inicioMes, pesos } from "../lib/formato";
import TarjetaDato from "../components/TarjetaDato";
import BarrasDia from "../components/BarrasDia";

type Periodo = "hoy" | "semana" | "mes" | "todo";

const periodos: { valor: Periodo; etiqueta: string }[] = [
    { valor: "hoy", etiqueta: "Hoy" },
    { valor: "semana", etiqueta: "7 días" },
    { valor: "mes", etiqueta: "Este mes" },
    { valor: "todo", etiqueta: "Todo" },
];

function desdeDe(periodo: Periodo) {
    if (periodo === "hoy") return hoy();
    if (periodo === "semana") return fechaHace(6);
    if (periodo === "mes") return inicioMes();
    return "2000-01-01";
}

export default function ReportesScreen() {
    const [periodo, setPeriodo] = useState<Periodo>("mes");
    const [resumen, setResumen] = useState<Resumen | null>(null);

    useEffect(() => {
        cargarResumen(desdeDe(periodo), hoy()).then(setResumen);
    }, [periodo]);

    const maximo = Math.max(...(resumen?.topProductos ?? []).map((p) => p.cantidad), 1);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.selector}>
                {periodos.map((p) => (
                    <Pressable
                        key={p.valor}
                        style={[styles.opcion, periodo === p.valor && styles.opcionActiva]}
                        onPress={() => setPeriodo(p.valor)}
                    >
                        <Text style={styles.opcionTexto}>{p.etiqueta}</Text>
                    </Pressable>
                ))}
            </View>

            <View style={styles.rejilla}>
                <TarjetaDato titulo="Ventas totales" valor={pesos(resumen?.ventas ?? 0)} fondo="#E3F4DE" />
                <TarjetaDato titulo="Costo de productos" valor={pesos(resumen?.costo ?? 0)} fondo="#FFF1C2" />
                <TarjetaDato titulo="Ganancia estimada" valor={pesos(resumen?.ganancia ?? 0)} fondo="#FFE0B8" />
                <TarjetaDato titulo="Inversión (compras)" valor={pesos(resumen?.inversion ?? 0)} fondo="white" />
            </View>

            <Text style={styles.subtitulo}>Ventas de la última semana</Text>
            <View style={styles.caja}>
                <BarrasDia datos={resumen?.ultimosDias ?? []} />
            </View>

            <Text style={styles.subtitulo}>Productos más vendidos</Text>
            <View style={styles.caja}>
                {(resumen?.topProductos ?? []).length === 0 ? (
                    <Text style={styles.vacio}>Aún no hay ventas en este periodo</Text>
                ) : (
                    (resumen?.topProductos ?? []).map((p, i) => {
                        const porcentaje = Math.round((p.cantidad / maximo) * 100);
                        return (
                            <View key={i} style={styles.producto}>
                                <View style={styles.filaProducto}>
                                    <Text style={styles.nombre}>{p.nombre}</Text>
                                    <Text style={styles.cantidad}>
                                        {p.cantidad} · {pesos(p.ingreso)}
                                    </Text>
                                </View>
                                <View style={styles.pista}>
                                    <View style={{ flex: porcentaje, backgroundColor: "#FF8A00", borderRadius: 4 }} />
                                    <View style={{ flex: 100 - porcentaje }} />
                                </View>
                            </View>
                        );
                    })
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: "#FFF3E0" },
    selector: {
        flexDirection: "row",
        backgroundColor: "white",
        borderRadius: 12,
        padding: 4,
        marginBottom: 14,
    },
    opcion: { flex: 1, padding: 10, borderRadius: 10, alignItems: "center" },
    opcionActiva: { backgroundColor: "#FF8A00" },
    opcionTexto: { color: "#4E2E1E", fontWeight: "bold", fontSize: 13 },
    rejilla: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    subtitulo: { fontSize: 18, fontWeight: "bold", color: "#4E2E1E", marginTop: 24 },
    caja: { backgroundColor: "white", borderRadius: 14, padding: 14, marginTop: 10 },
    vacio: { color: "#4E2E1E", textAlign: "center" },
    producto: { marginBottom: 14 },
    filaProducto: { flexDirection: "row", justifyContent: "space-between" },
    nombre: { fontSize: 15, color: "#4E2E1E", flex: 1 },
    cantidad: { fontSize: 14, fontWeight: "bold", color: "#4E2E1E" },
    pista: { flexDirection: "row", height: 8, marginTop: 6 },
});