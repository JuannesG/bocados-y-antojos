import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { supabase } from "../../lib/supabase";
import { enRango, rangosPedidos } from "../../lib/rangos";
import { useBase } from "../../lib/diseno";
import TarjetaDato from "../TarjetaDato";
import BarraFiltros from "../BarraFiltros";
import FilaBarra from "../FilaBarra";
import { styles } from "../../styles/Reportes.styles";

type Fila = {
    pedido_id: string;
    fecha: string | null;
    estado_pedido: string;
    producto: string;
    cantidad: number;
};
type Grupo = { nombre: string; total: number; agendado: number; entregado: number };

export default function ReportePedidos() {
    const base = useBase();
    const [filas, setFilas] = useState<Fila[]>([]);
    const [rango, setRango] = useState("todas");
    const [estado, setEstado] = useState("todos");

    useEffect(() => {
        async function cargar() {
            const { data } = await supabase
                .from("pedidos_detalle")
                .select("pedido_id, fecha, estado_pedido, producto, cantidad");
            setFilas((data ?? []).map((f) => ({ ...f, cantidad: Number(f.cantidad) })));
        }
        cargar();
    }, []);

    const noCancelada = (f: Fila) => f.estado_pedido !== "cancelado";
    const pedidosDe = (lista: Fila[]) => new Set(lista.map((f) => f.pedido_id)).size;

    const delPeriodo = filas.filter((f) => enRango(f.fecha, rango));
    const activas = delPeriodo.filter(noCancelada);

    const totalPedidos = pedidosDe(activas);
    const agendados = pedidosDe(activas.filter((f) => f.estado_pedido === "agendado"));
    const entregados = pedidosDe(activas.filter((f) => f.estado_pedido === "entregado"));
    const cancelados = pedidosDe(delPeriodo.filter((f) => !noCancelada(f)));

    const mostradas = activas.filter(
        (f) => estado === "todos" || f.estado_pedido === estado
    );
    const porProducto: Record<string, Grupo> = {};
    mostradas.forEach((f) => {
        const g = porProducto[f.producto] ?? {
            nombre: f.producto,
            total: 0,
            agendado: 0,
            entregado: 0,
        };
        g.total += f.cantidad;
        if (f.estado_pedido === "agendado") g.agendado += f.cantidad;
        else g.entregado += f.cantidad;
        porProducto[f.producto] = g;
    });
    const lista = Object.values(porProducto).sort((a, b) => b.total - a.total);
    const maximo = Math.max(...lista.map((g) => g.total), 1);
    const totalUnidades = lista.reduce((suma, g) => suma + g.total, 0);

    const opcionesRango = rangosPedidos.map((r) => ({
        ...r,
        cantidad: pedidosDe(
            filas.filter((f) => noCancelada(f) && enRango(f.fecha, r.valor))
        ),
    }));
    const opcionesEstado = [
        { valor: "todos", etiqueta: "Todos", cantidad: totalPedidos },
        { valor: "agendado", etiqueta: "Por entregar", cantidad: agendados },
        { valor: "entregado", etiqueta: "Entregados", cantidad: entregados },
    ];

    return (
        <View>
            <BarraFiltros
                grupos={[
                    {
                        clave: "fecha",
                        titulo: "Fecha de entrega",
                        opciones: opcionesRango,
                        valor: rango,
                        porDefecto: "todas",
                        onCambio: setRango,
                    },
                    {
                        clave: "estado",
                        titulo: "Estado del pedido",
                        opciones: opcionesEstado,
                        valor: estado,
                        porDefecto: "todos",
                        onCambio: setEstado,
                    },
                ]}
            />

            <View style={[styles.rejilla, { marginTop: 14 }]}>
                <TarjetaDato titulo="Pedidos" valor={String(totalPedidos)} icono="receipt-outline" base={base} />
                <TarjetaDato titulo="Por entregar" valor={String(agendados)} icono="time-outline" base={base} />
                <TarjetaDato titulo="Entregados" valor={String(entregados)} icono="checkmark-circle-outline" base={base} />
                <TarjetaDato titulo="Cancelados" valor={String(cancelados)} icono="close-circle-outline" base={base} />
            </View>

            <View style={styles.caja}>
                <Text style={styles.subtitulo}>Productos pedidos</Text>
                <Text style={styles.detalle}>
                    {totalUnidades} unidades en total (bandejas u otras unidades de cada producto)
                </Text>
                {lista.length === 0 ? (
                    <Text style={styles.vacio}>No hay pedidos con estos filtros</Text>
                ) : (
                    lista.map((g, i) => (
                        <FilaBarra
                            key={i}
                            etiqueta={g.nombre}
                            valor={String(g.total)}
                            porcentaje={(g.total / maximo) * 100}
                            detalle={`${g.agendado} por entregar · ${g.entregado} entregados`}
                        />
                    ))
                )}
            </View>
        </View>
    );
}