import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import { pesos, limpiar, inicioMes } from "../lib/formato";
import Panel from "../components/Panel";
import BarraAcciones from "../components/BarraAcciones";
import Filtros from "../components/Filtros";
import NuevaCompra from "../components/NuevaCompra";

type Factura = {
    id: string;
    fecha: string;
    proveedor: string;
    observacion: string;
};
type Item = {
    factura_id: string;
    material_id: string;
    cantidad: number;
    unidad_compra: string;
    total: number;
};

export default function ComprasScreen() {
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [nombres, setNombres] = useState<Record<string, string>>({});
    const [busqueda, setBusqueda] = useState("");
    const [filtro, setFiltro] = useState("todas");
    const [panelAbierto, setPanelAbierto] = useState(false);
    const [abierta, setAbierta] = useState("");
    const [confirmando, setConfirmando] = useState("");
    const [error, setError] = useState("");

    async function cargar() {
        const { data: mats } = await supabase.from("materiales").select("id, nombre");
        const { data: facs } = await supabase
            .from("facturas")
            .select("id, fecha, proveedor, observacion")
            .order("fecha", { ascending: false })
            .order("created_at", { ascending: false })
            .limit(100);

        const ids = (facs ?? []).map((f) => f.id);
        let detalle: Item[] = [];
        if (ids.length > 0) {
            const { data } = await supabase
                .from("compras")
                .select("factura_id, material_id, cantidad, unidad_compra, total")
                .in("factura_id", ids);
            detalle = data ?? [];
        }

        const mapa: Record<string, string> = {};
        (mats ?? []).forEach((m) => {
            mapa[m.id] = m.nombre;
        });

        setNombres(mapa);
        setFacturas(facs ?? []);
        setItems(detalle);
    }

    useEffect(() => {
        cargar();
    }, []);

    function totalDe(facturaId: string) {
        return items
            .filter((i) => i.factura_id === facturaId)
            .reduce((suma, i) => suma + Number(i.total), 0);
    }

    async function eliminar(id: string) {
        const { error: fallo } = await supabase.from("facturas").delete().eq("id", id);
        if (fallo) {
            setError("No se pudo eliminar la compra");
            return;
        }
        setError("");
        setConfirmando("");
        setAbierta("");
        cargar();
    }

    function alGuardar() {
        setPanelAbierto(false);
        cargar();
    }

    const esteMes = (f: Factura) => f.fecha >= inicioMes();

    const opcionesFiltro = [
        { valor: "todas", etiqueta: "Todas", cantidad: facturas.length },
        { valor: "mes", etiqueta: "Este mes", cantidad: facturas.filter(esteMes).length },
    ];

    const visibles = facturas.filter((f) => {
        const texto = limpiar(busqueda);
        const coincide =
            limpiar(f.proveedor).includes(texto) ||
            limpiar(f.observacion).includes(texto);
        if (!coincide) return false;
        return filtro === "todas" || esteMes(f);
    });

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <BarraAcciones
                busqueda={busqueda}
                onBusqueda={setBusqueda}
                placeholder="Buscar compra..."
                textoBoton="Nueva"
                onBoton={() => setPanelAbierto(true)}
            />
            <Filtros opciones={opcionesFiltro} valor={filtro} onCambio={setFiltro} />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.tabla}>
                <View style={styles.cabecera}>
                    <Text style={[styles.cabeceraTexto, { flex: 1.2 }]}>Fecha</Text>
                    <Text style={[styles.cabeceraTexto, { flex: 2.4 }]}>Lugar y observación</Text>
                    <Text style={[styles.cabeceraTexto, { flex: 1.2, textAlign: "right" }]}>Total</Text>
                </View>

                {visibles.length === 0 ? (
                    <Text style={styles.vacio}>No hay compras para mostrar</Text>
                ) : (
                    visibles.map((f) => (
                        <View key={f.id} style={styles.bloque}>
                            <Pressable
                                style={styles.fila}
                                onPress={() => {
                                    setAbierta(abierta === f.id ? "" : f.id);
                                    setConfirmando("");
                                }}
                            >
                                <Text style={[styles.fecha, { flex: 1.2 }]}>{f.fecha}</Text>
                                <View style={{ flex: 2.4 }}>
                                    <Text style={styles.proveedor}>{f.proveedor}</Text>
                                    <Text style={styles.detalle}>{f.observacion}</Text>
                                </View>
                                <Text style={[styles.total, { flex: 1.2 }]}>{pesos(totalDe(f.id))}</Text>
                            </Pressable>

                            {abierta === f.id ? (
                                <View style={styles.detalleAbierto}>
                                    {items
                                        .filter((i) => i.factura_id === f.id)
                                        .map((i, posicion) => (
                                            <View key={posicion} style={styles.filaDetalle}>
                                                <Text style={styles.detalleTexto}>
                                                    {nombres[i.material_id] ?? "—"} · {Number(i.cantidad)}{" "}
                                                    {i.unidad_compra}
                                                </Text>
                                                <Text style={styles.detalleTexto}>{pesos(i.total)}</Text>
                                            </View>
                                        ))}

                                    {confirmando === f.id ? (
                                        <View>
                                            <Text style={styles.aviso}>
                                                Se eliminará esta compra y se descontará del inventario lo
                                                que había sumado. ¿Seguro?
                                            </Text>
                                            <View style={styles.botones}>
                                                <Pressable
                                                    style={styles.botonPeligro}
                                                    onPress={() => eliminar(f.id)}
                                                >
                                                    <Text style={styles.botonPeligroTexto}>Sí, eliminar</Text>
                                                </Pressable>
                                                <Pressable
                                                    style={styles.botonNeutro}
                                                    onPress={() => setConfirmando("")}
                                                >
                                                    <Text style={styles.botonNeutroTexto}>No</Text>
                                                </Pressable>
                                            </View>
                                        </View>
                                    ) : (
                                        <Pressable
                                            style={styles.botonEliminar}
                                            onPress={() => setConfirmando(f.id)}
                                        >
                                            <Text style={styles.botonEliminarTexto}>Eliminar compra</Text>
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
                titulo="Nueva compra"
                onCerrar={() => setPanelAbierto(false)}
            >
                <NuevaCompra onGuardado={alGuardar} />
            </Panel>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16 },
    error: { color: "#E63946", marginTop: 12, textAlign: "center" },
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
    vacio: { padding: 20, textAlign: "center", color: "#78716C" },
    bloque: { borderTopWidth: 1, borderTopColor: "#F5F5F4" },
    fila: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    fecha: { fontSize: 13, color: "#78716C" },
    proveedor: { fontSize: 15, fontWeight: "bold", color: "#1C1917" },
    detalle: { fontSize: 13, color: "#78716C", marginTop: 2 },
    total: { fontSize: 15, fontWeight: "bold", color: "#1C1917", textAlign: "right" },
    detalleAbierto: {
        paddingHorizontal: 14,
        paddingBottom: 14,
        backgroundColor: "#FAFAF9",
    },
    filaDetalle: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
    },
    detalleTexto: { fontSize: 14, color: "#1C1917" },
    aviso: { fontSize: 13, color: "#78716C", marginTop: 12 },
    botones: { flexDirection: "row", gap: 10, marginTop: 10 },
    botonPeligro: {
        flex: 1,
        backgroundColor: "#E63946",
        borderRadius: 12,
        padding: 12,
        alignItems: "center",
    },
    botonPeligroTexto: { color: "#FFFFFF", fontWeight: "bold" },
    botonNeutro: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E7E5E4",
        backgroundColor: "white",
        padding: 12,
        alignItems: "center",
    },
    botonNeutroTexto: { color: "#1C1917", fontWeight: "bold" },
    botonEliminar: {
        marginTop: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E63946",
        padding: 12,
        alignItems: "center",
    },
    botonEliminarTexto: { color: "#E63946", fontWeight: "bold" },
});