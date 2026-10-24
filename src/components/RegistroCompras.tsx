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
import { pesos, hoy } from "../lib/formato";

type Material = { id: string; nombre: string; unidad: string };
type Factura = {
    id: string;
    fecha: string;
    proveedor: string;
    observacion: string;
};
type ItemFactura = {
    factura_id: string;
    material_id: string;
    cantidad: number;
    unidad_compra: string;
    total: number;
};
type Linea = {
    materialId: string;
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

export default function RegistroCompras() {
    const [materiales, setMateriales] = useState<Material[]>([]);
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [items, setItems] = useState<ItemFactura[]>([]);
    const [abierta, setAbierta] = useState("");

    const [fecha, setFecha] = useState(hoy());
    const [proveedor, setProveedor] = useState("");
    const [observacion, setObservacion] = useState("");

    const [materialId, setMaterialId] = useState("");
    const [unidadElegida, setUnidadElegida] = useState("");
    const [cantidad, setCantidad] = useState("");
    const [totalPagado, setTotalPagado] = useState("");

    const [lineas, setLineas] = useState<Linea[]>([]);
    const [error, setError] = useState("");

    async function cargar() {
        const { data: mats } = await supabase
            .from("materiales")
            .select("id, nombre, unidad")
            .order("nombre");

        const { data: facs } = await supabase
            .from("facturas")
            .select("id, fecha, proveedor, observacion")
            .order("fecha", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(20);

        const ids = (facs ?? []).map((f) => f.id);
        let detalle: ItemFactura[] = [];
        if (ids.length > 0) {
            const { data } = await supabase
                .from("compras")
                .select("factura_id, material_id, cantidad, unidad_compra, total")
                .in("factura_id", ids);
            detalle = data ?? [];
        }

        setMateriales(mats ?? []);
        setFacturas(facs ?? []);
        setItems(detalle);
    }

    useEffect(() => {
        cargar();
    }, []);

    const cant = Number(cantidad.replace(",", "."));
    const pagado = Number(totalPagado.replace(",", "."));

    const materialElegido = materiales.find((m) => m.id === materialId);
    const opciones = materialElegido ? unidadesDeCompra(materialElegido.unidad) : [];
    const opcion = opciones.find((o) => o.valor === unidadElegida);
    const nombreUnidad = opcion ? opcion.etiqueta : materialElegido?.unidad ?? "";
    const totalFactura = lineas.reduce((suma, l) => suma + l.totalPagado, 0);

    function nombreMaterial(id: string) {
        return materiales.find((m) => m.id === id)?.nombre ?? "—";
    }
    function unidadMaterial(id: string) {
        return materiales.find((m) => m.id === id)?.unidad ?? "";
    }
    function totalDe(facturaId: string) {
        return items
            .filter((i) => i.factura_id === facturaId)
            .reduce((suma, i) => suma + Number(i.total), 0);
    }

    function elegirMaterial(id: string) {
        setMaterialId(id);
        const m = materiales.find((x) => x.id === id);
        setUnidadElegida(m ? m.unidad : "");
    }

    function agregarLinea() {
        if (!materialElegido) {
            setError("Elige un material");
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
                materialId: materialElegido.id,
                cantidad: cant,
                unidadCompra: opcion ? opcion.valor : materialElegido.unidad,
                equivalencia: opcion ? opcion.equivalencia : 1,
                totalPagado: pagado,
            },
        ]);

        setMaterialId("");
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

        const { error: fallo } = await supabase.from("compras").insert(
            lineas.map((l) => ({
                factura_id: factura.id,
                fecha,
                material_id: l.materialId,
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

        setLineas([]);
        setProveedor("");
        setObservacion("");
        setFecha(hoy());
        cargar();
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.subtitulo}>Datos de la factura</Text>
            <TextInput
                style={styles.input}
                placeholder="Fecha (AAAA-MM-DD)"
                value={fecha}
                onChangeText={setFecha}
            />
            <TextInput
                style={styles.input}
                placeholder="Lugar o proveedor (obligatorio)"
                value={proveedor}
                onChangeText={setProveedor}
            />
            <TextInput
                style={styles.input}
                placeholder="Observación (obligatoria)"
                value={observacion}
                onChangeText={setObservacion}
            />

            <Text style={styles.subtitulo}>Lo que compraste</Text>
            <Selector
                valor={materialId}
                onCambio={elegirMaterial}
                placeholder="Elige un material"
                opciones={materiales.map((m) => ({ valor: m.id, etiqueta: m.nombre }))}
            />

            {opciones.length > 0 ? (
                <View style={styles.chips}>
                    {opciones.map((o) => (
                        <Pressable
                            key={o.valor}
                            style={[styles.chip, o.valor === unidadElegida && styles.chipActivo]}
                            onPress={() => setUnidadElegida(o.valor)}
                        >
                            <Text style={styles.chipTexto}>{o.etiqueta}</Text>
                        </Pressable>
                    ))}
                </View>
            ) : null}

            <TextInput
                style={styles.input}
                placeholder={
                    materialElegido ? `Cantidad (en ${nombreUnidad})` : "Cantidad"
                }
                value={cantidad}
                onChangeText={setCantidad}
                keyboardType="numeric"
            />
            <TextInput
                style={styles.input}
                placeholder="Total pagado por este producto"
                value={totalPagado}
                onChangeText={setTotalPagado}
                keyboardType="numeric"
            />

            <Pressable style={styles.botonSecundario} onPress={agregarLinea}>
                <Text style={styles.botonSecundarioTexto}>Agregar a la factura</Text>
            </Pressable>

            {lineas.map((l, posicion) => (
                <View key={posicion} style={styles.linea}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.nombre}>{nombreMaterial(l.materialId)}</Text>
                        <Text style={styles.detalle}>
                            {l.cantidad} {l.unidadCompra}
                            {l.equivalencia !== 1
                                ? ` · entran ${l.cantidad * l.equivalencia} ${unidadMaterial(l.materialId)}`
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

            <Pressable style={styles.boton} onPress={guardar}>
                <Text style={styles.botonTexto}>Guardar compra</Text>
            </Pressable>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={[styles.subtitulo, { marginTop: 32 }]}>Últimas compras</Text>
            {facturas.length === 0 ? (
                <Text style={styles.vacio}>Aún no hay compras</Text>
            ) : (
                facturas.map((f) => (
                    <Pressable
                        key={f.id}
                        style={styles.tarjeta}
                        onPress={() => setAbierta(abierta === f.id ? "" : f.id)}
                    >
                        <View style={styles.filaSuperior}>
                            <Text style={styles.nombre}>{f.proveedor}</Text>
                            <Text style={styles.total}>{pesos(totalDe(f.id))}</Text>
                        </View>
                        <Text style={styles.detalle}>{f.observacion}</Text>
                        <Text style={styles.detalle}>{f.fecha}</Text>

                        {abierta === f.id ? (
                            <View style={styles.detalleAbierto}>
                                {items
                                    .filter((i) => i.factura_id === f.id)
                                    .map((i, posicion) => (
                                        <View key={posicion} style={styles.filaDetalle}>
                                            <Text style={styles.detalleTexto}>
                                                {nombreMaterial(i.material_id)} · {Number(i.cantidad)}{" "}
                                                {i.unidad_compra}
                                            </Text>
                                            <Text style={styles.detalleTexto}>{pesos(i.total)}</Text>
                                        </View>
                                    ))}
                            </View>
                        ) : null}
                    </Pressable>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: "#FFF3E0" },
    subtitulo: { fontSize: 18, fontWeight: "bold", color: "#4E2E1E", marginTop: 12 },
    input: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
        fontSize: 16,
    },
    chips: { flexDirection: "row", marginTop: 12 },
    chip: {
        backgroundColor: "white",
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 8,
    },
    chipActivo: { backgroundColor: "#FF8A00" },
    chipTexto: { color: "#4E2E1E", fontWeight: "bold" },
    boton: {
        backgroundColor: "#FF8A00",
        borderRadius: 12,
        padding: 14,
        marginTop: 20,
        alignItems: "center",
    },
    botonTexto: { color: "#4E2E1E", fontSize: 16, fontWeight: "bold" },
    botonSecundario: {
        backgroundColor: "#4E2E1E",
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
        alignItems: "center",
    },
    botonSecundarioTexto: { color: "#FFF3E0", fontSize: 16, fontWeight: "bold" },
    linea: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
    },
    quitar: { color: "#E63946", fontSize: 18, paddingHorizontal: 8 },
    resumen: { marginTop: 16, color: "#4E2E1E", fontWeight: "bold", fontSize: 18 },
    error: { color: "#E63946", marginTop: 12, textAlign: "center" },
    vacio: { color: "#4E2E1E", textAlign: "center", marginTop: 12 },
    tarjeta: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 14,
        marginTop: 8,
    },
    filaSuperior: { flexDirection: "row", justifyContent: "space-between" },
    detalleAbierto: {
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#E5E5E5",
    },
    filaDetalle: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 4,
    },
    detalleTexto: { fontSize: 14, color: "#4E2E1E" },
    nombre: { fontSize: 16, color: "#4E2E1E", fontWeight: "bold" },
    detalle: { fontSize: 13, color: "#7A5A45", marginTop: 2 },
    total: { fontSize: 16, fontWeight: "bold", color: "#4E2E1E" },
});