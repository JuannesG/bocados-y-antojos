import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { supabase } from "../../lib/supabase";
import { hoy, pesos } from "../../lib/formato";
import { useBase } from "../../lib/diseno";
import TarjetaDato from "../TarjetaDato";
import FilaBarra from "../FilaBarra";
import { styles } from "../../styles/Reportes.styles";

type Props = { desde: string };
type Cliente = { nombre: string; pedidos: number; total: number };
type Deuda = { nombre: string; saldo: number };

export default function ReporteClientes({ desde }: Props) {
    const base = useBase();
    const [mejores, setMejores] = useState<Cliente[]>([]);
    const [totalPedidos, setTotalPedidos] = useState(0);
    const [totalVendido, setTotalVendido] = useState(0);
    const [deudas, setDeudas] = useState<Deuda[]>([]);

    useEffect(() => {
        async function cargar() {
            const [periodo, pendientes] = await Promise.all([
                supabase
                    .from("pedidos_resumen")
                    .select("cliente, total")
                    .neq("estado_pedido", "cancelado")
                    .gte("fecha_entrega", desde)
                    .lte("fecha_entrega", hoy()),
                supabase
                    .from("pedidos_resumen")
                    .select("cliente, saldo")
                    .neq("estado_pedido", "cancelado")
                    .gt("saldo", 0),
            ]);

            const porCliente: Record<string, Cliente> = {};
            let suma = 0;
            (periodo.data ?? []).forEach((p) => {
                const t = Number(p.total);
                suma += t;
                const c = porCliente[p.cliente] ?? { nombre: p.cliente, pedidos: 0, total: 0 };
                c.pedidos += 1;
                c.total += t;
                porCliente[p.cliente] = c;
            });

            const deuda: Record<string, Deuda> = {};
            (pendientes.data ?? []).forEach((p) => {
                const d = deuda[p.cliente] ?? { nombre: p.cliente, saldo: 0 };
                d.saldo += Number(p.saldo);
                deuda[p.cliente] = d;
            });

            setTotalPedidos((periodo.data ?? []).length);
            setTotalVendido(suma);
            setMejores(
                Object.values(porCliente)
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 6)
            );
            setDeudas(Object.values(deuda).sort((a, b) => b.saldo - a.saldo));
        }
        cargar();
    }, [desde]);

    const maximo = Math.max(...mejores.map((c) => c.total), 1);
    const porCobrar = deudas.reduce((suma, d) => suma + d.saldo, 0);

    return (
        <View>
            <View style={styles.rejilla}>
                <TarjetaDato titulo="Clientes con pedidos" valor={String(mejores.length)} icono="people-outline" base={base} />
                <TarjetaDato titulo="Pedidos" valor={String(totalPedidos)} icono="receipt-outline" base={base} />
                <TarjetaDato
                    titulo="Promedio por pedido"
                    valor={pesos(totalPedidos > 0 ? totalVendido / totalPedidos : 0)}
                    icono="calculator-outline"
                    base={base}
                />
                <TarjetaDato titulo="Por cobrar (total)" valor={pesos(porCobrar)} icono="hourglass-outline" base={base} />
            </View>

            <View style={styles.caja}>
                <Text style={styles.subtitulo}>Mejores clientes</Text>
                {mejores.length === 0 ? (
                    <Text style={styles.vacio}>Aún no hay pedidos en este periodo</Text>
                ) : (
                    mejores.map((c, i) => (
                        <FilaBarra
                            key={i}
                            etiqueta={c.nombre}
                            valor={pesos(c.total)}
                            porcentaje={(c.total / maximo) * 100}
                            detalle={`${c.pedidos} ${c.pedidos === 1 ? "pedido" : "pedidos"}`}
                        />
                    ))
                )}
            </View>

            <View style={styles.caja}>
                <Text style={styles.subtitulo}>Quién te debe</Text>
                {deudas.length === 0 ? (
                    <Text style={styles.vacio}>Nadie te debe nada</Text>
                ) : (
                    deudas.map((d, i) => (
                        <View key={i} style={styles.fila}>
                            <Text style={styles.nombre}>{d.nombre}</Text>
                            <Text style={styles.alerta}>{pesos(d.saldo)}</Text>
                        </View>
                    ))
                )}
            </View>
        </View>
    );
}