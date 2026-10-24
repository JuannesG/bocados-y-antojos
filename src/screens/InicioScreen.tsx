import { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { cargarResumen, Resumen } from "../lib/resumen";
import { hoy, inicioMes, pesos } from "../lib/formato";
import TarjetaDato from "../components/TarjetaDato";
import BarrasDia from "../components/BarrasDia";

type StockBajo = { nombre: string; unidad: string; stock: number };

export default function InicioScreen() {
    const [resumen, setResumen] = useState<Resumen | null>(null);
    const [pedidosHoy, setPedidosHoy] = useState(0);
    const [pendientesHoy, setPendientesHoy] = useState(0);
    const [stockBajo, setStockBajo] = useState<StockBajo[]>([]);

    async function cargar() {
        const [res, pedidos, inventario] = await Promise.all([
            cargarResumen(inicioMes(), hoy()),
            supabase.from("pedidos").select("estado_pedido").eq("fecha_entrega", hoy()),
            supabase.from("inventario").select("nombre, unidad, stock, stock_minimo"),
        ]);

        setResumen(res);

        const deHoy = (pedidos.data ?? []).filter((p) => p.estado_pedido !== "cancelado");
        setPedidosHoy(deHoy.length);
        setPendientesHoy(deHoy.filter((p) => p.estado_pedido === "agendado").length);

        const bajos = (inventario.data ?? [])
            .filter((m) => Number(m.stock) <= Number(m.stock_minimo))
            .map((m) => ({ nombre: m.nombre, unidad: m.unidad, stock: Number(m.stock) }))
            .sort((a, b) => a.stock - b.stock);
        setStockBajo(bajos);
    }

    useFocusEffect(
        useCallback(() => {
            cargar();
        }, [])
    );

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.saludo}>Resumen de este mes</Text>

            <View style={styles.rejilla}>
                <TarjetaDato titulo="Ventas" valor={pesos(resumen?.ventas ?? 0)} fondo="#E3F4DE" />
                <TarjetaDato titulo="Costo de productos" valor={pesos(resumen?.costo ?? 0)} fondo="#FFF1C2" />
                <TarjetaDato titulo="Ganancia estimada" valor={pesos(resumen?.ganancia ?? 0)} fondo="#FFE0B8" />
                <TarjetaDato titulo="Inversión (compras)" valor={pesos(resumen?.inversion ?? 0)} fondo="white" />
                <TarjetaDato
                    titulo="Pedidos para hoy"
                    valor={String(pedidosHoy)}
                    fondo="white"
                    nota={`${pendientesHoy} pendientes`}
                />
                <TarjetaDato
                    titulo="Materiales con stock bajo"
                    valor={String(stockBajo.length)}
                    fondo="white"
                />
            </View>

            <Text style={styles.subtitulo}>Ventas de la última semana</Text>
            <View style={styles.caja}>
                <BarrasDia datos={resumen?.ultimosDias ?? []} />
            </View>

            <Text style={styles.subtitulo}>Stock bajo</Text>
            <View style={styles.caja}>
                {stockBajo.length === 0 ? (
                    <Text style={styles.vacio}>Todo el inventario está bien</Text>
                ) : (
                    stockBajo.slice(0, 6).map((m, i) => (
                        <View key={i} style={styles.fila}>
                            <Text style={styles.nombre}>{m.nombre}</Text>
                            <Text style={styles.stock}>
                                {m.stock} {m.unidad}
                            </Text>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: "#FFF3E0" },
    saludo: { fontSize: 20, fontWeight: "bold", color: "#4E2E1E", marginBottom: 12 },
    rejilla: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    subtitulo: { fontSize: 18, fontWeight: "bold", color: "#4E2E1E", marginTop: 24 },
    caja: { backgroundColor: "white", borderRadius: 14, padding: 14, marginTop: 10 },
    vacio: { color: "#4E2E1E", textAlign: "center" },
    fila: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
    nombre: { fontSize: 15, color: "#4E2E1E" },
    stock: { fontSize: 15, fontWeight: "bold", color: "#E63946" },
});