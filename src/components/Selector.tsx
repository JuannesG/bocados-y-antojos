import { useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";

type Opcion = { valor: string; etiqueta: string };

type Props = {
    valor: string;
    onCambio: (valor: string) => void;
    opciones: Opcion[];
    placeholder: string;
};

export default function Selector({ valor, onCambio, opciones, placeholder }: Props) {
    const [abierto, setAbierto] = useState(false);
    const elegida = opciones.find((o) => o.valor === valor);

    return (
        <View style={styles.contenedor}>
            <Pressable style={styles.campo} onPress={() => setAbierto(!abierto)}>
                <Text style={elegida ? styles.texto : styles.placeholder}>
                    {elegida ? elegida.etiqueta : placeholder}
                </Text>
                <Text style={styles.flecha}>{abierto ? "▲" : "▼"}</Text>
            </Pressable>

            {abierto ? (
                <View style={styles.lista}>
                    <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled>
                        {opciones.map((o) => (
                            <Pressable
                                key={o.valor}
                                style={styles.opcion}
                                onPress={() => {
                                    onCambio(o.valor);
                                    setAbierto(false);
                                }}
                            >
                                <Text style={styles.texto}>{o.etiqueta}</Text>
                            </Pressable>
                        ))}
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
    texto: { fontSize: 16, color: "#4E2E1E" },
    placeholder: { fontSize: 16, color: "#9A8577" },
    flecha: { color: "#4E2E1E", fontSize: 12 },
    lista: {
        backgroundColor: "white",
        borderRadius: 12,
        marginTop: 4,
        borderWidth: 1,
        borderColor: "#E5E5E5",
    },
    opcion: {
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F1E6D6",
    },
});