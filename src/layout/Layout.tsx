import { useState } from "react";
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import Menu, { opcionesMenu } from "../components/Menu";
import type { Pantalla } from "../components/Menu";
import ComprasScreen from "../screens/ComprasScreen";
import InicioScreen from "../screens/InicioScreen";
import MaterialesScreen from "../screens/MaterialesScreen";
import ProductosScreen from "../screens/ProductosScreen";
import PedidosScreen from "../screens/PedidosScreen";
import ReportesScreen from "../screens/ReportesScreen";
import ClientesScreen from "../screens/ClientesScreen";

type Props = { email: string };

export default function Layout({ email }: Props) {
    const { width } = useWindowDimensions();
    const esAncha = width >= 900;

    const [pantalla, setPantalla] = useState<Pantalla>("inicio");
    const [menuAbierto, setMenuAbierto] = useState(false);

    const titulo = opcionesMenu.find((o) => o.clave === pantalla)?.titulo ?? "";

    function elegir(nueva: Pantalla) {
        setPantalla(nueva);
        setMenuAbierto(false);
    }

    function contenido() {
        switch (pantalla) {
            case "inicio":
                return <InicioScreen />;
            case "inventario":
                return <MaterialesScreen />;
            case "productos":
                return <ProductosScreen />;
            case "pedidos":
                return <PedidosScreen />;
            case "clientes":
                return <ClientesScreen />;
            case "compras":
                return <ComprasScreen />;
            case "reportes":
                return <ReportesScreen />;
            default:
                return (
                    <View style={styles.proximamente}>
                        <Text style={styles.proximamenteTexto}>Próximamente</Text>
                    </View>
                );
        }
    }

    const menu = (
        <Menu
            activa={pantalla}
            onElegir={elegir}
            email={email}
            onSalir={() => supabase.auth.signOut()}
        />
    );

    if (esAncha) {
        return (
            <SafeAreaView style={styles.raiz} edges={["top", "bottom"]}>
                <View style={styles.fila}>
                    <View style={styles.lateral}>{menu}</View>
                    <View style={styles.principal}>
                        <View style={styles.encabezado}>
                            <Text style={styles.titulo}>{titulo}</Text>
                        </View>
                        <View style={styles.cuerpo}>{contenido()}</View>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.raiz} edges={["top", "bottom"]}>
            <View style={styles.principal}>
                <View style={styles.encabezado}>
                    <Pressable onPress={() => setMenuAbierto(true)}>
                        <Ionicons name="menu" size={28} color="#1C1917" />
                    </Pressable>
                    <Text style={styles.titulo}>{titulo}</Text>
                </View>
                <View style={styles.cuerpo}>{contenido()}</View>

                {menuAbierto ? (
                    <View style={styles.capa}>
                        <View style={styles.cajon}>{menu}</View>
                        <Pressable style={styles.fondo} onPress={() => setMenuAbierto(false)} />
                    </View>
                ) : null}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    raiz: { flex: 1, backgroundColor: "#FAFAF9" },
    fila: { flex: 1, flexDirection: "row" },
    lateral: { width: 250 },
    principal: { flex: 1 },
    encabezado: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#E7E5E4",
    },
    titulo: { fontSize: 22, fontWeight: "bold", color: "#1C1917" },
    cuerpo: { flex: 1, width: "100%", maxWidth: 1000, alignSelf: "center" },
    capa: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: "row",
    },
    cajon: { width: 270 },
    fondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
    proximamente: { flex: 1, alignItems: "center", justifyContent: "center" },
    proximamenteTexto: { fontSize: 18, color: "#78716C" },
});