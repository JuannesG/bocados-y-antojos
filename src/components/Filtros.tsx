import { Text, Pressable, ScrollView, StyleSheet } from "react-native";

type Opcion = { valor: string; etiqueta: string; cantidad: number };

type Props = {
    opciones: Opcion[];
    valor: string;
    onCambio: (valor: string) => void;
};

export default function Filtros({ opciones, valor, onCambio }: Props) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.contenedor}
        >
            {opciones.map((o) => {
                const activo = o.valor === valor;
                return (
                    <Pressable
                        key={o.valor}
                        style={[styles.chip, activo && styles.chipActivo]}
                        onPress={() => onCambio(o.valor)}
                    >
                        <Text style={[styles.texto, activo && styles.textoActivo]}>
                            {o.etiqueta} ({o.cantidad})
                        </Text>
                    </Pressable>
                );
            })}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    contenedor: { flexGrow: 0, marginTop: 12 },
    chip: {
        backgroundColor: "white",
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#E7E5E4",
        paddingVertical: 8,
        paddingHorizontal: 14,
        marginRight: 8,
    },
    chipActivo: { backgroundColor: "#1C1917", borderColor: "#1C1917" },
    texto: { color: "#1C1917", fontSize: 14 },
    textoActivo: { color: "#FAFAF9", fontWeight: "bold" },
});