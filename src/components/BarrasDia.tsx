import { View, Text, StyleSheet } from "react-native";
import type { DiaVenta } from "../lib/resumen";

type Props = { datos: DiaVenta[] };

export default function BarrasDia({ datos }: Props) {
    const maximo = Math.max(...datos.map((d) => d.valor), 1);

    return (
        <View style={styles.contenedor}>
            {datos.map((d, i) => (
                <View key={i} style={styles.columna}>
                    <View style={styles.zona}>
                        <View
                            style={[
                                styles.barra,
                                { height: Math.max(Math.round((d.valor / maximo) * 100), d.valor > 0 ? 4 : 0) },
                            ]}
                        />
                    </View>
                    <Text style={styles.etiqueta}>{d.etiqueta}</Text>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    contenedor: { flexDirection: "row", alignItems: "flex-end", marginTop: 12 },
    columna: { flex: 1, alignItems: "center" },
    zona: { height: 100, justifyContent: "flex-end", width: "100%", alignItems: "center" },
    barra: { width: "55%", backgroundColor: "#EA580C", borderRadius: 6 },
    etiqueta: { fontSize: 12, color: "#1C1917", marginTop: 6 },
});