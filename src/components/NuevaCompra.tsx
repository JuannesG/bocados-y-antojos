import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { supabase } from "../lib/supabase";
import { pesos, hoy, limpiar } from "../lib/formato";
import { comunes } from "../styles/comunes";
import { styles } from "../styles/NuevaCompra.styles";

type Material = { id: string; nombre: string; unidad: string };
type Nuevo = {
    nombre: string;
    unidad: string;
    categoria: "ingrediente" | "comprado";
};
type Linea = {
    materialId: string;
    nuevo: Nuevo | null;
    nombre: string;
    unidadBase: string;
    cantidad: number;
    unidadCompra: string;
    equivalencia: number;
    totalPagado: number;
};

type OpcionUnidad = { valor: string; etiqueta: string; equivalencia: number };

function unidadesDeCompra(unidad: string): OpcionUnidad[] {
    if (unidad === "g") {
        return [
            { valor: "g", etiqueta: "g", equivalencia: 1 },
            { valor: "libra", etiqueta: "libras", equivalencia: 500 },
            { valor: "kg", etiqueta: "kilos", equivalencia: 1000 },
        ];
    }
    if (unidad === "ml") {
        return [
            { valor: "ml", etiqueta: "ml", equivalencia: 1 },
            { valor: "litro", etiqueta: "litros", equivalencia: 1000 },
        ];
    }
    return [];
}

type Props = { onGuardado: () => void };

export default function NuevaCompra({ onGuardado }: Props) {
    const [materiales, setMateriales] = useState<Material[]>([]);

    const [fecha, setFecha] = useState(hoy());
    const [proveedor, setProveedor] = useState("");
    const [observacion, setObservacion] = useState("");

    const [busqueda, setBusqueda] = useState("");
    const [materialId, setMaterialId] = useState("");
    const [modoNuevo, setModoNuevo] = useState(false);
    const [nuevaUnidad, setNuevaUnidad] = useState("");
    const [nuevaCategoria, setNuevaCategoria] = useState<"ingrediente" | "comprado">("ingrediente");
    const [unidadElegida, setUnidadElegida] = useState("");
    const [cantidad, setCantidad] = useState("");
    const [totalPagado, setTotalPagado] = useState("");

    const [lineas, setLineas] = useState<Linea[]>([]);
    const [error, setError] = useState("");

    useEffect(() => {
        async function cargar() {
            const { data } = await supabase
                .from("materiales")
                .select("id, nombre, unidad")
                .order("nombre");
            setMateriales(data ?? []);
        }
        cargar();
    }, []);

    const cant = Number(cantidad.replace(",", "."));
    const pagado = Number(totalPagado.replace(",", "."));

    const texto = limpiar(busqueda);
    const materialElegido = materiales.find((m) => m.id === materialId);
    const coincidencias =
        texto && !materialElegido && !modoNuevo
            ? materiales.filter((m) => limpiar(m.nombre).includes(texto)).slice(0, 5)
            : [];
    const hayExacto = materiales.some((m) => limpiar(m.nombre) === texto);

    const unidadBase = modoNuevo
        ? nuevaUnidad.trim().toLowerCase()
        : materialElegido?.unidad ?? "";
    const opciones = unidadesDeCompra(unidadBase);
    const activa = unidadElegida || unidadBase;
    const opcion = opciones.find((o) => o.valor === activa);
    const nombreUnidad = opcion ? opcion.etiqueta : unidadBase;
    const listoParaCantidad = materialElegido !== undefined || modoNuevo;
    const totalFactura = lineas.reduce((suma, l) => suma + l.totalPagado, 0);

    function escribir(t: string) {
        setBusqueda(t);
        setMaterialId("");
        setModoNuevo(false);
        setUnidadElegida("");
    }

    function elegir(m: Material) {
        setMaterialId(m.id);
        setBusqueda(m.nombre);
        setModoNuevo(false);
        setUnidadElegida(m.unidad);
    }

    function agregarLinea() {
        const nombre = materialElegido ? materialElegido.nombre : busqueda.trim();
        if (!nombre) {
            setError("Escribe lo que compraste");
            return;
        }
        if (!materialElegido && !modoNuevo) {
            setError("Elige un material de la lista o crea uno nuevo");
            return;
        }
        if (modoNuevo && !unidadBase) {
            setError("Escribe la unidad del material nuevo");
            return;
        }
        if (!(cant > 0) || !(pagado > 0)) {
            setError("La cantidad y el total pagado deben ser mayores a 0");
            return;
        }
        setError("");

        setLineas([
            ...lineas,
            {
                materialId: materialElegido ? materialElegido.id : "",
                nuevo: modoNuevo
                    ? { nombre, unidad: unidadBase, categoria: nuevaCategoria }
                    : null,
                nombre,
                unidadBase,
                cantidad: cant,
                unidadCompra: opcion ? opcion.valor : unidadBase,
                equivalencia: opcion ? opcion.equivalencia : 1,
                totalPagado: pagado,
            },
        ]);

        setBusqueda("");
        setMaterialId("");
        setModoNuevo(false);
        setNuevaUnidad("");
        setNuevaCategoria("ingrediente");
        setUnidadElegida("");
        setCantidad("");
        setTotalPagado("");
    }

    function quitarLinea(posicion: number) {
        setLineas(lineas.filter((_, i) => i !== posicion));
    }

    async function guardar() {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            setError("La fecha debe tener el formato AAAA-MM-DD");
            return;
        }
        if (!proveedor.trim()) {
            setError("Escribe el lugar o proveedor");
            return;
        }
        if (!observacion.trim()) {
            setError("Escribe una observación");
            return;
        }
        if (lineas.length === 0) {
            setError("Agrega al menos un material a la compra");
            return;
        }
        setError("");

        const { data: factura, error: falloFactura } = await supabase
            .from("facturas")
            .insert({
                fecha,
                proveedor: proveedor.trim(),
                observacion: observacion.trim(),
            })
            .select("id")
            .single();

        if (falloFactura || !factura) {
            setError("No se pudo guardar la factura");
            return;
        }

        const idsNuevos: Record<string, string> = {};
        for (const l of lineas) {
            const nuevo = l.nuevo;
            if (!nuevo) continue;
            const clave = limpiar(nuevo.nombre);
            if (idsNuevos[clave]) continue;

            const existente = materiales.find((m) => limpiar(m.nombre) === clave);
            if (existente) {
                idsNuevos[clave] = existente.id;
                continue;
            }

            const { data, error: falloMaterial } = await supabase
                .from("materiales")
                .insert({
                    nombre: nuevo.nombre,
                    unidad: nuevo.unidad,
                    categoria: nuevo.categoria,
                })
                .select("id")
                .single();

            if (falloMaterial || !data) {
                await supabase.from("facturas").delete().eq("id", factura.id);
                setError(`No se pudo crear el material "${nuevo.nombre}"`);
                return;
            }
            idsNuevos[clave] = data.id;
        }

        const { error: fallo } = await supabase.from("compras").insert(
            lineas.map((l) => ({
                factura_id: factura.id,
                fecha,
                material_id: l.nuevo ? idsNuevos[limpiar(l.nuevo.nombre)] : l.materialId,
                cantidad: l.cantidad,
                precio_unitario: l.totalPagado / l.cantidad,
                unidad_compra: l.unidadCompra,
                equivalencia: l.equivalencia,
            }))
        );

        if (fallo) {
            await supabase.from("facturas").delete().eq("id", factura.id);
            setError("No se pudieron guardar los materiales de la compra");
            return;
        }

        onGuardado();
    }

    return (
        <View>
            <Text style={styles.subtitulo}>Datos de la factura</Text>
            <TextInput placeholderTextColor="#A8A29E"
                style={comunes.input}
                placeholder="Fecha (AAAA-MM-DD)"
                value={fecha}
                onChangeText={setFecha}
            />
            <TextInput placeholderTextColor="#A8A29E"
                style={comunes.input}
                placeholder="Lugar o proveedor (obligatorio)"
                value={proveedor}
                onChangeText={setProveedor}
            />
            <TextInput placeholderTextColor="#A8A29E"
                style={comunes.input}
                placeholder="Observación (obligatoria)"
                value={observacion}
                onChangeText={setObservacion}
            />

            <Text style={styles.subtitulo}>Lo que compraste</Text>
            <TextInput placeholderTextColor="#A8A29E"
                style={comunes.input}
                placeholder="Escribe lo que compraste (ej. lechuga)"
                value={busqueda}
                onChangeText={escribir}
            />

            {coincidencias.length > 0 || (texto && !materialElegido && !modoNuevo && !hayExacto) ? (
                <View style={styles.sugerencias}>
                    {coincidencias.map((m) => (
                        <Pressable key={m.id} style={styles.sugerencia} onPress={() => elegir(m)}>
                            <Text style={styles.sugerenciaTexto}>
                                {m.nombre} · {m.unidad}
                            </Text>
                        </Pressable>
                    ))}
                    {!hayExacto ? (
                        <Pressable
                            style={styles.sugerencia}
                            onPress={() => {
                                setModoNuevo(true);
                                setMaterialId("");
                            }}
                        >
                            <Text style={styles.crearTexto}>
                                + Crear «{busqueda.trim()}» como material nuevo
                            </Text>
                        </Pressable>
                    ) : null}
                </View>
            ) : null}

            {materialElegido ? (
                <Text style={styles.existe}>
                    ✓ Ya está en tu inventario ({materialElegido.unidad})
                </Text>
            ) : null}

            {modoNuevo ? (
                <View>
                    <Text style={styles.nuevoAviso}>
                        Material nuevo: se creará al guardar la compra.
                    </Text>
                    <TextInput placeholderTextColor="#A8A29E"
                        style={comunes.input}
                        placeholder="Unidad (unidad, g, ml, lonja...)"
                        value={nuevaUnidad}
                        onChangeText={setNuevaUnidad}
                        autoCapitalize="none"
                    />
                    <View style={styles.chips}>
                        <Pressable
                            style={[styles.chip, nuevaCategoria === "ingrediente" && styles.chipActivo]}
                            onPress={() => setNuevaCategoria("ingrediente")}
                        >
                            <Text
                                style={[
                                    styles.chipTexto,
                                    nuevaCategoria === "ingrediente" && styles.chipTextoActivo,
                                ]}
                            >
                                Ingrediente
                            </Text>
                        </Pressable>
                        <Pressable
                            style={[styles.chip, nuevaCategoria === "comprado" && styles.chipActivo]}
                            onPress={() => setNuevaCategoria("comprado")}
                        >
                            <Text
                                style={[
                                    styles.chipTexto,
                                    nuevaCategoria === "comprado" && styles.chipTextoActivo,
                                ]}
                            >
                                Comprado hecho
                            </Text>
                        </Pressable>
                    </View>
                </View>
            ) : null}

            {listoParaCantidad && opciones.length > 0 ? (
                <View style={styles.chips}>
                    {opciones.map((o) => (
                        <Pressable
                            key={o.valor}
                            style={[styles.chip, o.valor === activa && styles.chipActivo]}
                            onPress={() => setUnidadElegida(o.valor)}
                        >
                            <Text
                                style={[styles.chipTexto, o.valor === activa && styles.chipTextoActivo]}
                            >
                                {o.etiqueta}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            ) : null}

            <TextInput placeholderTextColor="#A8A29E"
                style={comunes.input}
                placeholder={
                    listoParaCantidad && nombreUnidad
                        ? `Cantidad (en ${nombreUnidad})`
                        : "Cantidad"
                }
                value={cantidad}
                onChangeText={setCantidad}
                keyboardType="numeric"
            />
            <TextInput placeholderTextColor="#A8A29E"
                style={comunes.input}
                placeholder="Total pagado por este producto"
                value={totalPagado}
                onChangeText={setTotalPagado}
                keyboardType="numeric"
            />

            <Pressable style={comunes.botonOscuro} onPress={agregarLinea}>
                <Text style={comunes.botonOscuroTexto}>Agregar a la factura</Text>
            </Pressable>

            {lineas.map((l, posicion) => (
                <View key={posicion} style={styles.linea}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.nombre}>
                            {l.nombre}
                            {l.nuevo ? " (nuevo)" : ""}
                        </Text>
                        <Text style={styles.detalle}>
                            {l.cantidad} {l.unidadCompra}
                            {l.equivalencia !== 1
                                ? ` · entran ${l.cantidad * l.equivalencia} ${l.unidadBase}`
                                : ""}
                        </Text>
                    </View>
                    <Text style={styles.total}>{pesos(l.totalPagado)}</Text>
                    <Pressable onPress={() => quitarLinea(posicion)}>
                        <Text style={styles.quitar}>✕</Text>
                    </Pressable>
                </View>
            ))}

            {lineas.length > 0 ? (
                <Text style={styles.resumen}>Total de la factura: {pesos(totalFactura)}</Text>
            ) : null}

            <Pressable style={comunes.botonPrimario} onPress={guardar}>
                <Text style={comunes.botonPrimarioTexto}>Guardar compra</Text>
            </Pressable>
            {error ? <Text style={comunes.error}>{error}</Text> : null}
        </View>
    );
}