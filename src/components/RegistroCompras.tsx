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
type Compra = {
    id: number;
    fecha: string;
    material_id: string;
    cantidad: number;
    unidad_compra: string;
    total: number;
    proveedor: string | null;
};
type Linea = {
    materialId: string;
    cantidad: number;
    precio: number;
    unidadCompra: string;
    equivalencia: number;
};

export default function RegistroCompras() {
    const [materiales, setMateriales] = useState<Material[]>([]);
    const [compras, setCompras] = useState<Compra[]>([]);

    const [fecha, setFecha] = useState(hoy());
    const [proveedor, setProveedor] = useState("");
    const [observacion, setObservacion] = useState("");

    const [materialId, setMaterialId] = useState("");
    const [cantidad, setCantidad] = useState("");
    const [precio, setPrecio] = useState("");
    const [porEmpaque, setPorEmpaque] = useState(false);
    const [unidadCompra, setUnidadCompra] = useState("");
    const [equivalencia, setEquivalencia] = useState("");

    const [lineas, setLineas] = useState<Linea[]>([]);
    const [error, setError] = useState("");

    async function cargar() {
        const { data: mats } = await supabase
            .from("materiales")
            .select("id, nombre, unidad")
            .order("nombre");

        const { data: comps } = await supabase
            .from("compras")
            .select("id, fecha, material_id, cantidad, unidad_compra, total, proveedor")
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
    const totalCompra = lineas.reduce((suma, l) => suma + l.cantidad * l.precio, 0);

    function nombreMaterial(id: string) {
        return materiales.find((m) => m.id === id)?.nombre ?? "—";
    }
    function unidadMaterial(id: string) {
        return materiales.find((m) => m.id === id)?.unidad ?? "";
    }

    function agregarLinea() {
        if (!materialElegido) {
            setError("Elige un material");
            return;
        }
        if (!(cant > 0) || !(prec > 0)) {
            setError("La cantidad y el precio deben ser mayores a 0");
            return;
        }
        if (porEmpaque && !(equiv > 0)) {
            setError("Escribe cuántas unidades trae cada empaque");
            return;
        }
        setError("");

        setLineas([
            ...lineas,
            {
                materialId: materialElegido.id,
                cantidad: cant,
                precio: prec,
                unidadCompra: porEmpaque
                    ? unidadCompra.trim() || "paquete"
                    : materialElegido.unidad,
                equivalencia: porEmpaque ? equiv : 1,
            },
        ]);

        setMaterialId("");
        setCantidad("");
        setPrecio("");
        setPorEmpaque(false);
        setUnidadCompra("");
        setEquivalencia("");
    }

    function quitarLinea(posicion: number) {
        setLineas(lineas.filter((_, i) => i !== posicion));
    }

    async function guardar() {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            setError("La fecha debe tener el formato AAAA-MM-DD");
            return;
        }
        if (lineas.length === 0) {
            setError("Agrega al menos un material a la compra");
            return;
        }
        setError("");

        const { error: fallo } = await supabase.from("compras").insert(
            lineas.map((l) => ({
                fecha,
                material_id: l.materialId,
                cantidad: l.cantidad,
                precio_unitario: l.precio,
                unidad_compra: l.unidadCompra,
                equivalencia: l.equivalencia,
                proveedor: proveedor.trim() || null,
                observacion: observacion.trim() || null,
            }))
        );

        if (fallo) {
            setError("No se pudo guardar la compra");
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
            <Text style={styles.subtitulo}>Datos de la compra</Text>
            <TextInput
                style={styles.input}
                placeholder="Fecha (AAAA-MM-DD)"
                value={fecha}
                onChangeText={setFecha}
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

            <Text style={styles.subtitulo}>Materiales comprados</Text>
            <Selector
                valor={materialId}
                onCambio={setMaterialId}
                placeholder="Elige un material"
                opciones={materiales.map((m) => ({ valor: m.id, etiqueta: m.nombre }))}
            />
            <TextInput
                style={styles.input}
                placeholder={
                    materialElegido
                        ? `Cantidad (en ${porEmpaque ? unidadCompra || "empaques" : materialElegido.unidad})`
                        : "Cantidad"
                }
                value={cantidad}
                onChangeText={setCantidad}
                keyboardType="numeric"
            />
            <TextInput
                style={styles.input}
                placeholder={
                    porEmpaque ? "Precio de cada empaque" : "Precio de cada unidad"
                }
                value={precio}
                onChangeText={setPrecio}
                keyboardType="numeric"
            />

            <Pressable
                style={styles.enlace}
                onPress={() => setPorEmpaque(!porEmpaque)}
            >
                <Text style={styles.enlaceTexto}>
                    {porEmpaque ? "✓ Compro por paquete, kilo, etc." : "+ Compro por paquete, kilo, etc."}
                </Text>
            </Pressable>

            {porEmpaque ? (
                <View>
                    <TextInput
                        style={styles.input}
                        placeholder="Empaque (ej. paquete, kg, caja)"
                        value={unidadCompra}
                        onChangeText={setUnidadCompra}
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder={
                            materialElegido
                                ? `Cuántas ${materialElegido.unidad} trae cada ${unidadCompra || "empaque"}`
                                : "Cuántas unidades trae cada empaque"
                        }
                        value={equivalencia}
                        onChangeText={setEquivalencia}
                        keyboardType="numeric"
                    />
                </View>
            ) : null}

            <Pressable style={styles.botonSecundario} onPress={agregarLinea}>
                <Text style={styles.botonSecundarioTexto}>Agregar material</Text>
            </Pressable>

            {lineas.map((l, posicion) => (
                <View key={posicion} style={styles.linea}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.nombre}>{nombreMaterial(l.materialId)}</Text>
                        <Text style={styles.detalle}>
                            {l.cantidad} {l.unidadCompra} × {pesos(l.precio)}
                            {l.equivalencia !== 1
                                ? ` · entran ${l.cantidad * l.equivalencia} ${unidadMaterial(l.materialId)}`
                                : ""}
                        </Text>
                    </View>
                    <Text style={styles.total}>{pesos(l.cantidad * l.precio)}</Text>
                    <Pressable onPress={() => quitarLinea(posicion)}>
                        <Text style={styles.quitar}>✕</Text>
                    </Pressable>
                </View>
            ))}

            {lineas.length > 0 ? (
                <Text style={styles.resumen}>Total de la compra: {pesos(totalCompra)}</Text>
            ) : null}

            <Pressable style={styles.boton} onPress={guardar}>
                <Text style={styles.botonTexto}>Guardar compra</Text>
            </Pressable>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={[styles.subtitulo, { marginTop: 32 }]}>Últimas compras</Text>
            {compras.length === 0 ? (
                <Text style={styles.vacio}>Aún no hay compras</Text>
            ) : (
                compras.map((c) => (
                    <View key={c.id} style={styles.fila}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.nombre}>{nombreMaterial(c.material_id)}</Text>
                            <Text style={styles.detalle}>
                                {c.fecha} · {Number(c.cantidad)} {c.unidad_compra}
                                {c.proveedor ? ` · ${c.proveedor}` : ""}
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
    subtitulo: { fontSize: 18, fontWeight: "bold", color: "#4E2E1E", marginTop: 12 },
    input: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
        fontSize: 16,
    },
    enlace: { marginTop: 14 },
    enlaceTexto: { color: "#4E2E1E", fontWeight: "bold" },
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
    fila: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 12,
        padding: 14,
        marginTop: 8,
    },
    nombre: { fontSize: 16, color: "#4E2E1E" },
    detalle: { fontSize: 13, color: "#7A5A45", marginTop: 2 },
    total: { fontSize: 16, fontWeight: "bold", color: "#4E2E1E" },
});