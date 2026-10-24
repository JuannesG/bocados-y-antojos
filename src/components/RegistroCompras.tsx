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

type Material = { id: string; nombre: string; unidad: string };
type Compra = {
    id: number;
    fecha: string;
    material_id: string;
    cantidad: number;
    unidad_compra: string;
    total: number;
};

const pesos = (n: number) => "$" + Number(n).toLocaleString("es-CO");

export default function RegistroCompras() {
    const [materiales, setMateriales] = useState<Material[]>([]);
    const [compras, setCompras] = useState<Compra[]>([]);
    const [materialId, setMaterialId] = useState("");
    const [cantidad, setCantidad] = useState("");
    const [unidadCompra, setUnidadCompra] = useState("unidad");
    const [equivalencia, setEquivalencia] = useState("1");
    const [precio, setPrecio] = useState("");
    const [proveedor, setProveedor] = useState("");
    const [observacion, setObservacion] = useState("");
    const [error, setError] = useState("");

    async function cargar() {
        const { data: mats } = await supabase
            .from("materiales")
            .select("id, nombre, unidad")
            .order("nombre");

        const { data: comps } = await supabase
            .from("compras")
            .select("id, fecha, material_id, cantidad, unidad_compra, total")
            .order("fecha", { ascending: false })
            .order("id", { ascending: false })
            .limit(20);

        setMateriales(mats ?? []);
        setCompras(comps ?? []);
    }

    useEffect(() => {
        cargar();
    }, []);

    const cant = Number(cantidad.replace(",", "."));
    const prec = Number(precio.replace(",", "."));
    const equiv = Number(equivalencia.replace(",", "."));
    const materialElegido = materiales.find((m) => m.id === materialId);

    function nombreMaterial(id: string) {
        return materiales.find((m) => m.id === id)?.nombre ?? "—";
    }

    async function guardar() {
        if (!materialId) {
            setError("Elige un material");
            return;
        }
        if (!(cant > 0) || !(prec > 0) || !(equiv > 0)) {
            setError("Cantidad, precio y equivalencia deben ser mayores a 0");
            return;
        }
        setError("");

        const { error: fallo } = await supabase.from("compras").insert({
            material_id: materialId,
            cantidad: cant,
            precio_unitario: prec,
            unidad_compra: unidadCompra.trim() || "unidad",
            equivalencia: equiv,
            proveedor: proveedor.trim() || null,
            observacion: observacion.trim() || null,
        });

        if (fallo) {
            setError("No se pudo guardar la compra");
            return;
        }

        setCantidad("");
        setPrecio("");
        setProveedor("");
        setObservacion("");
        setUnidadCompra("unidad");
        setEquivalencia("1");
        cargar();
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.etiqueta}>Material</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {materiales.map((m) => (
                    <Pressable
                        key={m.id}
                        style={[styles.chip, m.id === materialId && styles.chipActivo]}
                        onPress={() => setMaterialId(m.id)}
                    >
                        <Text
                            style={[styles.chipTexto, m.id === materialId && styles.chipTextoActivo]}
                        >
                            {m.nombre}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            <TextInput
                style={styles.input}
                placeholder="Cantidad comprada (ej. 3)"
                value={cantidad}
                onChangeText={setCantidad}
                keyboardType="numeric"
            />
            <TextInput
                style={styles.input}
                placeholder="Unidad de compra (ej. paquete, kg, bandeja)"
                value={unidadCompra}
                onChangeText={setUnidadCompra}
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder={
                    materialElegido
                        ? `Cuántas ${materialElegido.unidad} trae cada ${unidadCompra || "unidad"}`
                        : "Equivalencia"
                }
                value={equivalencia}
                onChangeText={setEquivalencia}
                keyboardType="numeric"
            />
            <TextInput
                style={styles.input}
                placeholder="Precio por cada unidad de compra"
                value={precio}
                onChangeText={setPrecio}
                keyboardType="numeric"
            />
            <TextInput
                style={styles.input}
                placeholder="Proveedor (opcional)"
                value={proveedor}
                onChangeText={setProveedor}
            />
            <TextInput
                style={styles.input}
                placeholder="Observación (opcional)"
                value={observacion}
                onChangeText={setObservacion}
            />

            {cant > 0 && prec > 0 ? (
                <Text style={styles.resumen}>
                    Total: {pesos(cant * prec)}
                    {equiv > 0 && materialElegido
                        ? ` · entran ${cant * equiv} ${materialElegido.unidad}`
                        : ""}
                </Text>
            ) : null}

            <Pressable style={styles.boton} onPress={guardar}>
                <Text style={styles.botonTexto}>Guardar compra</Text>
            </Pressable>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.subtitulo}>Últimas compras</Text>
            {compras.length === 0 ? (
                <Text style={styles.vacio}>Aún no hay compras</Text>
            ) : (
                compras.map((c) => (
                    <View key={c.id} style={styles.fila}>
                        <View>
                            <Text style={styles.nombre}>{nombreMaterial(c.material_id)}</Text>
                            <Text style={styles.detalle}>
                                {c.fecha} · {Number(c.cantidad)} {c.unidad_compra}
                            </Text>
                        </View>
                        <Text style={styles.total}>{pesos(c.total)}</Text>
                    </View>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, backgroundColor: "#FFF3E0" },
    etiqueta: { fontSize: 14, color: "#4E2E1E", marginBottom: 8 },
    chip: {
        backgroundColor: "white",
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 14,
        marginRight: 8,
    },
    chipActivo: { backgroundColor: "#FF8A00" },
    chipTexto: { color: "#4E2E1E" },
    chipTextoActivo: { fontWeight: "bold" },
    input: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
        fontSize: 16,
    },
    resumen: { marginTop: 16, color: "#4E2E1E", fontWeight: "bold" },
    boton: {
        backgroundColor: "#FF8A00",
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
        alignItems: "center",
    },
    botonTexto: { color: "#4E2E1E", fontSize: 16, fontWeight: "bold" },
    error: { color: "#E63946", marginTop: 12, textAlign: "center" },
    subtitulo: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#4E2E1E",
        marginTop: 28,
        marginBottom: 12,
    },
    vacio: { color: "#4E2E1E", textAlign: "center" },
    fila: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
    },
    nombre: { fontSize: 16, color: "#4E2E1E" },
    detalle: { fontSize: 13, color: "#7A5A45", marginTop: 2 },
    total: { fontSize: 16, fontWeight: "bold", color: "#4E2E1E" },
});