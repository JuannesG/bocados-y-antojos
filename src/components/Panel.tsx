import type { ReactNode } from "react";
import {
    Modal,
    View,
    Text,
    Pressable,
    ScrollView,
    StyleSheet,
    useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
    visible: boolean;
    titulo: string;
    onCerrar: () => void;
    children: ReactNode;
};

export default function Panel({ visible, titulo, onCerrar, children }: Props) {
    const { width } = useWindowDimensions();
    const esAncha = width >= 900;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCerrar}
        >
            <View
                style={[
                    styles.fondo,
                    { justifyContent: esAncha ? "center" : "flex-end" },
                ]}
            >
                <View style={[styles.hoja, esAncha ? styles.hojaAncha : styles.hojaMovil]}>
                    <View style={styles.cabecera}>
                        <Text style={styles.titulo}>{titulo}</Text>
                        <Pressable onPress={onCerrar}>
                            <Ionicons name="close" size={26} color="#1C1917" />
                        </Pressable>
                    </View>
                    <ScrollView
                        contentContainerStyle={styles.contenido}
                        keyboardShouldPersistTaps="handled"
                    >
                        {children}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    fondo: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
        alignItems: "center",
    },
    hoja: { backgroundColor: "#FAFAF9" },
    hojaAncha: { width: 600, maxHeight: "90%", borderRadius: 16 },
    hojaMovil: {
        width: "100%",
        maxHeight: "92%",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    cabecera: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
    },
    titulo: { fontSize: 20, fontWeight: "bold", color: "#1C1917" },
    contenido: { padding: 16, paddingTop: 0, paddingBottom: 32 },
});