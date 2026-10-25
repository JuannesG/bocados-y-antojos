import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import Selector from "./Selector";
import { pesos, hoy } from "../lib/formato";

type Material = { id: string; nombre: string; unidad: string };
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

type Props = { onGuardado: () => void };

export default function NuevaCompra({ onGuardado }: Props) {
    const [materiales, setMateriales] = useState<Material[]>([]);

    const [fecha, setFecha] = useState(hoy());
    const [proveedor, setProveedor] = useState("");
    const [observacion, setObservacion] = useState("");

    const [materialId, setMaterialId] = useState("");
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

        onGuardado();
    }

    return (
        <View>
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
                            <Text
                                style={[
                                    styles.chipTexto,
                                    o.valor === unidadElegida && styles.chipTextoActivo,
                                ]}
                            >
                                {o.etiqueta}
                            </Text>
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
        </View>
    );
}

const styles = StyleSheet.create({
    subtitulo: { fontSize: 16, fontWeight: "bold", color: "#1C1917", marginTop: 16 },
    input: {
        backgroundColor: "white",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E7E5E4",
        padding: 14,
        marginTop: 12,
        fontSize: 16,
    },
    chips: { flexDirection: "row", marginTop: 12 },
    chip: {
        backgroundColor: "white",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#E7E5E4",
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 8,
    },
    chipActivo: { backgroundColor: "#1C1917", borderColor: "#1C1917" },
    chipTexto: { color: "#1C1917", fontWeight: "bold" },
    chipTextoActivo: { color: "#FAFAF9" },
    boton: {
        backgroundColor: "#EA580C",
        borderRadius: 12,
        padding: 14,
        marginTop: 20,
        alignItems: "center",
    },
    botonTexto: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
    botonSecundario: {
        backgroundColor: "#1C1917",
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
        alignItems: "center",
    },
    botonSecundarioTexto: { color: "#FAFAF9", fontSize: 16, fontWeight: "bold" },
    linea: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E7E5E4",
        padding: 12,
        marginTop: 8,
    },
    quitar: { color: "#E63946", fontSize: 18, paddingHorizontal: 8 },
    resumen: { marginTop: 16, color: "#1C1917", fontWeight: "bold", fontSize: 18 },
    error: { color: "#E63946", marginTop: 12, textAlign: "center" },
    nombre: { fontSize: 16, color: "#1C1917", fontWeight: "bold" },
    detalle: { fontSize: 13, color: "#78716C", marginTop: 2 },
    total: { fontSize: 16, fontWeight: "bold", color: "#1C1917" },
});