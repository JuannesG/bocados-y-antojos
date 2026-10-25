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

type Cliente = { id: string; nombre: string; telefono: string | null };

export default function ClientesScreen() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [conteo, setConteo] = useState<Record<string, number>>({});
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
        cargar();
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
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
                <Text style={styles.botonTexto}>Añadir cliente</Text>
            </Pressable>
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.subtitulo}>Clientes</Text>
            {clientes.length === 0 ? (
                <Text style={styles.vacio}>Aún no hay clientes</Text>
            ) : (
                clientes.map((c) => (
                    <View key={c.id} style={styles.fila}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.nombre}>{c.nombre}</Text>
                            <Text style={styles.detalle}>{c.telefono ?? "Sin teléfono"}</Text>
                        </View>
                        <Text style={styles.pedidos}>{conteo[c.id] ?? 0} pedidos</Text>
                    </View>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16 },
    input: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        fontSize: 16,
    },
    boton: {
        backgroundColor: "#FF8A00",
        borderRadius: 12,
        padding: 14,
        alignItems: "center",
    },
    botonTexto: { color: "#4E2E1E", fontSize: 16, fontWeight: "bold" },
    error: { color: "#E63946", marginTop: 12, textAlign: "center" },
    subtitulo: { fontSize: 18, fontWeight: "bold", color: "#4E2E1E", marginTop: 28, marginBottom: 12 },
    vacio: { color: "#4E2E1E", textAlign: "center" },
    fila: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
    },
    nombre: { fontSize: 16, fontWeight: "bold", color: "#4E2E1E" },
    detalle: { fontSize: 13, color: "#7A5A45", marginTop: 2 },
    pedidos: { fontSize: 14, fontWeight: "bold", color: "#4E2E1E" },
});