import { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
} from "react-native";
import { supabase } from "../lib/supabase";
import { cargarResumen } from "../lib/resumen";
import type { Resumen } from "../lib/resumen";
import { hoy, inicioMes, pesos } from "../lib/formato";
import TarjetaDato from "../components/TarjetaDato";
import BarrasDia from "../components/BarrasDia";

type StockBajo = { nombre: string; unidad: string; stock: number };

export default function InicioScreen() {
    const { width } = useWindowDimensions();
    const esAncha = width >= 900;
    const base = esAncha ? "23.5%" : "47.5%";

    const [resumen, setResumen] = useState<Resumen | null>(null);
    const [pedidosHoy, setPedidosHoy] = useState(0);
    const [pendientesHoy, setPendientesHoy] = useState(0);
    const [totalMateriales, setTotalMateriales] = useState(0);
    const [stockBajo, setStockBajo] = useState<StockBajo[]>([]);
    const [totalClientes, setTotalClientes] = useState(0);
    const [facturasMes, setFacturasMes] = useState(0);

    async function cargar() {
        const [res, pedidos, inventario, clientes, facturas] = await Promise.all([
            cargarResumen(inicioMes(), hoy()),
            supabase.from("pedidos").select("estado_pedido").eq("fecha_entrega", hoy()),
            supabase.from("inventario").select("nombre, unidad, stock, stock_minimo"),
            supabase.from("clientes").select("id", { count: "exact", head: true }),
            supabase
                .from("facturas")
                .select("id", { count: "exact", head: true })
                .gte("fecha", inicioMes()),
        ]);

        setResumen(res);

        const deHoy = (pedidos.data ?? []).filter((p) => p.estado_pedido !== "cancelado");
        setPedidosHoy(deHoy.length);
        setPendientesHoy(deHoy.filter((p) => p.estado_pedido === "agendado").length);

        const materiales = inventario.data ?? [];
        setTotalMateriales(materiales.length);
        setStockBajo(
            materiales
                .filter((m) => Number(m.stock) <= Number(m.stock_minimo))
                .map((m) => ({ nombre: m.nombre, unidad: m.unidad, stock: Number(m.stock) }))
                .sort((a, b) => a.stock - b.stock)
        );

        setTotalClientes(clientes.count ?? 0);
        setFacturasMes(facturas.count ?? 0);
    }

    useEffect(() => {
        cargar();
    }, []);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.saludo}>Aquí tienes el resumen de tu negocio este mes</Text>

            <View style={styles.rejilla}>
                <TarjetaDato titulo="Inversión (compras)" valor={pesos(resumen?.inversion ?? 0)} icono="wallet-outline" base={base} />
                <TarjetaDato titulo="Ventas" valor={pesos(resumen?.ventas ?? 0)} icono="trending-up-outline" base={base} />
                <TarjetaDato titulo="Costo de productos" valor={pesos(resumen?.costo ?? 0)} icono="pricetag-outline" base={base} />
                <TarjetaDato titulo="Ganancia estimada" valor={pesos(resumen?.ganancia ?? 0)} icono="cash-outline" base={base} />
                <TarjetaDato titulo="Pedidos para hoy" valor={String(pedidosHoy)} icono="receipt-outline" base={base} nota={`${pendientesHoy} pendientes`} />
                <TarjetaDato titulo="Materiales en inventario" valor={String(totalMateriales)} icono="cube-outline" base={base} nota={`${stockBajo.length} con stock bajo`} />
                <TarjetaDato titulo="Clientes registrados" valor={String(totalClientes)} icono="people-outline" base={base} />
                <TarjetaDato titulo="Compras este mes" valor={String(facturasMes)} icono="bag-handle-outline" base={base} nota={pesos(resumen?.inversion ?? 0)} />
            </View>

            <View style={[styles.paneles, esAncha && { flexDirection: "row" }]}>
                <View style={[styles.caja, esAncha ? { flex: 2 } : undefined]}>
                    <Text style={styles.subtitulo}>Ventas de la última semana</Text>
                    <BarrasDia datos={resumen?.ultimosDias ?? []} />
                </View>

                <View style={[styles.caja, esAncha ? { flex: 1 } : undefined]}>
                    <Text style={styles.subtitulo}>Materiales con stock bajo</Text>
                    {stockBajo.length === 0 ? (
                        <Text style={styles.vacio}>Todo el inventario está bien</Text>
                    ) : (
                        stockBajo.slice(0, 6).map((m, i) => (
                            <View key={i} style={styles.fila}>
                                <View style={styles.punto} />
                                <Text style={styles.nombre}>{m.nombre}</Text>
                                <Text style={styles.stock}>
                                    {m.stock} {m.unidad}
                                </Text>
                            </View>
                        ))
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16 },
    saludo: { fontSize: 15, color: "#78716C", marginBottom: 14 },
    rejilla: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    paneles: { gap: 10, marginTop: 10 },
    caja: {
        backgroundColor: "white",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: "#E7E5E4",
    },
    subtitulo: { fontSize: 16, fontWeight: "bold", color: "#1C1917" },
    vacio: { color: "#78716C", marginTop: 12 },
    fila: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 10 },
    punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#E63946" },
    nombre: { flex: 1, fontSize: 15, color: "#1C1917" },
    stock: { fontSize: 15, fontWeight: "bold", color: "#E63946" },
});