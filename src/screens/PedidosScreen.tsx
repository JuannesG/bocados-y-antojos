import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { supabase } from "../lib/supabase";
import { pesos, limpiar, numeroPedido } from "../lib/formato";
import { enRango, rangosPedidos } from "../lib/rangos";
import Badge from "../components/Badge";
import NuevoPedido from "../components/NuevoPedido";
import Panel from "../components/Panel";
import BarraAcciones from "../components/BarraAcciones";
import BarraFiltros from "../components/BarraFiltros";
import { comunes } from "../styles/comunes";
import { styles } from "../styles/Pedidos.styles";

type Pedido = {
    pedido_id: string;
    numero: number;
    cliente: string;
    fecha_entrega: string | null;
    estado_pedido: string;
    estado_pago: string;
    total: number;
    abono: number;
    saldo: number;
    descuento: number;
};

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
    const [busqueda, setBusqueda] = useState("");
    const [filtro, setFiltro] = useState("todos");
    const [rango, setRango] = useState("todas");

    const [panelAbierto, setPanelAbierto] = useState(false);
    const [editando, setEditando] = useState("");
    const [abierto, setAbierto] = useState("");
    const [monto, setMonto] = useState("");
    const [confirmando, setConfirmando] = useState("");
    const [error, setError] = useState("");

    async function cargar() {
        const [res, items, prods] = await Promise.all([
            supabase
                .from("pedidos_resumen")
                .select(
                    "pedido_id, numero, cliente, fecha_entrega, estado_pedido, estado_pago, total, abono, saldo, descuento"
                )
                .order("numero", { ascending: false }),
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

    async function revertir(id: string) {
        setError("");
        await supabase
            .from("pedido_items")
            .update({ costo_unitario: null })
            .eq("pedido_id", id);

        const { error: fallo } = await supabase
            .from("pedidos")
            .update({ estado_pedido: "agendado" })
            .eq("id", id);
        if (fallo) setError("No se pudo revertir la entrega");
        setConfirmando("");
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
        setPanelAbierto(false);
        setEditando("");
        cargar();
    }

    const texto = limpiar(busqueda);
    const coincideBusqueda = (p: Pedido) =>
        limpiar(p.cliente).includes(texto) ||
        limpiar(detalle[p.pedido_id] ?? "").includes(texto) ||
        String(p.numero).includes(texto.replace("#", ""));

    const dentroDelRango = pedidos.filter(
        (p) => coincideBusqueda(p) && enRango(p.fecha_entrega, rango)
    );
    const contar = (estado: string) =>
        dentroDelRango.filter((p) => p.estado_pedido === estado).length;

    const opcionesEstado = [
        { valor: "todos", etiqueta: "Todos", cantidad: dentroDelRango.length },
        { valor: "agendado", etiqueta: "Agendado", cantidad: contar("agendado") },
        { valor: "entregado", etiqueta: "Entregado", cantidad: contar("entregado") },
        { valor: "cancelado", etiqueta: "Cancelado", cantidad: contar("cancelado") },
    ];

    const opcionesRango = rangosPedidos.map((r) => ({
        ...r,
        cantidad: pedidos.filter(
            (p) => coincideBusqueda(p) && enRango(p.fecha_entrega, r.valor)
        ).length,
    }));

    const visibles = dentroDelRango.filter(
        (p) => filtro === "todos" || p.estado_pedido === filtro
    );

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <BarraAcciones
                busqueda={busqueda}
                onBusqueda={setBusqueda}
                placeholder="Buscar cliente, producto o #número..."
                textoBoton="Nuevo"
                onBoton={() => setPanelAbierto(true)}
            />
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
                        valor: filtro,
                        porDefecto: "todos",
                        onCambio: setFiltro,
                    },
                ]}
            />

            {error ? <Text style={comunes.error}>{error}</Text> : null}

            <View style={styles.lista}>
                {visibles.length === 0 ? (
                    <Text style={comunes.vacio}>No hay pedidos para mostrar</Text>
                ) : (
                    visibles.map((p) => (
                        <View key={p.pedido_id} style={styles.tarjeta}>
                            <Pressable
                                onPress={() => {
                                    setAbierto(abierto === p.pedido_id ? "" : p.pedido_id);
                                    setMonto("");
                                    setConfirmando("");
                                }}
                            >
                                <View style={styles.filaSuperior}>
                                    <Text style={styles.cliente}>
                                        {numeroPedido(p.numero)} · {p.cliente}
                                    </Text>
                                    <Text style={styles.total}>{pesos(p.total)}</Text>
                                </View>
                                <Text style={styles.detalle}>{detalle[p.pedido_id] ?? ""}</Text>
                                <Text style={styles.detalle}>
                                    Entrega: {p.fecha_entrega ?? "sin fecha"}
                                    {Number(p.saldo) > 0 && p.estado_pedido !== "cancelado"
                                        ? ` · Debe ${pesos(p.saldo)}`
                                        : ""}
                                </Text>
                                {Number(p.descuento) > 0 ? (
                                    <Text style={styles.detalle}>
                                        Incluye promoción: −{pesos(p.descuento)}
                                    </Text>
                                ) : null}
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
                                            style={comunes.botonOscuro}
                                            onPress={() => setEditando(p.pedido_id)}
                                        >
                                            <Text style={comunes.botonOscuroTexto}>Editar pedido</Text>
                                        </Pressable>
                                    ) : null}

                                    {p.estado_pedido === "agendado" ? (
                                        <Pressable
                                            style={comunes.botonOscuro}
                                            onPress={() => entregar(p.pedido_id)}
                                        >
                                            <Text style={comunes.botonOscuroTexto}>Marcar entregado</Text>
                                        </Pressable>
                                    ) : null}

                                    {Number(p.saldo) > 0 ? (
                                        <View>
                                            <TextInput
                                                style={comunes.input}
                                                placeholder="Monto del abono"
                                                placeholderTextColor="#A8A29E"
                                                value={monto}
                                                onChangeText={setMonto}
                                                keyboardType="numeric"
                                            />
                                            <Pressable
                                                style={comunes.botonOscuro}
                                                onPress={() => registrarAbono(p)}
                                            >
                                                <Text style={comunes.botonOscuroTexto}>Registrar abono</Text>
                                            </Pressable>
                                        </View>
                                    ) : null}

                                    {p.estado_pedido === "agendado" ? (
                                        <Pressable
                                            style={comunes.botonContorno}
                                            onPress={() => cancelar(p.pedido_id)}
                                        >
                                            <Text style={comunes.botonContornoTexto}>Cancelar pedido</Text>
                                        </Pressable>
                                    ) : null}

                                    {p.estado_pedido === "entregado" ? (
                                        confirmando === p.pedido_id ? (
                                            <View>
                                                <Text style={styles.aviso}>
                                                    El pedido volverá a "agendado": lo que gastó regresa al
                                                    inventario y deja de contar como venta. ¿Seguro?
                                                </Text>
                                                <View style={styles.botones}>
                                                    <Pressable
                                                        style={comunes.botonPeligro}
                                                        onPress={() => revertir(p.pedido_id)}
                                                    >
                                                        <Text style={comunes.botonPeligroTexto}>Sí, revertir</Text>
                                                    </Pressable>
                                                    <Pressable
                                                        style={comunes.botonNeutro}
                                                        onPress={() => setConfirmando("")}
                                                    >
                                                        <Text style={comunes.botonNeutroTexto}>No</Text>
                                                    </Pressable>
                                                </View>
                                            </View>
                                        ) : (
                                            <Pressable
                                                style={comunes.botonContorno}
                                                onPress={() => setConfirmando(p.pedido_id)}
                                            >
                                                <Text style={comunes.botonContornoTexto}>Revertir entrega</Text>
                                            </Pressable>
                                        )
                                    ) : null}
                                </View>
                            ) : null}
                        </View>
                    ))
                )}
            </View>

            <Panel
                visible={panelAbierto}
                titulo="Nuevo pedido"
                onCerrar={() => setPanelAbierto(false)}
            >
                {panelAbierto ? <NuevoPedido onGuardado={alGuardar} /> : null}
            </Panel>

            <Panel
                visible={editando !== ""}
                titulo="Editar pedido"
                onCerrar={() => setEditando("")}
            >
                {editando !== "" ? (
                    <NuevoPedido pedidoId={editando} onGuardado={alGuardar} />
                ) : null}
            </Panel>
        </ScrollView>
    );
}