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
import Selector from "./Selector";

type Cliente = { id: string; nombre: string };
type Producto = { id: string; nombre: string; precio_venta: number };
type Item = { productoId: string; cantidad: number; precio: number };

type Props = { onGuardado: () => void };

const pesos = (n: number) => "$" + Number(n).toLocaleString("es-CO");

function hoy() {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mes}-${dia}`;
}

export default function NuevoPedido({ onGuardado }: Props) {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [clienteId, setClienteId] = useState("");
    const [clienteNuevo, setClienteNuevo] = useState("");
    const [fecha, setFecha] = useState(hoy());
    const [productoId, setProductoId] = useState("");
    const [cantidad, setCantidad] = useState("1");
    const [items, setItems] = useState<Item[]>([]);
    const [abono, setAbono] = useState("");
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
        }
        cargar();
    }, []);

    const cant = Number(cantidad.replace(",", "."));
    const abonoNum = Number(abono.replace(",", ".")) || 0;
    const total = items.reduce((suma, i) => suma + i.cantidad * i.precio, 0);

    function nombreProducto(id: string) {
        return productos.find((p) => p.id === id)?.nombre ?? "—";
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
        setError("");
        setItems([
            ...items,
            { productoId: producto.id, cantidad: cant, precio: Number(producto.precio_venta) },
        ]);
        setProductoId("");
        setCantidad("1");
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
        if (abonoNum < 0 || abonoNum > total) {
            setError("El abono no puede ser mayor que el total");
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
            abonoNum >= total ? "pagado" : abonoNum > 0 ? "abono" : "pendiente";

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
                style={styles.input}
                placeholder="O escribe un cliente nuevo"
                value={clienteNuevo}
                onChangeText={(texto) => {
                    setClienteNuevo(texto);
                    if (texto) setClienteId("");
                }}
            />

            <TextInput
                style={styles.input}
                placeholder="Fecha de entrega (AAAA-MM-DD)"
                value={fecha}
                onChangeText={setFecha}
            />

            <Text style={styles.etiqueta}>Productos del pedido</Text>
            <Selector
                valor={productoId}
                onCambio={setProductoId}
                placeholder="Elige un producto"
                opciones={productos.map((p) => ({
                    valor: p.id,
                    etiqueta: `${p.nombre} · ${pesos(p.precio_venta)}`,
                }))}
            />
            <TextInput
                style={styles.input}
                placeholder="Cantidad"
                value={cantidad}
                onChangeText={setCantidad}
                keyboardType="numeric"
            />
            <Pressable style={styles.botonSecundario} onPress={anadirProducto}>
                <Text style={styles.botonSecundarioTexto}>Agregar Producto</Text>
            </Pressable>

            {items.map((item, posicion) => (
                <View key={posicion} style={styles.item}>
                    <Text style={styles.texto}>
                        {item.cantidad} × {nombreProducto(item.productoId)}
                    </Text>
                    <Text style={styles.texto}>{pesos(item.cantidad * item.precio)}</Text>
                    <Pressable onPress={() => quitarItem(posicion)}>
                        <Text style={styles.quitar}>✕</Text>
                    </Pressable>
                </View>
            ))}

            {items.length > 0 ? (
                <Text style={styles.total}>Total: {pesos(total)}</Text>
            ) : null}

            <TextInput
                style={styles.input}
                placeholder="Abono recibido (opcional)"
                value={abono}
                onChangeText={setAbono}
                keyboardType="numeric"
            />

            <Pressable style={styles.boton} onPress={guardar}>
                <Text style={styles.botonTexto}>Guardar pedido</Text>
            </Pressable>
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    etiqueta: { fontSize: 14, color: "#1C1917", marginTop: 20, marginBottom: 8 },
    chip: {
        backgroundColor: "white",
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 14,
        marginRight: 8,
    },
    chipActivo: { backgroundColor: "#EA580C" },
    chipTexto: { color: "#1C1917" },
    input: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
        fontSize: 16,
    },
    boton: {
        backgroundColor: "#EA580C",
        borderRadius: 12,
        padding: 14,
        marginTop: 20,
        alignItems: "center",
    },
    botonTexto: { color: "#1C1917", fontSize: 16, fontWeight: "bold" },
    botonSecundario: {
        backgroundColor: "#1C1917",
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
        alignItems: "center",
    },
    botonSecundarioTexto: { color: "#FAFAF9", fontSize: 16, fontWeight: "bold" },
    item: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
    },
    texto: { color: "#1C1917", fontSize: 15 },
    quitar: { color: "#E63946", fontSize: 18, paddingHorizontal: 8 },
    total: { marginTop: 16, color: "#1C1917", fontWeight: "bold", fontSize: 18 },
    error: { color: "#E63946", marginTop: 12, textAlign: "center" },
});