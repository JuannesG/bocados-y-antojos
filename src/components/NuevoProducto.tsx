import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { supabase } from "../lib/supabase";
import Selector from "./Selector";
import { pesos } from "../lib/formato";
import { comunes } from "../styles/comunes";
import { styles } from "../styles/NuevoProducto.styles";

type Material = { id: string; nombre: string; unidad: string; categoria: string };
type Ingrediente = { materialId: string; cantidad: number };
type RecetaVieja = { material_id: string; cantidad: number };

type Props = { productoId?: string; onGuardado: () => void };

export default function NuevoProducto({ productoId, onGuardado }: Props) {
    const editando = productoId !== undefined;

    const [materiales, setMateriales] = useState<Material[]>([]);
    const [costoMaterial, setCostoMaterial] = useState<Record<string, number>>({});
    const [recetaVieja, setRecetaVieja] = useState<RecetaVieja[]>([]);

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

            if (productoId) {
                const { data: prod } = await supabase
                    .from("productos")
                    .select("nombre, tipo, precio_venta")
                    .eq("id", productoId)
                    .single();
                const { data: recs } = await supabase
                    .from("recetas")
                    .select("material_id, cantidad")
                    .eq("producto_id", productoId);

                if (prod) {
                    setNombre(prod.nombre);
                    setTipo(prod.tipo === "comprado" ? "comprado" : "preparado");
                    setPrecio(String(Number(prod.precio_venta)));
                }
                const lineas = recs ?? [];
                setRecetaVieja(lineas);
                if (prod?.tipo === "comprado") {
                    setMaterialId(lineas[0]?.material_id ?? "");
                } else {
                    setIngredientes(
                        lineas.map((r) => ({
                            materialId: r.material_id,
                            cantidad: Number(r.cantidad),
                        }))
                    );
                }
            }
        }
        cargar();
    }, [productoId]);

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

        if (editando && productoId) {
            const { error: falloProd } = await supabase
                .from("productos")
                .update({ nombre: nombre.trim(), precio_venta: prec })
                .eq("id", productoId);
            if (falloProd) {
                setError("No se pudieron guardar los cambios");
                return;
            }

            await supabase.from("recetas").delete().eq("producto_id", productoId);
            const { error: falloReceta } = await supabase.from("recetas").insert(
                receta.map((i) => ({
                    producto_id: productoId,
                    material_id: i.materialId,
                    cantidad: i.cantidad,
                }))
            );
            if (falloReceta) {
                await supabase.from("recetas").insert(
                    recetaVieja.map((r) => ({
                        producto_id: productoId,
                        material_id: r.material_id,
                        cantidad: r.cantidad,
                    }))
                );
                setError("No se pudo guardar la receta nueva; se dejó la anterior");
                return;
            }

            onGuardado();
            return;
        }

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
            <TextInput
                style={comunes.input}
                placeholder="Nombre del producto"
                placeholderTextColor="#A8A29E"
                value={nombre}
                onChangeText={setNombre}
            />

            {editando ? (
                <Text style={styles.nota}>
                    Tipo: {tipo === "preparado" ? "Preparado" : "Comprado hecho"} (no se puede
                    cambiar)
                </Text>
            ) : (
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
            )}

            <TextInput
                style={comunes.input}
                placeholder="Precio de venta (ej. 15000)"
                placeholderTextColor="#A8A29E"
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
                    <TextInput
                        style={comunes.input}
                        placeholder={
                            materialId
                                ? `Cantidad por unidad (en ${unidadMaterial(materialId)})`
                                : "Cantidad por unidad"
                        }
                        placeholderTextColor="#A8A29E"
                        value={cantidadIng}
                        onChangeText={setCantidadIng}
                        keyboardType="numeric"
                    />
                    <Pressable style={comunes.botonOscuro} onPress={anadirIngrediente}>
                        <Text style={comunes.botonOscuroTexto}>Agregar ingrediente</Text>
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

            <Pressable style={comunes.botonPrimario} onPress={guardar}>
                <Text style={comunes.botonPrimarioTexto}>
                    {editando ? "Guardar cambios" : "Guardar producto"}
                </Text>
            </Pressable>
            {error ? <Text style={comunes.error}>{error}</Text> : null}
        </View>
    );
}