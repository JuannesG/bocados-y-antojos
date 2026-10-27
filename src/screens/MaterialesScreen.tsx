import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { supabase } from "../lib/supabase";
import { limpiar } from "../lib/formato";
import Badge from "../components/Badge";
import Panel from "../components/Panel";
import BarraAcciones from "../components/BarraAcciones";
import Filtros from "../components/Filtros";
import { comunes } from "../styles/comunes";
import { styles } from "../styles/Materiales.styles";

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

    const [abierto, setAbierto] = useState("");
    const [nombreEdit, setNombreEdit] = useState("");
    const [minimoEdit, setMinimoEdit] = useState("");
    const [stockReal, setStockReal] = useState("");
    const [motivo, setMotivo] = useState("");
    const [confirmando, setConfirmando] = useState("");

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

    function abrir(m: Fila) {
        if (abierto === m.material_id) {
            setAbierto("");
            return;
        }
        setAbierto(m.material_id);
        setNombreEdit(m.nombre);
        setMinimoEdit(String(Number(m.stock_minimo)));
        setStockReal("");
        setMotivo("");
        setConfirmando("");
        setError("");
    }

    async function guardarCambios(m: Fila) {
        const minimoNum = Number(minimoEdit.replace(",", ".")) || 0;
        if (!nombreEdit.trim()) {
            setError("El nombre no puede quedar vacío");
            return;
        }
        if (minimoNum < 0) {
            setError("El stock mínimo no puede ser negativo");
            return;
        }
        const { error: fallo } = await supabase
            .from("materiales")
            .update({ nombre: nombreEdit.trim(), stock_minimo: minimoNum })
            .eq("id", m.material_id);
        if (fallo) {
            setError("No se pudieron guardar los cambios");
            return;
        }
        setError("");
        cargar();
    }

    async function ajustar(m: Fila) {
        const real = Number(stockReal.replace(",", "."));
        if (stockReal.trim() === "" || isNaN(real) || real < 0) {
            setError("Escribe cuánto hay realmente (0 o más)");
            return;
        }
        if (!motivo.trim()) {
            setError("Escribe el motivo del ajuste");
            return;
        }
        const diferencia = real - Number(m.stock);
        if (diferencia === 0) {
            setError("El stock real ya coincide con el del sistema");
            return;
        }
        const { error: fallo } = await supabase.from("ajustes_inventario").insert({
            material_id: m.material_id,
            cantidad: diferencia,
            motivo: motivo.trim(),
        });
        if (fallo) {
            setError("No se pudo guardar el ajuste");
            return;
        }
        setError("");
        setStockReal("");
        setMotivo("");
        cargar();
    }

    async function eliminar(m: Fila) {
        const { error: fallo } = await supabase
            .from("materiales")
            .delete()
            .eq("id", m.material_id);
        if (fallo) {
            setError(
                "No se puede eliminar: este material ya tiene compras o está en una receta."
            );
            setConfirmando("");
            return;
        }
        setError("");
        setConfirmando("");
        setAbierto("");
        cargar();
    }

    const visibles = materiales.filter((m) => {
        if (!limpiar(m.nombre).includes(limpiar(busqueda))) return false;
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

            {error && !panelAbierto ? <Text style={comunes.error}>{error}</Text> : null}

            <View style={comunes.tabla}>
                <View style={comunes.cabecera}>
                    <Text style={[comunes.cabeceraTexto, { flex: 2 }]}>Material</Text>
                    <Text style={[comunes.cabeceraTexto, { flex: 1.2, textAlign: "right" }]}>Cantidad</Text>
                    <Text style={[comunes.cabeceraTexto, { flex: 1, paddingLeft: 10 }]}>Unidad</Text>
                    <Text style={[comunes.cabeceraTexto, { flex: 1.2 }]}>Estado</Text>
                </View>

                {visibles.length === 0 ? (
                    <Text style={comunes.vacio}>No hay materiales para mostrar</Text>
                ) : (
                    visibles.map((m) => (
                        <View key={m.material_id} style={styles.bloque}>
                            <Pressable style={styles.fila} onPress={() => abrir(m)}>
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
                            </Pressable>

                            {abierto === m.material_id ? (
                                <View style={styles.detalleAbierto}>
                                    <Text style={styles.subtitulo}>Editar material</Text>
                                    <TextInput
                                        style={comunes.input}
                                        placeholder="Nombre"
                                        value={nombreEdit}
                                        onChangeText={setNombreEdit}
                                    />
                                    <TextInput
                                        style={comunes.input}
                                        placeholder="Avisar cuando quede menos de..."
                                        value={minimoEdit}
                                        onChangeText={setMinimoEdit}
                                        keyboardType="numeric"
                                    />
                                    <Text style={styles.nota}>
                                        La unidad ({m.unidad}) no se puede cambiar porque tus compras y
                                        recetas ya la usan.
                                    </Text>
                                    <Pressable style={comunes.botonOscuro} onPress={() => guardarCambios(m)}>
                                        <Text style={comunes.botonOscuroTexto}>Guardar cambios</Text>
                                    </Pressable>

                                    <Text style={styles.subtitulo}>Ajustar stock</Text>
                                    <Text style={styles.nota}>
                                        El sistema dice que hay {Number(m.stock).toLocaleString("es-CO")}{" "}
                                        {m.unidad}. Escribe cuánto hay de verdad.
                                    </Text>
                                    <TextInput
                                        style={comunes.input}
                                        placeholder={`Stock real (en ${m.unidad})`}
                                        value={stockReal}
                                        onChangeText={setStockReal}
                                        keyboardType="numeric"
                                    />
                                    <TextInput
                                        style={comunes.input}
                                        placeholder="Motivo (ej. conteo, se dañó, regalo)"
                                        value={motivo}
                                        onChangeText={setMotivo}
                                    />
                                    <Pressable style={comunes.botonOscuro} onPress={() => ajustar(m)}>
                                        <Text style={comunes.botonOscuroTexto}>Aplicar ajuste</Text>
                                    </Pressable>

                                    {confirmando === m.material_id ? (
                                        <View>
                                            <Text style={styles.aviso}>
                                                Se eliminará este material. Solo se puede si no tiene compras
                                                ni está en una receta. ¿Seguro?
                                            </Text>
                                            <View style={styles.botones}>
                                                <Pressable style={comunes.botonPeligro} onPress={() => eliminar(m)}>
                                                    <Text style={comunes.botonPeligroTexto}>Sí, eliminar</Text>
                                                </Pressable>
                                                <Pressable style={comunes.botonNeutro} onPress={() => setConfirmando("")}>
                                                    <Text style={comunes.botonNeutroTexto}>No</Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                    ) : (
                                        <Pressable
                                            style={comunes.botonContorno}
                                            onPress={() => setConfirmando(m.material_id)}
                                        >
                                            <Text style={comunes.botonContornoTexto}>Eliminar material</Text>
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
                titulo="Nuevo material"
                onCerrar={() => setPanelAbierto(false)}
            >
                <TextInput
                    style={comunes.input}
                    placeholder="Nombre (ej. lechuga)"
                    value={nombre}
                    onChangeText={setNombre}
                />
                <TextInput
                    style={comunes.input}
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
                    style={comunes.input}
                    placeholder="Avisar cuando quede menos de... (opcional)"
                    value={minimo}
                    onChangeText={setMinimo}
                    keyboardType="numeric"
                />

                <Pressable style={comunes.botonPrimario} onPress={agregar}>
                    <Text style={comunes.botonPrimarioTexto}>Guardar material</Text>
                </Pressable>
                {error && panelAbierto ? <Text style={comunes.error}>{error}</Text> : null}
            </Panel>
        </ScrollView>
    );
}