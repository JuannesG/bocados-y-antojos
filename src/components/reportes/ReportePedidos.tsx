import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { supabase } from "../../lib/supabase";
import { pesos, numeroPedido } from "../../lib/formato";
import { useBase } from "../../lib/diseno";
import TarjetaDato from "../TarjetaDato";
import BarraFiltros from "../BarraFiltros";
import FilaBarra from "../FilaBarra";
import { styles } from "../../styles/Reportes.styles";

type Props = { desde: string; hasta: string };

type Fila = {
    pedido_id: string;
    fecha: string | null;
    estado_pedido: string;
    producto: string;
    cantidad: number;
    ingreso: number;
    costo: number;
    cliente: string;
    numero: number;
};
type Grupo = {
    nombre: string;
    total: number;
    agendado: number;
    entregado: number;
    ingreso: number;
    costo: number;
};
type DePedido = {
    pedido_id: string;
    numero: number;
    cliente: string;
    estado: string;
    cantidad: number;
};

export default function ReportePedidos({ desde, hasta }: Props) {
    const base = useBase();
    const [filas, setFilas] = useState<Fila[]>([]);
    const [estado, setEstado] = useState("todos");
    const [abierto, setAbierto] = useState("");

    useEffect(() => {
        async function cargar() {
            const { data } = await supabase
                .from("pedidos_detalle")
                .select(
                    "pedido_id, fecha, estado_pedido, producto, cantidad, ingreso, costo, cliente, numero"
                );
            setFilas(
                (data ?? []).map((f) => ({
                    ...f,
                    cantidad: Number(f.cantidad),
                    ingreso: Number(f.ingreso),
                    costo: Number(f.costo),
                    numero: Number(f.numero),
                }))
            );
        }
        cargar();
    }, []);

    const noCancelada = (f: Fila) => f.estado_pedido !== "cancelado";
    const pedidosDe = (lista: Fila[]) => new Set(lista.map((f) => f.pedido_id)).size;

    const delPeriodo = filas.filter(
        (f) => f.fecha !== null && f.fecha >= desde && f.fecha <= hasta
    );
    const activas = delPeriodo.filter(noCancelada);

    const totalPedidos = pedidosDe(activas);
    const agendados = pedidosDe(activas.filter((f) => f.estado_pedido === "agendado"));
    const entregados = pedidosDe(activas.filter((f) => f.estado_pedido === "entregado"));
    const cancelados = pedidosDe(delPeriodo.filter((f) => !noCancelada(f)));

    const mostradas = activas.filter(
        (f) => estado === "todos" || f.estado_pedido === estado
    );

    const ventas = mostradas.reduce((suma, f) => suma + f.ingreso, 0);
    const inversion = mostradas.reduce((suma, f) => suma + f.costo, 0);
    const ganancia = ventas - inversion;
    const unidades = mostradas.reduce((suma, f) => suma + f.cantidad, 0);

    const porProducto: Record<string, Grupo> = {};
    mostradas.forEach((f) => {
        const g = porProducto[f.producto] ?? {
            nombre: f.producto,
            total: 0,
            agendado: 0,
            entregado: 0,
            ingreso: 0,
            costo: 0,
        };
        g.total += f.cantidad;
        g.ingreso += f.ingreso;
        g.costo += f.costo;
        if (f.estado_pedido === "agendado") g.agendado += f.cantidad;
        else g.entregado += f.cantidad;
        porProducto[f.producto] = g;
    });
    const lista = Object.values(porProducto).sort((a, b) => b.total - a.total);
    const maximo = Math.max(...lista.map((g) => g.total), 1);

    function pedidosDelProducto(producto: string): DePedido[] {
        const porPedido: Record<string, DePedido> = {};
        mostradas
            .filter((f) => f.producto === producto)
            .forEach((f) => {
                const d = porPedido[f.pedido_id] ?? {
                    pedido_id: f.pedido_id,
                    numero: f.numero,
                    cliente: f.cliente,
                    estado: f.estado_pedido,
                    cantidad: 0,
                };
                d.cantidad += f.cantidad;
                porPedido[f.pedido_id] = d;
            });
        return Object.values(porPedido).sort((a, b) => b.numero - a.numero);
    }

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
                <TarjetaDato titulo="Ventas de estos pedidos" valor={pesos(ventas)} icono="trending-up-outline" base={base} />
                <TarjetaDato titulo="Inversión en productos (proyección)" valor={pesos(inversion)} icono="wallet-outline" base={base} />
                <TarjetaDato titulo="Ganancia proyectada" valor={pesos(ganancia)} icono="cash-outline" base={base} />
                <TarjetaDato titulo="Unidades pedidas" valor={String(unidades)} icono="cube-outline" base={base} />
            </View>

            <View style={[styles.rejilla, { marginTop: 10 }]}>
                <TarjetaDato titulo="Pedidos" valor={String(totalPedidos)} icono="receipt-outline" base={base} />
                <TarjetaDato titulo="Por entregar" valor={String(agendados)} icono="time-outline" base={base} />
                <TarjetaDato titulo="Entregados" valor={String(entregados)} icono="checkmark-circle-outline" base={base} />
                <TarjetaDato titulo="Cancelados" valor={String(cancelados)} icono="close-circle-outline" base={base} />
            </View>

            <View style={styles.caja}>
                <Text style={styles.subtitulo}>Productos pedidos</Text>
                <Text style={styles.detalle}>
                    Toca un producto para ver los clientes que lo pidieron
                </Text>
                {lista.length === 0 ? (
                    <Text style={styles.vacio}>No hay pedidos con estos filtros</Text>
                ) : (
                    lista.map((g) => (
                        <View key={g.nombre}>
                            <Pressable onPress={() => setAbierto(abierto === g.nombre ? "" : g.nombre)}>
                                <FilaBarra
                                    etiqueta={g.nombre}
                                    valor={String(g.total)}
                                    porcentaje={(g.total / maximo) * 100}
                                    detalle={`${g.agendado} por entregar · ${g.entregado} entregados · inversión ${pesos(g.costo)} · ventas ${pesos(g.ingreso)}`}
                                />
                            </Pressable>

                            {abierto === g.nombre ? (
                                <View style={styles.clientes}>
                                    {pedidosDelProducto(g.nombre).map((d) => (
                                        <View key={d.pedido_id} style={styles.filaCliente}>
                                            <Text style={styles.nombre}>
                                                {numeroPedido(d.numero)} · {d.cliente}
                                            </Text>
                                            <Text style={styles.cantidad}>
                                                {d.cantidad} · {d.estado === "agendado" ? "por entregar" : "entregado"}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            ) : null}
                        </View>
                    ))
                )}
            </View>
        </View>
    );
}