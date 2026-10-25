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
import Panel from "../components/Panel";
import BarraAcciones from "../components/BarraAcciones";

type Cliente = { id: string; nombre: string; telefono: string | null };

export default function ClientesScreen() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [conteo, setConteo] = useState<Record<string, number>>({});
    const [busqueda, setBusqueda] = useState("");
    const [panelAbierto, setPanelAbierto] = useState(false);
    const [nombre, setNombre] = useState("");
    const [telefono, setTelefono] = useState("");
    const [error, setError] = useState("");

    async function cargar() {
        const [cli, ped] = await Promise.all([
            supabase.from("clientes").select("id, nombre, telefono").order("nombre"),
            supabase
                .from("pedidos")
                .select("cliente_id")
                .neq("estado_pedido", "cancelado"),
        ]);

        setClientes(cli.data ?? []);

        const cuenta: Record<string, number> = {};
        (ped.data ?? []).forEach((p) => {
            cuenta[p.cliente_id] = (cuenta[p.cliente_id] ?? 0) + 1;
        });
        setConteo(cuenta);
    }

    useEffect(() => {
        cargar();
    }, []);

    async function agregar() {
        if (!nombre.trim()) {
            setError("Escribe el nombre del cliente");
            return;
        }
        setError("");

        const { error: fallo } = await supabase.from("clientes").insert({
            nombre: nombre.trim(),
            telefono: telefono.trim() || null,
        });

        if (fallo) {
            setError("No se pudo guardar el cliente");
            return;
        }

        setNombre("");
        setTelefono("");
        setPanelAbierto(false);
        cargar();
    }

    const visibles = clientes.filter((c) => {
        const texto = limpiar(busqueda);
        return (
            limpiar(c.nombre).includes(texto) ||
            limpiar(c.telefono ?? "").includes(texto)
        );
    });

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <BarraAcciones
                busqueda={busqueda}
                onBusqueda={setBusqueda}
                placeholder="Buscar cliente..."
                textoBoton="Nuevo"
                onBoton={() => setPanelAbierto(true)}
            />

            <View style={styles.tabla}>
                <View style={styles.cabecera}>
                    <Text style={[styles.cabeceraTexto, { flex: 2 }]}>Nombre</Text>
                    <Text style={[styles.cabeceraTexto, { flex: 1.6 }]}>Teléfono</Text>
                    <Text style={[styles.cabeceraTexto, { flex: 1, textAlign: "right" }]}>Pedidos</Text>
                </View>

                {visibles.length === 0 ? (
                    <Text style={styles.vacio}>No hay clientes para mostrar</Text>
                ) : (
                    visibles.map((c) => (
                        <View key={c.id} style={styles.fila}>
                            <Text style={[styles.nombre, { flex: 2 }]}>{c.nombre}</Text>
                            <Text style={[styles.telefono, { flex: 1.6 }]}>
                                {c.telefono ?? "—"}
                            </Text>
                            <Text style={[styles.pedidos, { flex: 1 }]}>{conteo[c.id] ?? 0}</Text>
                        </View>
                    ))
                )}
            </View>

            <Panel
                visible={panelAbierto}
                titulo="Nuevo cliente"
                onCerrar={() => setPanelAbierto(false)}
            >
                <TextInput
                    style={styles.input}
                    placeholder="Nombre del cliente"
                    value={nombre}
                    onChangeText={setNombre}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Teléfono (opcional)"
                    value={telefono}
                    onChangeText={setTelefono}
                    keyboardType="phone-pad"
                />
                <Pressable style={styles.boton} onPress={agregar}>
                    <Text style={styles.botonTexto}>Guardar cliente</Text>
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
    nombre: { fontSize: 15, fontWeight: "bold", color: "#1C1917" },
    telefono: { fontSize: 14, color: "#78716C" },
    pedidos: { fontSize: 15, fontWeight: "bold", color: "#1C1917", textAlign: "right" },
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