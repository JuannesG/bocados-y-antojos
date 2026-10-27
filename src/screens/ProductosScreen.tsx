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
import { pesos, limpiar } from "../lib/formato";
import Badge from "../components/Badge";
import Panel from "../components/Panel";
import BarraAcciones from "../components/BarraAcciones";
import Filtros from "../components/Filtros";
import NuevoProducto from "../components/NuevoProducto";

type Producto = {
    id: string;
    nombre: string;
    tipo: string;
    precio_venta: number;
};
type Receta = { producto_id: string; material_id: string; cantidad: number };
type Material = { nombre: string; unidad: string };

export default function ProductosScreen() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [costos, setCostos] = useState<Record<string, number>>({});
    const [recetas, setRecetas] = useState<Receta[]>([]);
    const [materiales, setMateriales] = useState<Record<string, Material>>({});

    const [busqueda, setBusqueda] = useState("");
    const [filtro, setFiltro] = useState("todos");
    const [panelAbierto, setPanelAbierto] = useState(false);
    const [abierto, setAbierto] = useState("");
    const [precioNuevo, setPrecioNuevo] = useState("");
    const [confirmando, setConfirmando] = useState("");
    const [error, setError] = useState("");

    async function cargar() {
        const [prods, costosRes, recs, mats] = await Promise.all([
            supabase
                .from("productos")
                .select("id, nombre, tipo, precio_venta")
                .eq("activo", true)
                .order("nombre"),
            supabase.from("costo_producto").select("producto_id, costo"),
            supabase.from("recetas").select("producto_id, material_id, cantidad"),
            supabase.from("materiales").select("id, nombre, unidad"),
        ]);

        setProductos(prods.data ?? []);
        setRecetas(recs.data ?? []);

        const c: Record<string, number> = {};
        (costosRes.data ?? []).forEach((f) => {
            c[f.producto_id] = Number(f.costo);
        });
        setCostos(c);

        const m: Record<string, Material> = {};
        (mats.data ?? []).forEach((f) => {
            m[f.id] = { nombre: f.nombre, unidad: f.unidad };
        });
        setMateriales(m);
    }

    useEffect(() => {
        cargar();
    }, []);

    async function cambiarPrecio(id: string) {
        const valor = Number(precioNuevo.replace(",", "."));
        if (!(valor > 0)) {
            setError("Escribe un precio mayor a 0");
            return;
        }
        const { error: fallo } = await supabase
            .from("productos")
            .update({ precio_venta: valor })
            .eq("id", id);
        if (fallo) {
            setError("No se pudo cambiar el precio");
            return;
        }
        setError("");
        setPrecioNuevo("");
        cargar();
    }

    async function desactivar(id: string) {
        const { error: fallo } = await supabase
            .from("productos")
            .update({ activo: false })
            .eq("id", id);
        if (fallo) {
            setError("No se pudo quitar el producto");
            return;
        }
        setError("");
        setConfirmando("");
        setAbierto("");
        cargar();
    }

    function alGuardar() {
        setPanelAbierto(false);
        cargar();
    }

    const contar = (tipo: string) => productos.filter((p) => p.tipo === tipo).length;

    const opcionesFiltro = [
        { valor: "todos", etiqueta: "Todos", cantidad: productos.length },
        { valor: "preparado", etiqueta: "Preparados", cantidad: contar("preparado") },
        { valor: "comprado", etiqueta: "Comprados", cantidad: contar("comprado") },
    ];

    const visibles = productos.filter((p) => {
        if (!limpiar(p.nombre).includes(limpiar(busqueda))) return false;
        return filtro === "todos" || p.tipo === filtro;
    });

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <BarraAcciones
                busqueda={busqueda}
                onBusqueda={setBusqueda}
                placeholder="Buscar producto..."
                textoBoton="Nuevo"
                onBoton={() => setPanelAbierto(true)}
            />
            <Filtros opciones={opcionesFiltro} valor={filtro} onCambio={setFiltro} />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.tabla}>
                <View style={styles.cabecera}>
                    <Text style={[styles.cabeceraTexto, { flex: 2.2 }]}>Producto</Text>
                    <Text style={[styles.cabeceraTexto, { flex: 1.2, textAlign: "right" }]}>Precio</Text>
                    <Text style={[styles.cabeceraTexto, { flex: 1.2, textAlign: "right" }]}>Costo</Text>
                </View>

                {visibles.length === 0 ? (
                    <Text style={styles.vacio}>No hay productos para mostrar</Text>
                ) : (
                    visibles.map((p) => (
                        <View key={p.id} style={styles.bloque}>
                            <Pressable
                                style={styles.fila}
                                onPress={() => {
                                    setAbierto(abierto === p.id ? "" : p.id);
                                    setPrecioNuevo("");
                                    setConfirmando("");
                                }}
                            >
                                <View style={{ flex: 2.2, alignItems: "flex-start" }}>
                                    <Text style={styles.nombre}>{p.nombre}</Text>
                                    <View style={{ marginTop: 4 }}>
                                        <Badge
                                            texto={p.tipo === "preparado" ? "Preparado" : "Comprado"}
                                            tono="neutro"
                                        />
                                    </View>
                                </View>
                                <Text style={[styles.precio, { flex: 1.2 }]}>{pesos(p.precio_venta)}</Text>
                                <Text style={[styles.costo, { flex: 1.2 }]}>
                                    {costos[p.id] !== undefined ? pesos(costos[p.id]) : "—"}
                                </Text>
                            </Pressable>

                            {abierto === p.id ? (
                                <View style={styles.detalleAbierto}>
                                    <Text style={styles.subtitulo}>Receta</Text>
                                    {recetas
                                        .filter((r) => r.producto_id === p.id)
                                        .map((r, i) => (
                                            <View key={i} style={styles.filaReceta}>
                                                <Text style={styles.recetaTexto}>
                                                    {materiales[r.material_id]?.nombre ?? "—"}
                                                </Text>
                                                <Text style={styles.recetaTexto}>
                                                    {Number(r.cantidad)} {materiales[r.material_id]?.unidad ?? ""}
                                                </Text>
                                            </View>
                                        ))}

                                    <Text style={styles.subtitulo}>Cambiar precio de venta</Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nuevo precio"
                                        value={precioNuevo}
                                        onChangeText={setPrecioNuevo}
                                        keyboardType="numeric"
                                    />
                                    <Pressable
                                        style={styles.botonOscuro}
                                        onPress={() => cambiarPrecio(p.id)}
                                    >
                                        <Text style={styles.botonOscuroTexto}>Guardar precio</Text>
                                    </Pressable>

                                    {confirmando === p.id ? (
                                        <View>
                                            <Text style={styles.aviso}>
                                                El producto dejará de aparecer en las listas, pero tus
                                                pedidos anteriores se conservan. ¿Seguro?
                                            </Text>
                                            <View style={styles.botones}>
                                                <Pressable
                                                    style={styles.botonPeligro}
                                                    onPress={() => desactivar(p.id)}
                                                >
                                                    <Text style={styles.botonPeligroTexto}>Sí, quitar</Text>
                                                </Pressable>
                                                <Pressable
                                                    style={styles.botonNeutro}
                                                    onPress={() => setConfirmando("")}
                                                >
                                                    <Text style={styles.botonNeutroTexto}>No</Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                    ) : (
                                        <Pressable
                                            style={styles.botonEliminar}
                                            onPress={() => setConfirmando(p.id)}
                                        >
                                            <Text style={styles.botonEliminarTexto}>Quitar producto</Text>
                                        </Pressable>
                                    )}
                                </View>
                            ) : null}
                        </View>
                    ))
                )}
            </View>

            <Panel
                visible={panelAbierto}
                titulo="Nuevo producto"
                onCerrar={() => setPanelAbierto(false)}
            >
                <NuevoProducto onGuardado={alGuardar} />
            </Panel>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16 },
    error: { color: "#E63946", marginTop: 12, textAlign: "center" },
    tabla: {
        backgroundColor: "white",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#E7E5E4",
        marginTop: 14,
        overflow: "hidden",
    },
    cabecera: {
        flexDirection: "row",
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: "#F5F5F4",
    },
    cabeceraTexto: { fontSize: 12, fontWeight: "bold", color: "#78716C" },
    vacio: { padding: 20, textAlign: "center", color: "#78716C" },
    bloque: { borderTopWidth: 1, borderTopColor: "#F5F5F4" },
    fila: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    nombre: { fontSize: 15, fontWeight: "bold", color: "#1C1917" },
    precio: { fontSize: 15, fontWeight: "bold", color: "#1C1917", textAlign: "right" },
    costo: { fontSize: 14, color: "#78716C", textAlign: "right" },
    detalleAbierto: {
        paddingHorizontal: 14,
        paddingBottom: 14,
        backgroundColor: "#FAFAF9",
    },
    subtitulo: { fontSize: 13, fontWeight: "bold", color: "#78716C", marginTop: 14 },
    filaReceta: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 5,
    },
    recetaTexto: { fontSize: 14, color: "#1C1917" },
    input: {
        backgroundColor: "white",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E7E5E4",
        padding: 12,
        marginTop: 8,
        fontSize: 16,
    },
    botonOscuro: {
        backgroundColor: "#1C1917",
        borderRadius: 12,
        padding: 12,
        marginTop: 10,
        alignItems: "center",
    },
    botonOscuroTexto: { color: "#FAFAF9", fontWeight: "bold" },
    aviso: { fontSize: 13, color: "#78716C", marginTop: 14 },
    botones: { flexDirection: "row", gap: 10, marginTop: 10 },
    botonPeligro: {
        flex: 1,
        backgroundColor: "#E63946",
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
    },
    botonPeligroTexto: { color: "#FFFFFF", fontWeight: "bold" },
    botonNeutro: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E7E5E4",
        backgroundColor: "white",
        padding: 12,
        alignItems: "center",
    },
    botonNeutroTexto: { color: "#1C1917", fontWeight: "bold" },
    botonEliminar: {
        marginTop: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E63946",
        padding: 12,
        alignItems: "center",
    },
    botonEliminarTexto: { color: "#E63946", fontWeight: "bold" },
});