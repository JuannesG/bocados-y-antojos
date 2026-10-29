import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import Selector from "./Selector";
import { pesos } from "../lib/formato";

type Material = { id: string; nombre: string; unidad: string; categoria: string };
type Ingrediente = { materialId: string; cantidad: number };

type Props = { onGuardado: () => void };

export default function NuevoProducto({ onGuardado }: Props) {
    const [materiales, setMateriales] = useState<Material[]>([]);
    const [costoMaterial, setCostoMaterial] = useState<Record<string, number>>({});

    const [nombre, setNombre] = useState("");
    const [tipo, setTipo] = useState<"preparado" | "comprado">("preparado");
    const [precio, setPrecio] = useState("");
    const [materialId, setMaterialId] = useState("");
    const [cantidadIng, setCantidadIng] = useState("");
    const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
    const [error, setError] = useState("");

    useEffect(() => {
        async function cargar() {
            const [mats, costos] = await Promise.all([
                supabase
                    .from("materiales")
                    .select("id, nombre, unidad, categoria")
                    .order("nombre"),
                supabase.from("costo_material").select("material_id, costo_promedio"),
            ]);
            setMateriales(mats.data ?? []);

            const cm: Record<string, number> = {};
            (costos.data ?? []).forEach((f) => {
                cm[f.material_id] = Number(f.costo_promedio);
            });
            setCostoMaterial(cm);
        }
        cargar();
    }, []);

    const prec = Number(precio.replace(",", "."));
    const cantIng = Number(cantidadIng.replace(",", "."));

    function nombreMaterial(id: string) {
        return materiales.find((x) => x.id === id)?.nombre ?? "—";
    }
    function unidadMaterial(id: string) {
        return materiales.find((x) => x.id === id)?.unidad ?? "";
    }

    const receta: Ingrediente[] =
        tipo === "comprado"
            ? materialId
                ? [{ materialId, cantidad: 1 }]
                : []
            : ingredientes;

    const costoEstimado = receta.reduce(
        (suma, i) => suma + i.cantidad * (costoMaterial[i.materialId] ?? 0),
        0
    );

    const opcionesComprado = materiales
        .filter((m) => m.categoria === "comprado")
        .map((m) => ({ valor: m.id, etiqueta: m.nombre }));

    const opcionesIngredientes = materiales
        .filter((m) => m.categoria === "ingrediente")
        .map((m) => ({ valor: m.id, etiqueta: m.nombre }));

    function cambiarTipo(nuevo: "preparado" | "comprado") {
        setTipo(nuevo);
        setMaterialId("");
        setCantidadIng("");
        setIngredientes([]);
    }

    function anadirIngrediente() {
        if (!materialId) {
            setError("Elige un material");
            return;
        }
        if (!(cantIng > 0)) {
            setError("La cantidad debe ser mayor a 0");
            return;
        }
        if (ingredientes.some((i) => i.materialId === materialId)) {
            setError("Ese material ya está en la receta");
            return;
        }
        setError("");
        setIngredientes([...ingredientes, { materialId, cantidad: cantIng }]);
        setMaterialId("");
        setCantidadIng("");
    }

    function quitarIngrediente(id: string) {
        setIngredientes(ingredientes.filter((i) => i.materialId !== id));
    }

    async function guardar() {
        if (!nombre.trim()) {
            setError("Escribe el nombre del producto");
            return;
        }
        if (!(prec > 0)) {
            setError("Escribe un precio de venta mayor a 0");
            return;
        }
        if (receta.length === 0) {
            setError("Añade la receta del producto");
            return;
        }
        setError("");

        const { data: nuevo, error: fallo } = await supabase
            .from("productos")
            .insert({ nombre: nombre.trim(), tipo, precio_venta: prec })
            .select("id")
            .single();

        if (fallo || !nuevo) {
            setError("No se pudo guardar el producto");
            return;
        }

        const { error: falloReceta } = await supabase.from("recetas").insert(
            receta.map((i) => ({
                producto_id: nuevo.id,
                material_id: i.materialId,
                cantidad: i.cantidad,
            }))
        );

        if (falloReceta) {
            await supabase.from("productos").delete().eq("id", nuevo.id);
            setError("No se pudo guardar la receta");
            return;
        }

        onGuardado();
    }

    return (
        <View>
            <TextInput placeholderTextColor="#A8A29E"
                style={styles.input}
                placeholder="Nombre del producto"
                value={nombre}
                onChangeText={setNombre}
            />

            <View style={styles.selector}>
                <Pressable
                    style={[styles.opcion, tipo === "preparado" && styles.opcionActiva]}
                    onPress={() => cambiarTipo("preparado")}
                >
                    <Text style={[styles.opcionTexto, tipo === "preparado" && styles.opcionTextoActivo]}>
                        Preparado
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.opcion, tipo === "comprado" && styles.opcionActiva]}
                    onPress={() => cambiarTipo("comprado")}
                >
                    <Text style={[styles.opcionTexto, tipo === "comprado" && styles.opcionTextoActivo]}>
                        Comprado hecho
                    </Text>
                </Pressable>
            </View>

            <TextInput placeholderTextColor="#A8A29E"
                style={styles.input}
                placeholder="Precio de venta (ej. 15000)"
                value={precio}
                onChangeText={setPrecio}
                keyboardType="numeric"
            />

            {tipo === "comprado" ? (
                <>
                    <Text style={styles.etiqueta}>Material que compras hecho</Text>
                    <Selector
                        valor={materialId}
                        onCambio={setMaterialId}
                        placeholder="Elige el material (ej. bandeja)"
                        opciones={opcionesComprado}
                    />
                </>
            ) : (
                <>
                    <Text style={styles.etiqueta}>Ingredientes de la receta</Text>
                    <Selector
                        valor={materialId}
                        onCambio={setMaterialId}
                        placeholder="Elige un ingrediente"
                        opciones={opcionesIngredientes}
                    />
                    <TextInput placeholderTextColor="#A8A29E"
                        style={styles.input}
                        placeholder={
                            materialId
                                ? `Cantidad por unidad (en ${unidadMaterial(materialId)})`
                                : "Cantidad por unidad"
                        }
                        value={cantidadIng}
                        onChangeText={setCantidadIng}
                        keyboardType="numeric"
                    />
                    <Pressable style={styles.botonSecundario} onPress={anadirIngrediente}>
                        <Text style={styles.botonSecundarioTexto}>Agregar ingrediente</Text>
                    </Pressable>

                    {ingredientes.map((i) => (
                        <View key={i.materialId} style={styles.ingrediente}>
                            <Text style={styles.nombre}>
                                {nombreMaterial(i.materialId)}: {i.cantidad}{" "}
                                {unidadMaterial(i.materialId)}
                            </Text>
                            <Pressable onPress={() => quitarIngrediente(i.materialId)}>
                                <Text style={styles.quitar}>✕</Text>
                            </Pressable>
                        </View>
                    ))}
                </>
            )}

            {receta.length > 0 ? (
                <Text style={styles.resumen}>
                    Costo estimado por unidad: {pesos(costoEstimado)}
                </Text>
            ) : null}

            <Pressable style={styles.boton} onPress={guardar}>
                <Text style={styles.botonTexto}>Guardar producto</Text>
            </Pressable>
            {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    input: {
        backgroundColor: "white",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E7E5E4",
        padding: 14,
        marginTop: 12,
        fontSize: 16,
    },
    selector: {
        flexDirection: "row",
        marginTop: 12,
        backgroundColor: "white",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E7E5E4",
        padding: 4,
    },
    opcion: { flex: 1, padding: 10, borderRadius: 10, alignItems: "center" },
    opcionActiva: { backgroundColor: "#1C1917" },
    opcionTexto: { color: "#1C1917", fontWeight: "bold" },
    opcionTextoActivo: { color: "#FAFAF9" },
    etiqueta: { fontSize: 14, color: "#1C1917", marginTop: 20 },
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
        marginTop: 12,
        alignItems: "center",
    },
    botonSecundarioTexto: { color: "#FAFAF9", fontSize: 16, fontWeight: "bold" },
    ingrediente: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "white",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E7E5E4",
        padding: 12,
        marginTop: 8,
    },
    nombre: { fontSize: 15, color: "#1C1917" },
    quitar: { color: "#E63946", fontSize: 18, paddingHorizontal: 8 },
    resumen: { marginTop: 16, color: "#1C1917", fontWeight: "bold" },
    error: { color: "#E63946", marginTop: 12, textAlign: "center" },
});