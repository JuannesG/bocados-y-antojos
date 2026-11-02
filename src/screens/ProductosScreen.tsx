import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { supabase } from "../lib/supabase";
import { pesos, limpiar } from "../lib/formato";
import Badge from "../components/Badge";
import Panel from "../components/Panel";
import BarraAcciones from "../components/BarraAcciones";
import BarraFiltros from "../components/BarraFiltros";
import NuevoProducto from "../components/NuevoProducto";
import { comunes } from "../styles/comunes";
import { styles } from "../styles/Productos.styles";

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
    const [editando, setEditando] = useState("");
    const [abierto, setAbierto] = useState("");
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
        setEditando("");
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
            <BarraFiltros
                grupos={[
                    {
                        clave: "tipo",
                        titulo: "Tipo de producto",
                        opciones: opcionesFiltro,
                        valor: filtro,
                        porDefecto: "todos",
                        onCambio: setFiltro,
                    },
                ]}
            />

            {error ? <Text style={comunes.error}>{error}</Text> : null}

            <View style={comunes.tabla}>
                <View style={comunes.cabecera}>
                    <Text style={[comunes.cabeceraTexto, { flex: 2.2 }]}>Producto</Text>
                    <Text style={[comunes.cabeceraTexto, { flex: 1.2, textAlign: "right" }]}>Precio</Text>
                    <Text style={[comunes.cabeceraTexto, { flex: 1.2, textAlign: "right" }]}>Costo</Text>
                </View>

                {visibles.length === 0 ? (
                    <Text style={comunes.vacio}>No hay productos para mostrar</Text>
                ) : (
                    visibles.map((p) => (
                        <View key={p.id} style={styles.bloque}>
                            <Pressable
                                style={styles.fila}
                                onPress={() => {
                                    setAbierto(abierto === p.id ? "" : p.id);
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

                                    <Pressable
                                        style={comunes.botonOscuro}
                                        onPress={() => setEditando(p.id)}
                                    >
                                        <Text style={comunes.botonOscuroTexto}>Editar producto</Text>
                                    </Pressable>

                                    {confirmando === p.id ? (
                                        <View>
                                            <Text style={styles.aviso}>
                                                El producto dejará de aparecer en las listas, pero tus
                                                pedidos anteriores se conservan. ¿Seguro?
                                            </Text>
                                            <View style={styles.botones}>
                                                <Pressable
                                                    style={comunes.botonPeligro}
                                                    onPress={() => desactivar(p.id)}
                                                >
                                                    <Text style={comunes.botonPeligroTexto}>Sí, quitar</Text>
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
                                            onPress={() => setConfirmando(p.id)}
                                        >
                                            <Text style={comunes.botonContornoTexto}>Quitar producto</Text>
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
                {panelAbierto ? <NuevoProducto onGuardado={alGuardar} /> : null}
            </Panel>

            <Panel
                visible={editando !== ""}
                titulo="Editar producto"
                onCerrar={() => setEditando("")}
            >
                {editando !== "" ? (
                    <NuevoProducto productoId={editando} onGuardado={alGuardar} />
                ) : null}
            </Panel>
        </ScrollView>
    );
}