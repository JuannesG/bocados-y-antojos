import { View, Text } from "react-native";
import { colores } from "../styles/tema";
import { styles } from "../styles/Reportes.styles";

type Props = {
    etiqueta: string;
    valor: string;
    porcentaje: number;
    detalle?: string;
};

export default function FilaBarra({ etiqueta, valor, porcentaje, detalle }: Props) {
    const p = Math.max(0, Math.min(100, Math.round(porcentaje)));
    return (
        <View style={styles.producto}>
            <View style={styles.filaProducto}>
                <Text style={styles.nombre}>{etiqueta}</Text>
                <Text style={styles.cantidad}>{valor}</Text>
            </View>
            <View style={styles.pista}>
                <View style={{ flex: p, backgroundColor: colores.acento, borderRadius: 4 }} />
                <View style={{ flex: 100 - p }} />
            </View>
            {detalle ? <Text style={styles.detalle}>{detalle}</Text> : null}
        </View>
    );
}