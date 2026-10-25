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
import { limpiar } from "../lib/formato";
import Badge from "../components/Badge";
import Panel from "../components/Panel";
import BarraAcciones from "../components/BarraAcciones";
import Filtros from "../components/Filtros";

type Fila = {
    material_id: string;
    nombre: string;
    unidad: string;
    stock_minimo: number;
    stock: number;
};

const esBajo = (m: Fila) => Number(m.stock) <= Number(m.stock_minimo);

export default function MaterialesScreen() {
    const [materiales, setMateriales] = useState<Fila[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [filtro, setFiltro] = useState("todos");

    const [panelAbierto, setPanelAbierto] = useState(false);
    const [nombre, setNombre] = useState("");
    const [unidad, setUnidad] = useState("");
    const [categoria, setCategoria] = useState<"ingrediente" | "comprado">("ingrediente");
    const [minimo, setMinimo] = useState("");
    const [error, setError] = useState("");

    async function cargar() {
        const { data } = await supabase
            .from("inventario")
            .select("material_id, nombre, unidad, stock_minimo, stock")
            .order("nombre");
        setMateriales(data ?? []);
    }

    useEffect(() => {
        cargar();
    }, []);

    async function agregar() {
        if (!nombre.trim() || !unidad.trim()) {
            setError("Escribe el nombre y la unidad");
            return;
        }
        const minimoNum = Number(minimo.replace(",", ".")) || 0;
        if (minimoNum < 0) {
            setError("El stock mínimo no puede ser negativo");
            return;
        }
        setError("");

        const { error: fallo } = await supabase.from("materiales").insert({
            nombre: nombre.trim(),
            unidad: unidad.trim().toLowerCase(),
            categoria,
            stock_minimo: minimoNum,
        });

        if (fallo) {
            setError("No se pudo guardar el material");
            return;
        }

        setNombre("");
        setUnidad("");
        setMinimo("");
        setCategoria("ingrediente");
        setPanelAbierto(false);
        cargar();
    }

    const visibles = materiales.filter((m) => {
        const coincide = limpiar(m.nombre).includes(limpiar(busqueda));
        if (!coincide) return false;
        if (filtro === "bajo") return esBajo(m);
        if (filtro === "normal") return !esBajo(m);
        return true;
    });

    const opcionesFiltro = [
        { valor: "todos", etiqueta: "Todos", cantidad: materiales.length },
        { valor: "bajo", etiqueta: "Stock bajo", cantidad: materiales.filter(esBajo).length },
        { valor: "normal", etiqueta: "En stock", cantidad: materiales.filter((m) => !esBajo(m)).length },
    ];

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <BarraAcciones
                busqueda={busqueda}
                onBusqueda={setBusqueda}
                placeholder="Buscar material..."
                textoBoton="Nuevo"
                onBoton={() => setPanelAbierto(true)}
            />
            <Filtros opciones={opcionesFiltro} valor={filtro} onCambio={setFiltro} />

            <View style={styles.tabla}>
                <View style={styles.cabecera}>
                    <Text style={[styles.cabeceraTexto, { flex: 2 }]}>Material</Text>
                    <Text style={[styles.cabeceraTexto, { flex: 1.2, textAlign: "right" }]}>Cantidad</Text>
                    <Text style={[styles.cabeceraTexto, { flex: 1, paddingLeft: 10 }]}>Unidad</Text>
                    <Text style={[styles.cabeceraTexto, { flex: 1.2 }]}>Estado</Text>
                </View>

                {visibles.length === 0 ? (
                    <Text style={styles.vacio}>No hay materiales para mostrar</Text>
                ) : (
                    visibles.map((m) => (
                        <View key={m.material_id} style={styles.fila}>
                            <Text style={[styles.nombre, { flex: 2 }]}>{m.nombre}</Text>
                            <Text style={[styles.cantidad, { flex: 1.2 }]}>
                                {Number(m.stock).toLocaleString("es-CO")}
                            </Text>
                            <Text style={[styles.unidad, { flex: 1 }]}>{m.unidad}</Text>
                            <View style={{ flex: 1.2, alignItems: "flex-start" }}>
                                <Badge
                                    texto={esBajo(m) ? "Bajo" : "Normal"}
                                    tono={esBajo(m) ? "rojo" : "verde"}
                                />
                            </View>
                        </View>
                    ))
                )}
            </View>

            <Panel
                visible={panelAbierto}
                titulo="Nuevo material"
                onCerrar={() => setPanelAbierto(false)}
            >
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
                        <Text style={[styles.opcionTexto, categoria === "ingrediente" && styles.opcionTextoActivo]}>
                            Ingrediente
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.opcion, categoria === "comprado" && styles.opcionActiva]}
                        onPress={() => setCategoria("comprado")}
                    >
                        <Text style={[styles.opcionTexto, categoria === "comprado" && styles.opcionTextoActivo]}>
                            Comprado hecho
                        </Text>
                    </Pressable>
                </View>

                <TextInput
                    style={styles.input}
                    placeholder="Avisar cuando quede menos de... (opcional)"
                    value={minimo}
                    onChangeText={setMinimo}
                    keyboardType="numeric"
                />

                <Pressable style={styles.boton} onPress={agregar}>
                    <Text style={styles.botonTexto}>Guardar material</Text>
                </Pressable>
                {error ? <Text style={styles.error}>{error}</Text> : null}
            </Panel>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16 },
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
    fila: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderTopWidth: 1,
        borderTopColor: "#F5F5F4",
    },
    nombre: { fontSize: 15, color: "#1C1917" },
    cantidad: { fontSize: 15, fontWeight: "bold", color: "#1C1917", textAlign: "right" },
    unidad: { fontSize: 14, color: "#78716C", paddingLeft: 10 },
    vacio: { padding: 20, textAlign: "center", color: "#78716C" },
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
    boton: {
        backgroundColor: "#EA580C",
        borderRadius: 12,
        padding: 14,
        marginTop: 20,
        alignItems: "center",
    },
    botonTexto: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
    error: { color: "#E63946", marginTop: 12, textAlign: "center" },
});