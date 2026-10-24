import { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    FlatList,
    ActivityIndicator,
    StyleSheet,
} from "react-native";
import { supabase } from "../lib/supabase";

type Material = {
    material_id: string;
    nombre: string;
    unidad: string;
    stock_minimo: number;
    stock: number
}

export default function MaterialesScreen() {
    const [materiales, setMateriales] = useState<Material[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");
    const [nombre, setNombre] = useState("");
    const [unidad, setUnidad] = useState("");
    const [categoria, setCategoria] = useState<"ingrediente" | "comprado">("ingrediente");

    async function cargar() {
        const { data, error: fallo } = await supabase
            .from("inventario")
            .select("material_id, nombre, unidad, stock_minimo, stock")
            .order("nombre");

        if (fallo) {
            setError("No se pudieron cargar los materiales");
        } else {
            setMateriales(data ?? []);
        }
        setCargando(false);
    }

    useEffect(() => {
        cargar();
    }, []);

    async function agregar() {
        if (!nombre.trim() || !unidad.trim()) {
            setError("Escribe el nombre y la unidad");
            return;
        }
        setError("");

        const { error: fallo } = await supabase
            .from("materiales")
            .insert({
                nombre: nombre.trim(),
                unidad: unidad.trim().toLowerCase(),
                categoria,
            });

        if (fallo) {
            setError("No se pudo guardar el material");
            return;
        }

        setNombre("");
        setUnidad("");
        cargar();
    }

    return (
        <View style={styles.container}>
            <View style={styles.formulario}>
                <TextInput
                    style={styles.input}
                    placeholder="Nombre (ej. lechuga)"
                    value={nombre}
                    onChangeText={setNombre}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Unidad (ej. unidad, g, lonja)"
                    value={unidad}
                    onChangeText={setUnidad}
                    autoCapitalize="none"
                />
                <View style={styles.selector}>
                    <Pressable
                        style={[styles.opcion, categoria === "ingrediente" && styles.opcionActiva]}
                        onPress={() => setCategoria("ingrediente")}
                    >
                        <Text style={styles.opcionTexto}>Ingrediente</Text>
                    </Pressable>
                    <Pressable
                        style={[styles.opcion, categoria === "comprado" && styles.opcionActiva]}
                        onPress={() => setCategoria("comprado")}
                    >
                        <Text style={styles.opcionTexto}>Comprado hecho</Text>
                    </Pressable>
                </View>
                <Pressable style={styles.boton} onPress={agregar}>
                    <Text style={styles.botonTexto}>Añadir material</Text>
                </Pressable>
                {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>

            {cargando ? (
                <ActivityIndicator color="#FF8A00" style={{ marginTop: 24 }} />
            ) : (
                <FlatList
                    data={materiales}
                    keyExtractor={(item) => item.material_id}
                    ListEmptyComponent={
                        <Text style={styles.vacio}>Aún no hay materiales</Text>
                    }
                    renderItem={({ item }) => {
                        const stock = Number(item.stock);
                        const bajo = stock <= Number(item.stock_minimo);
                        return (
                            <View style={styles.fila}>
                                <Text style={styles.nombre}>{item.nombre}</Text>
                                <Text style={[styles.stock, bajo && styles.stockBajo]}>
                                    {stock} {item.unidad}
                                </Text>
                            </View>
                        );
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFF3E0", padding: 16 },
    formulario: { marginBottom: 16 },
    input: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
        fontSize: 16,
    },
    boton: {
        backgroundColor: "#FF8A00",
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
        alignItems: "center",
    },
    botonTexto: { color: "#4E2E1E", fontSize: 16, fontWeight: "bold" },
    error: { color: "#E63946", marginTop: 12, textAlign: "center" },
    vacio: { textAlign: "center", color: "#4E2E1E", marginTop: 24 },
    fila: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "white",
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
    },
    nombre: { fontSize: 16, color: "#4E2E1E" },
    stock: { fontSize: 16, fontWeight: "bold", color: "#4E2E1E" },
    stockBajo: { color: "#E63946" },
    selector: {
        flexDirection: "row",
        marginTop: 12,
        backgroundColor: "white",
        borderRadius: 12,
        padding: 4,
    },
    opcion: { flex: 1, padding: 10, borderRadius: 10, alignItems: "center" },
    opcionActiva: { backgroundColor: "#FF8A00" },
    opcionTexto: { color: "#4E2E1E", fontWeight: "bold" },
});