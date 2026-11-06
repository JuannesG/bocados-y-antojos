import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { supabase } from "../../lib/supabase";
import { pesos } from "../../lib/formato";
import { useBase } from "../../lib/diseno";
import TarjetaDato from "../TarjetaDato";
import FilaBarra from "../FilaBarra";
import { styles } from "../../styles/Reportes.styles";

type Material = {
    nombre: string;
    unidad: string;
    stock: number;
    minimo: number;
    valor: number;
};

export default function ReporteInventario() {
    const base = useBase();
    const [materiales, setMateriales] = useState<Material[]>([]);

    useEffect(() => {
        async function cargar() {
            const [inv, mats, costos] = await Promise.all([
                supabase.from("inventario").select("material_id, nombre, unidad, stock, stock_minimo"),
                supabase.from("materiales").select("id, nombre"),
                supabase.from("costo_material").select("material_id, costo_promedio"),
            ]);

            const costoPorId: Record<string, number> = {};
            (costos.data ?? []).forEach((f) => {
                costoPorId[f.material_id] = Number(f.costo_promedio);
            });

            setMateriales(
                (inv.data ?? []).map((m) => {
                    const stock = Number(m.stock);
                    return {
                        nombre: m.nombre,
                        unidad: m.unidad,
                        stock,
                        minimo: Number(m.stock_minimo),
                        valor: Math.max(stock, 0) * (costoPorId[m.material_id] ?? 0),
                    };
                })
            );
        }
        cargar();
    }, []);

    const valorTotal = materiales.reduce((suma, m) => suma + m.valor, 0);
    const bajos = materiales
        .filter((m) => m.stock <= m.minimo)
        .sort((a, b) => a.stock - b.stock);
    const agotados = materiales.filter((m) => m.stock <= 0).length;
    const porValor = [...materiales]
        .filter((m) => m.valor > 0)
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 8);
    const maxValor = Math.max(...porValor.map((m) => m.valor), 1);

    return (
        <View>
            <View style={styles.rejilla}>
                <TarjetaDato titulo="Valor del inventario" valor={pesos(valorTotal)} icono="cube-outline" base={base} />
                <TarjetaDato titulo="Materiales" valor={String(materiales.length)} icono="list-outline" base={base} />
                <TarjetaDato titulo="Con stock bajo" valor={String(bajos.length)} icono="alert-circle-outline" base={base} />
                <TarjetaDato titulo="Agotados" valor={String(agotados)} icono="close-circle-outline" base={base} />
            </View>

            <View style={styles.caja}>
                <Text style={styles.subtitulo}>Dónde tienes más plata en inventario</Text>
                {porValor.length === 0 ? (
                    <Text style={styles.vacio}>Aún no hay inventario con costo</Text>
                ) : (
                    porValor.map((m, i) => (
                        <FilaBarra
                            key={i}
                            etiqueta={m.nombre}
                            valor={pesos(m.valor)}
                            porcentaje={(m.valor / maxValor) * 100}
                            detalle={`${m.stock.toLocaleString("es-CO")} ${m.unidad}`}
                        />
                    ))
                )}
            </View>

            <View style={styles.caja}>
                <Text style={styles.subtitulo}>Materiales con stock bajo</Text>
                {bajos.length === 0 ? (
                    <Text style={styles.vacio}>Todo el inventario está bien</Text>
                ) : (
                    bajos.slice(0, 10).map((m, i) => (
                        <View key={i} style={styles.fila}>
                            <Text style={styles.nombre}>{m.nombre}</Text>
                            <Text style={styles.alerta}>
                                {m.stock.toLocaleString("es-CO")} {m.unidad}
                            </Text>
                        </View>
                    ))
                )}
            </View>
        </View>
    );
}