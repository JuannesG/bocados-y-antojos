import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { supabase } from "../lib/supabase";
import { limpiar } from "../lib/formato";
import Panel from "../components/Panel";
import BarraAcciones from "../components/BarraAcciones";
import { comunes } from "../styles/comunes";
import { styles } from "../styles/Clientes.styles";

type Cliente = { id: string; nombre: string; telefono: string | null };

export default function ClientesScreen() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [conteo, setConteo] = useState<Record<string, number>>({});
    const [busqueda, setBusqueda] = useState("");

    const [panelAbierto, setPanelAbierto] = useState(false);
    const [nombre, setNombre] = useState("");
    const [telefono, setTelefono] = useState("");

    const [abierto, setAbierto] = useState("");
    const [nombreEdit, setNombreEdit] = useState("");
    const [telefonoEdit, setTelefonoEdit] = useState("");
    const [confirmando, setConfirmando] = useState("");

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

    function abrir(c: Cliente) {
        if (abierto === c.id) {
            setAbierto("");
            return;
        }
        setAbierto(c.id);
        setNombreEdit(c.nombre);
        setTelefonoEdit(c.telefono ?? "");
        setConfirmando("");
        setError("");
    }

    async function guardarCambios(c: Cliente) {
        if (!nombreEdit.trim()) {
            setError("El nombre no puede quedar vacío");
            return;
        }
        const { error: fallo } = await supabase
            .from("clientes")
            .update({
                nombre: nombreEdit.trim(),
                telefono: telefonoEdit.trim() || null,
            })
            .eq("id", c.id);
        if (fallo) {
            setError("No se pudieron guardar los cambios");
            return;
        }
        setError("");
        cargar();
    }

    async function eliminar(c: Cliente) {
        const { error: fallo } = await supabase
            .from("clientes")
            .delete()
            .eq("id", c.id);
        if (fallo) {
            setError("No se puede eliminar: este cliente ya tiene pedidos.");
            setConfirmando("");
            return;
        }
        setError("");
        setConfirmando("");
        setAbierto("");
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

            {error && !panelAbierto ? <Text style={comunes.error}>{error}</Text> : null}

            <View style={comunes.tabla}>
                <View style={comunes.cabecera}>
                    <Text style={[comunes.cabeceraTexto, { flex: 2 }]}>Nombre</Text>
                    <Text style={[comunes.cabeceraTexto, { flex: 1.6 }]}>Teléfono</Text>
                    <Text style={[comunes.cabeceraTexto, { flex: 1, textAlign: "right" }]}>Pedidos</Text>
                </View>

                {visibles.length === 0 ? (
                    <Text style={comunes.vacio}>No hay clientes para mostrar</Text>
                ) : (
                    visibles.map((c) => (
                        <View key={c.id} style={styles.bloque}>
                            <Pressable style={styles.fila} onPress={() => abrir(c)}>
                                <Text style={[styles.nombre, { flex: 2 }]}>{c.nombre}</Text>
                                <Text style={[styles.telefono, { flex: 1.6 }]}>
                                    {c.telefono ?? "—"}
                                </Text>
                                <Text style={[styles.pedidos, { flex: 1 }]}>{conteo[c.id] ?? 0}</Text>
                            </Pressable>

                            {abierto === c.id ? (
                                <View style={styles.detalleAbierto}>
                                    <Text style={styles.subtitulo}>Editar cliente</Text>
                                    <TextInput
                                        style={comunes.input}
                                        placeholder="Nombre"
                                        value={nombreEdit}
                                        onChangeText={setNombreEdit}
                                    />
                                    <TextInput
                                        style={comunes.input}
                                        placeholder="Teléfono (opcional)"
                                        value={telefonoEdit}
                                        onChangeText={setTelefonoEdit}
                                        keyboardType="phone-pad"
                                    />
                                    <Pressable style={comunes.botonOscuro} onPress={() => guardarCambios(c)}>
                                        <Text style={comunes.botonOscuroTexto}>Guardar cambios</Text>
                                    </Pressable>

                                    {confirmando === c.id ? (
                                        <View>
                                            <Text style={styles.aviso}>
                                                Se eliminará este cliente. Solo se puede si no tiene
                                                pedidos. ¿Seguro?
                                            </Text>
                                            <View style={styles.botones}>
                                                <Pressable style={comunes.botonPeligro} onPress={() => eliminar(c)}>
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
                                            onPress={() => setConfirmando(c.id)}
                                        >
                                            <Text style={comunes.botonContornoTexto}>Eliminar cliente</Text>
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
                titulo="Nuevo cliente"
                onCerrar={() => setPanelAbierto(false)}
            >
                <TextInput
                    style={comunes.input}
                    placeholder="Nombre del cliente"
                    value={nombre}
                    onChangeText={setNombre}
                />
                <TextInput
                    style={comunes.input}
                    placeholder="Teléfono (opcional)"
                    value={telefono}
                    onChangeText={setTelefono}
                    keyboardType="phone-pad"
                />
                <Pressable style={comunes.botonPrimario} onPress={agregar}>
                    <Text style={comunes.botonPrimarioTexto}>Guardar cliente</Text>
                </Pressable>
                {error && panelAbierto ? <Text style={comunes.error}>{error}</Text> : null}
            </Panel>
        </ScrollView>
    );
}