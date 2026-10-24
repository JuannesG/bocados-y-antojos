import { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    StyleSheet,
} from "react-native";
import { supabase } from "../lib/supabase";
import Badge from "../components/Badge";
import NuevoPedido from "../components/NuevoPedido";

type Pedido = {
    pedido_id: string;
    cliente: string;
    fecha_entrega: string | null;
    estado_pedido: string;
    estado_pago: string;
    total: number;
    abono: number;
    saldo: number;
};

const pesos = (n: number) => "$" + Number(n).toLocaleString("es-CO");

const tonoPedido: Record<string, "neutro" | "verde" | "gris"> = {
    agendado: "neutro",
    entregado: "verde",
    cancelado: "gris",
};
const tonoPago: Record<string, "rojo" | "amarillo" | "verde"> = {
    pendiente: "rojo",
    abono: "amarillo",
    pagado: "verde",
};

export default function PedidosScreen() {
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [detalle, setDetalle] = useState<Record<string, string>>({});
    const [formAbierto, setFormAbierto] = useState(false);
    const [abierto, setAbierto] = useState("");
    const [monto, setMonto] = useState("");
    const [error, setError] = useState("");

    async function cargar() {
        const [res, items, prods] = await Promise.all([
            supabase
                .from("pedidos_resumen")
                .select("pedido_id, cliente, fecha_entrega, estado_pedido, estado_pago, total, abono, saldo")
                .order("fecha_entrega", { ascending: false }),
            supabase.from("pedido_items").select("pedido_id, producto_id, cantidad"),
            supabase.from("productos").select("id, nombre"),
        ]);

        setPedidos(res.data ?? []);

        const nombres: Record<string, string> = {};
        (prods.data ?? []).forEach((p) => {
            nombres[p.id] = p.nombre;
        });

        const texto: Record<string, string> = {};
        (items.data ?? []).forEach((i) => {
            const linea = `${Number(i.cantidad)} × ${nombres[i.producto_id] ?? "—"}`;
            texto[i.pedido_id] = texto[i.pedido_id]
                ? texto[i.pedido_id] + ", " + linea
                : linea;
        });
        setDetalle(texto);
    }

    useEffect(() => {
        cargar();
    }, []);

    async function entregar(id: string) {
        setError("");
        const { data: items } = await supabase
            .from("pedido_items")
            .select("id, producto_id")
            .eq("pedido_id", id);
        const { data: costos } = await supabase
            .from("costo_producto")
            .select("producto_id, costo");

        for (const item of items ?? []) {
            const costo =
                costos?.find((c) => c.producto_id === item.producto_id)?.costo ?? null;
            await supabase
                .from("pedido_items")
                .update({ costo_unitario: costo })
                .eq("id", item.id);
        }

        const { error: fallo } = await supabase
            .from("pedidos")
            .update({ estado_pedido: "entregado" })
            .eq("id", id);
        if (fallo) setError("No se pudo marcar como entregado");
        cargar();
    }

    async function cancelar(id: string) {
        setError("");
        const { error: fallo } = await supabase
            .from("pedidos")
            .update({ estado_pedido: "cancelado" })
            .eq("id", id);
        if (fallo) setError("No se pudo cancelar el pedido");
        cargar();
    }

    async function registrarAbono(p: Pedido) {
        const valor = Number(monto.replace(",", "."));
        if (!(valor > 0)) {
            setError("Escribe un monto mayor a 0");
            return;
        }
        const nuevoAbono = Number(p.abono) + valor;
        if (nuevoAbono > Number(p.total)) {
            setError("El abono supera lo que falta por pagar");
            return;
        }
        setError("");
        const { error: fallo } = await supabase
            .from("pedidos")
            .update({
                abono: nuevoAbono,
                estado_pago: nuevoAbono >= Number(p.total) ? "pagado" : "abono",
            })
            .eq("id", p.pedido_id);
        if (fallo) {
            setError("No se pudo registrar el abono");
            return;
        }
        setMonto("");
        cargar();
    }

    function alGuardar() {
        setFormAbierto(false);
        cargar();
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Pressable
                style={styles.botonSecundario}
                onPress={() => setFormAbierto(!formAbierto)}
            >
                <Text style={styles.botonSecundarioTexto}>
                    {formAbierto ? "Cerrar formulario" : "+ Nuevo pedido"}
                </Text>
            </Pressable>

            {formAbierto ? <NuevoPedido onGuardado={alGuardar} /> : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.subtitulo}>Pedidos</Text>
            {pedidos.length === 0 ? (
                <Text style={styles.vacio}>Aún no hay pedidos</Text>
            ) : (
                pedidos.map((p) => (
                    <View key={p.pedido_id} style={styles.tarjeta}>
                        <Pressable
                            onPress={() => {
                                setAbierto(abierto === p.pedido_id ? "" : p.pedido_id);
                                setMonto("");
                            }}
                        >
                            <View style={styles.filaSuperior}>
                                <Text style={styles.cliente}>{p.cliente}</Text>
                                <Text style={styles.total}>{pesos(p.total)}</Text>
                            </View>
                            <Text style={styles.detalle}>{detalle[p.pedido_id] ?? ""}</Text>
                            <Text style={styles.detalle}>
                                Entrega: {p.fecha_entrega ?? "sin fecha"}
                                {Number(p.saldo) > 0 && p.estado_pedido !== "cancelado"
                                    ? ` · Debe ${pesos(p.saldo)}`
                                    : ""}
                            </Text>
                            <View style={styles.badges}>
                                <Badge
                                    texto={p.estado_pedido}
                                    tono={tonoPedido[p.estado_pedido] ?? "neutro"}
                                />
                                <Badge
                                    texto={p.estado_pago}
                                    tono={tonoPago[p.estado_pago] ?? "rojo"}
                                />
                            </View>
                        </Pressable>

                        {abierto === p.pedido_id && p.estado_pedido !== "cancelado" ? (
                            <View style={styles.acciones}>
                                {p.estado_pedido === "agendado" ? (
                                    <Pressable
                                        style={styles.botonAccion}
                                        onPress={() => entregar(p.pedido_id)}
                                    >
                                        <Text style={styles.botonAccionTexto}>Marcar entregado</Text>
                                    </Pressable>
                                ) : null}

                                {Number(p.saldo) > 0 ? (
                                    <View>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Monto del abono"
                                            value={monto}
                                            onChangeText={setMonto}
                                            keyboardType="numeric"
                                        />
                                        <Pressable
                                            style={styles.botonAccion}
                                            onPress={() => registrarAbono(p)}
                                        >
                                            <Text style={styles.botonAccionTexto}>Registrar abono</Text>
                                        </Pressable>
                                    </View>
                                ) : null}

                                {p.estado_pedido === "agendado" ? (
                                    <Pressable
                                        style={styles.botonCancelar}
                                        onPress={() => cancelar(p.pedido_id)}
                                    >
                                        <Text style={styles.botonCancelarTexto}>Cancelar pedido</Text>
                                    </Pressable>
                                ) : null}
                            </View>
                        ) : null}
                    </View>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: "#FFF3E0" },
    botonSecundario: {
        backgroundColor: "#4E2E1E",
        borderRadius: 12,
        padding: 14,
        alignItems: "center",
    },
    botonSecundarioTexto: { color: "#FFF3E0", fontSize: 16, fontWeight: "bold" },
    error: { color: "#E63946", marginTop: 12, textAlign: "center" },
    subtitulo: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#4E2E1E",
        marginTop: 28,
        marginBottom: 12,
    },
    vacio: { color: "#4E2E1E", textAlign: "center" },
    tarjeta: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
    },
    filaSuperior: { flexDirection: "row", justifyContent: "space-between" },
    cliente: { fontSize: 17, fontWeight: "bold", color: "#4E2E1E" },
    total: { fontSize: 17, fontWeight: "bold", color: "#4E2E1E" },
    detalle: { fontSize: 13, color: "#7A5A45", marginTop: 4 },
    badges: { flexDirection: "row", marginTop: 10 },
    acciones: { marginTop: 14, borderTopWidth: 1, borderTopColor: "#E5E5E5", paddingTop: 12 },
    input: {
        backgroundColor: "#FFF3E0",
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
        fontSize: 16,
    },
    botonAccion: {
        backgroundColor: "#FF8A00",
        borderRadius: 12,
        padding: 12,
        marginTop: 10,
        alignItems: "center",
    },
    botonAccionTexto: { color: "#4E2E1E", fontWeight: "bold", fontSize: 15 },
    botonCancelar: {
        borderRadius: 12,
        padding: 12,
        marginTop: 10,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E63946",
    },
    botonCancelarTexto: { color: "#E63946", fontWeight: "bold", fontSize: 15 },
});