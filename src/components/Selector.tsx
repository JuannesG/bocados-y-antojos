import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    StyleSheet,
} from "react-native";

type Opcion = { valor: string; etiqueta: string };

type Props = {
    valor: string;
    onCambio: (valor: string) => void;
    opciones: Opcion[];
    placeholder: string;
};

function limpiar(texto: string) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

export default function Selector({ valor, onCambio, opciones, placeholder }: Props) {
    const [abierto, setAbierto] = useState(false);
    const [busqueda, setBusqueda] = useState("");

    const elegida = opciones.find((o) => o.valor === valor);
    const filtradas = opciones.filter((o) =>
        limpiar(o.etiqueta).includes(limpiar(busqueda))
    );

    function cerrar() {
        setAbierto(false);
        setBusqueda("");
    }

    return (
        <View style={styles.contenedor}>
            <Pressable
                style={styles.campo}
                onPress={() => (abierto ? cerrar() : setAbierto(true))}
            >
                <Text style={elegida ? styles.texto : styles.placeholder}>
                    {elegida ? elegida.etiqueta : placeholder}
                </Text>
                <Text style={styles.flecha}>{abierto ? "▲" : "▼"}</Text>
            </Pressable>

            {abierto ? (
                <View style={styles.lista}>
                    <TextInput placeholderTextColor="#A8A29E"
                        style={styles.buscador}
                        placeholder="Escribe para buscar..."
                        value={busqueda}
                        onChangeText={setBusqueda}
                        autoFocus
                    />
                    <ScrollView
                        style={{ maxHeight: 220 }}
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                    >
                        {filtradas.length === 0 ? (
                            <Text style={styles.vacio}>Sin resultados</Text>
                        ) : (
                            filtradas.map((o) => (
                                <Pressable
                                    key={o.valor}
                                    style={styles.opcion}
                                    onPress={() => {
                                        onCambio(o.valor);
                                        cerrar();
                                    }}
                                >
                                    <Text style={styles.texto}>{o.etiqueta}</Text>
                                </Pressable>
                            ))
                        )}
                    </ScrollView>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    contenedor: { marginTop: 12 },
    campo: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    texto: { fontSize: 16, color: "#1C1917" },
    placeholder: { fontSize: 16, color: "#A8A29E" },
    flecha: { color: "#1C1917", fontSize: 12 },
    lista: {
        backgroundColor: "white",
        borderRadius: 12,
        marginTop: 4,
        borderWidth: 1,
        borderColor: "#E5E5E5",
    },
    buscador: {
        padding: 12,
        fontSize: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E7E5E4",
        color: "#1C1917",
    },
    opcion: {
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#E7E5E4",
    },
    vacio: { padding: 14, color: "#A8A29E" },
});