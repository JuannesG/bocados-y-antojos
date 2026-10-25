import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type Pantalla =
    | "inicio"
    | "inventario"
    | "productos"
    | "pedidos"
    | "clientes"
    | "compras"
    | "reportes"
    | "configuracion";

export const opcionesMenu: {
    clave: Pantalla;
    titulo: string;
    icono: keyof typeof Ionicons.glyphMap;
}[] = [
        { clave: "inicio", titulo: "Dashboard", icono: "home-outline" },
        { clave: "inventario", titulo: "Inventario", icono: "cube-outline" },
        { clave: "productos", titulo: "Productos", icono: "fast-food-outline" },
        { clave: "pedidos", titulo: "Pedidos", icono: "receipt-outline" },
        { clave: "clientes", titulo: "Clientes", icono: "people-outline" },
        { clave: "compras", titulo: "Compras", icono: "cart-outline" },
        { clave: "reportes", titulo: "Reportes", icono: "bar-chart-outline" },
        { clave: "configuracion", titulo: "Configuración", icono: "settings-outline" },
    ];

type Props = {
    activa: Pantalla;
    onElegir: (pantalla: Pantalla) => void;
    email: string;
    onSalir: () => void;
};

export default function Menu({ activa, onElegir, email, onSalir }: Props) {
    return (
        <View style={styles.menu}>
            <View style={styles.marca}>
                <Image
                    source={require("../../assets/Logo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>

            <View style={{ flex: 1 }}>
                {opcionesMenu.map((o) => {
                    const activo = o.clave === activa;
                    const color = activo ? "#4E2E1E" : "#FFF3E0";
                    return (
                        <Pressable
                            key={o.clave}
                            style={[styles.item, activo && styles.itemActivo]}
                            onPress={() => onElegir(o.clave)}
                        >
                            <Ionicons name={o.icono} size={22} color={color} />
                            <Text style={[styles.itemTexto, { color }]}>{o.titulo}</Text>
                        </Pressable>
                    );
                })}
            </View>

            <View style={styles.usuario}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.email} numberOfLines={1}>
                        {email}
                    </Text>
                    <Text style={styles.rol}>Administrador</Text>
                </View>
                <Pressable onPress={onSalir}>
                    <Ionicons name="log-out-outline" size={24} color="#FFF3E0" />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    menu: { flex: 1, backgroundColor: "#4E2E1E", padding: 16 },
    marca: {
        backgroundColor: "#FDF5E3",
        borderRadius: 16,
        padding: 10,
        marginBottom: 20,
    },
    logo: { width: "100%", height: 120 },
    item: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: 12,
        marginBottom: 4,
    },
    itemActivo: { backgroundColor: "#FF8A00" },
    itemTexto: { fontSize: 16, fontWeight: "bold" },
    usuario: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: "#6B4A38",
    },
    email: { color: "#FFF3E0", fontSize: 13 },
    rol: { color: "#D9C7B5", fontSize: 11 },
});