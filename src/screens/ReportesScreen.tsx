import { useEffect, useState } from "react";
import {
    View,
    Text,
    Pressable,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
} from "react-native";
import { cargarResumen } from "../lib/resumen";
import type { Resumen } from "../lib/resumen";
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
    const { width } = useWindowDimensions();
    const base = width >= 900 ? "23.5%" : "47.5%";

    const [periodo, setPeriodo] = useState<Periodo>("mes");
    const [resumen, setResumen] = useState<Resumen | null>(null);

    useEffect(() => {
        cargarResumen(desdeDe(periodo), hoy()).then(setResumen);
    }, [periodo]);

    const top = resumen?.topProductos ?? [];
    const maximo = Math.max(...top.map((p) => p.cantidad), 1);

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
                <TarjetaDato titulo="Ventas totales" valor={pesos(resumen?.ventas ?? 0)} icono="trending-up-outline" base={base} />
                <TarjetaDato titulo="Costo de productos" valor={pesos(resumen?.costo ?? 0)} icono="pricetag-outline" base={base} />
                <TarjetaDato titulo="Ganancia estimada" valor={pesos(resumen?.ganancia ?? 0)} icono="cash-outline" base={base} />
                <TarjetaDato titulo="Inversión (compras)" valor={pesos(resumen?.inversion ?? 0)} icono="wallet-outline" base={base} />
            </View>

            <View style={styles.caja}>
                <Text style={styles.subtitulo}>Ventas de la última semana</Text>
                <BarrasDia datos={resumen?.ultimosDias ?? []} />
            </View>

            <View style={styles.caja}>
                <Text style={styles.subtitulo}>Productos más vendidos</Text>
                {top.length === 0 ? (
                    <Text style={styles.vacio}>Aún no hay ventas en este periodo</Text>
                ) : (
                    top.map((p, i) => {
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
                                    <View style={{ flex: porcentaje, backgroundColor: "#EA580C", borderRadius: 4 }} />
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
    container: { padding: 16 },
    selector: {
        flexDirection: "row",
        backgroundColor: "white",
        borderRadius: 12,
        padding: 4,
        marginBottom: 14,
    },
    opcion: { flex: 1, padding: 10, borderRadius: 10, alignItems: "center" },
    opcionActiva: { backgroundColor: "#EA580C" },
    opcionTexto: { color: "#1C1917", fontWeight: "bold", fontSize: 13 },
    rejilla: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    caja: {
        backgroundColor: "white",
        borderRadius: 14,
        padding: 14,
        marginTop: 10,
        borderWidth: 1,
        borderColor: "#E7E5E4",
    },
    subtitulo: { fontSize: 16, fontWeight: "bold", color: "#1C1917" },
    vacio: { color: "#78716C", marginTop: 12 },
    producto: { marginTop: 14 },
    filaProducto: { flexDirection: "row", justifyContent: "space-between" },
    nombre: { fontSize: 15, color: "#1C1917", flex: 1 },
    cantidad: { fontSize: 14, fontWeight: "bold", color: "#1C1917" },
    pista: { flexDirection: "row", height: 8, marginTop: 6 },
});