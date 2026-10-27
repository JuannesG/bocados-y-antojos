import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { supabase } from "../lib/supabase";
import Selector from "./Selector";
import { pesos, hoy } from "../lib/formato";
import { comunes } from "../styles/comunes";
import { styles } from "../styles/NuevoPedido.styles";

type Cliente = { id: string; nombre: string };
type Producto = { id: string; nombre: string; precio_venta: number };
type Item = { productoId: string; cantidad: number; precio: number };

type Props = { pedidoId?: string; onGuardado: () => void };

export default function NuevoPedido({ pedidoId, onGuardado }: Props) {
    const editando = pedidoId !== undefined;

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);

    const [clienteId, setClienteId] = useState("");
    const [clienteNuevo, setClienteNuevo] = useState("");
    const [fecha, setFecha] = useState(hoy());

    const [productoId, setProductoId] = useState("");
    const [cantidad, setCantidad] = useState("1");
    const [precioLinea, setPrecioLinea] = useState("");
    const [items, setItems] = useState<Item[]>([]);

    const [abono, setAbono] = useState("");
    const [abonoActual, setAbonoActual] = useState(0);
    const [idsViejos, setIdsViejos] = useState<string[]>([]);
    const [error, setError] = useState("");

    useEffect(() => {
        async function cargar() {
            const { data: cli } = await supabase
                .from("clientes")
                .select("id, nombre")
                .order("nombre");
            const { data: prod } = await supabase
                .from("productos")
                .select("id, nombre, precio_venta")
                .eq("activo", true)
                .order("nombre");
            setClientes(cli ?? []);
            setProductos(prod ?? []);

            if (pedidoId) {
                const { data: ped } = await supabase
                    .from("pedidos")
                    .select("cliente_id, fecha_entrega, abono")
                    .eq("id", pedidoId)
                    .single();
                const { data: its } = await supabase
                    .from("pedido_items")
                    .select("id, producto_id, cantidad, precio_unitario")
                    .eq("pedido_id", pedidoId);

                if (ped) {
                    setClienteId(ped.cliente_id);
                    setFecha(ped.fecha_entrega ?? hoy());
                    setAbonoActual(Number(ped.abono));
                }
                setItems(
                    (its ?? []).map((i) => ({
                        productoId: i.producto_id,
                        cantidad: Number(i.cantidad),
                        precio: Number(i.precio_unitario),
                    }))
                );
                setIdsViejos((its ?? []).map((i) => i.id));
            }
        }
        cargar();
    }, [pedidoId]);

    const cant = Number(cantidad.replace(",", "."));
    const precioNum = Number(precioLinea.replace(",", "."));
    const abonoNum = Number(abono.replace(",", ".")) || 0;
    const total = items.reduce((suma, i) => suma + i.cantidad * i.precio, 0);

    function nombreProducto(id: string) {
        return productos.find((p) => p.id === id)?.nombre ?? "—";
    }

    function elegirProducto(id: string) {
        setProductoId(id);
        const p = productos.find((x) => x.id === id);
        setPrecioLinea(p ? String(Number(p.precio_venta)) : "");
    }

    function anadirProducto() {
        const producto = productos.find((p) => p.id === productoId);
        if (!producto) {
            setError("Elige un producto");
            return;
        }
        if (!(cant > 0)) {
            setError("La cantidad debe ser mayor a 0");
            return;
        }
        if (!(precioNum > 0)) {
            setError("El precio debe ser mayor a 0");
            return;
        }
        setError("");
        setItems([
            ...items,
            { productoId: producto.id, cantidad: cant, precio: precioNum },
        ]);
        setProductoId("");
        setCantidad("1");
        setPrecioLinea("");
    }

    function quitarItem(posicion: number) {
        setItems(items.filter((_, i) => i !== posicion));
    }

    async function guardar() {
        if (!clienteId && !clienteNuevo.trim()) {
            setError("Elige un cliente o escribe uno nuevo");
            return;
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            setError("La fecha debe tener el formato AAAA-MM-DD");
            return;
        }
        if (items.length === 0) {
            setError("Añade al menos un producto");
            return;
        }
        const abonoFinal = editando ? abonoActual : abonoNum;
        if (abonoFinal < 0 || abonoFinal > total) {
            setError(
                editando
                    ? "El total no puede quedar por debajo de lo que el cliente ya abonó"
                    : "El abono no puede ser mayor que el total"
            );
            return;
        }
        setError("");

        let idCliente = clienteId;
        if (clienteNuevo.trim()) {
            const { data: nuevo, error: falloCliente } = await supabase
                .from("clientes")
                .insert({ nombre: clienteNuevo.trim() })
                .select("id")
                .single();
            if (falloCliente || !nuevo) {
                setError("No se pudo guardar el cliente");
                return;
            }
            idCliente = nuevo.id;
        }

        const estadoPago =
            abonoFinal >= total ? "pagado" : abonoFinal > 0 ? "abono" : "pendiente";

        if (editando && pedidoId) {
            const { error: falloItems } = await supabase.from("pedido_items").insert(
                items.map((i) => ({
                    pedido_id: pedidoId,
                    producto_id: i.productoId,
                    cantidad: i.cantidad,
                    precio_unitario: i.precio,
                }))
            );
            if (falloItems) {
                setError("No se pudieron guardar los productos. No se cambió nada.");
                return;
            }

            if (idsViejos.length > 0) {
                await supabase.from("pedido_items").delete().in("id", idsViejos);
            }

            const { error: falloPedido } = await supabase
                .from("pedidos")
                .update({
                    cliente_id: idCliente,
                    fecha_entrega: fecha,
                    estado_pago: estadoPago,
                })
                .eq("id", pedidoId);
            if (falloPedido) {
                setError("Se guardaron los productos, pero falló el resto. Intenta de nuevo.");
                return;
            }

            onGuardado();
            return;
        }

        const { data: pedido, error: falloPedido } = await supabase
            .from("pedidos")
            .insert({
                cliente_id: idCliente,
                fecha_entrega: fecha,
                estado_pedido: "agendado",
                estado_pago: estadoPago,
                abono: abonoNum,
            })
            .select("id")
            .single();

        if (falloPedido || !pedido) {
            setError("No se pudo guardar el pedido");
            return;
        }

        const { error: falloItems } = await supabase.from("pedido_items").insert(
            items.map((i) => ({
                pedido_id: pedido.id,
                producto_id: i.productoId,
                cantidad: i.cantidad,
                precio_unitario: i.precio,
            }))
        );

        if (falloItems) {
            await supabase.from("pedidos").delete().eq("id", pedido.id);
            setError("No se pudieron guardar los productos del pedido");
            return;
        }

        onGuardado();
    }

    return (
        <View>
            <Text style={styles.etiqueta}>Cliente</Text>
            <Selector
                valor={clienteId}
                onCambio={(id) => {
                    setClienteId(id);
                    setClienteNuevo("");
                }}
                placeholder="Elige un cliente"
                opciones={clientes.map((c) => ({ valor: c.id, etiqueta: c.nombre }))}
            />
            <TextInput
                style={comunes.input}
                placeholder="O escribe un cliente nuevo"
                value={clienteNuevo}
                onChangeText={(texto) => {
                    setClienteNuevo(texto);
                    if (texto) setClienteId("");
                }}
            />

            <TextInput
                style={comunes.input}
                placeholder="Fecha de entrega (AAAA-MM-DD)"
                value={fecha}
                onChangeText={setFecha}
            />

            <Text style={styles.etiqueta}>Productos del pedido</Text>
            <Selector
                valor={productoId}
                onCambio={elegirProducto}
                placeholder="Elige un producto"
                opciones={productos.map((p) => ({
                    valor: p.id,
                    etiqueta: `${p.nombre} · ${pesos(p.precio_venta)}`,
                }))}
            />
            <TextInput
                style={comunes.input}
                placeholder="Cantidad"
                value={cantidad}
                onChangeText={setCantidad}
                keyboardType="numeric"
            />
            <TextInput
                style={comunes.input}
                placeholder="Precio por unidad (puedes cambiarlo para una promoción)"
                value={precioLinea}
                onChangeText={setPrecioLinea}
                keyboardType="numeric"
            />
            <Pressable style={comunes.botonOscuro} onPress={anadirProducto}>
                <Text style={comunes.botonOscuroTexto}>Agregar producto</Text>
            </Pressable>

            {items.map((item, posicion) => (
                <View key={posicion} style={styles.item}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.texto}>
                            {item.cantidad} × {nombreProducto(item.productoId)}
                        </Text>
                        <Text style={styles.detalle}>a {pesos(item.precio)} c/u</Text>
                    </View>
                    <Text style={styles.texto}>{pesos(item.cantidad * item.precio)}</Text>
                    <Pressable onPress={() => quitarItem(posicion)}>
                        <Text style={styles.quitar}>✕</Text>
                    </Pressable>
                </View>
            ))}

            {items.length > 0 ? (
                <Text style={styles.total}>Total: {pesos(total)}</Text>
            ) : null}

            {editando ? (
                <Text style={styles.nota}>
                    Abonado hasta ahora: {pesos(abonoActual)}. Los abonos nuevos se registran
                    desde el pedido.
                </Text>
            ) : (
                <TextInput
                    style={comunes.input}
                    placeholder="Abono recibido (opcional)"
                    value={abono}
                    onChangeText={setAbono}
                    keyboardType="numeric"
                />
            )}

            <Pressable style={comunes.botonPrimario} onPress={guardar}>
                <Text style={comunes.botonPrimarioTexto}>
                    {editando ? "Guardar cambios" : "Guardar pedido"}
                </Text>
            </Pressable>
            {error ? <Text style={comunes.error}>{error}</Text> : null}
        </View>
    );
}