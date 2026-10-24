import { View, Text, StyleSheet } from "react-native";

type Props = { titulo: string };

export default function PantallaVacia({ titulo }: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.texto}>{titulo}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#FFF3E0",
    },
    texto: {
        fontSize: 22,
        color: "#4E2E1E",
        fontWeight: "bold",
    },
});