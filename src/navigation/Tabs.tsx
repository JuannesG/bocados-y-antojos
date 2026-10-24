import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import InicioScreen from "../screens/InicioScreen";
import PedidosScreen from "../screens/PedidosScreen";
import ProductosScreen from "../screens/ProductosScreen";
import MaterialesScreen from "../screens/MaterialesScreen";
import MasScreen from "../screens/MasScreen";

const Tab = createBottomTabNavigator();

function icono(nombre: keyof typeof Ionicons.glyphMap) {
    return ({ color, size }: { color: string; size: number }) => (
        <Ionicons name={nombre} size={size} color={color} />
    );
}

export default function Tabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: "#FF8A00",
                tabBarInactiveTintColor: "#4E2E1E",
                tabBarStyle: { backgroundColor: "#FFF3E0" },
                headerStyle: { backgroundColor: "#FFF3E0" },
                headerTintColor: "#4E2E1E",
            }}
        >
            <Tab.Screen name="Inicio" component={InicioScreen} options={{ tabBarIcon: icono("home-outline") }} />
            <Tab.Screen name="Pedidos" component={PedidosScreen} options={{ tabBarIcon: icono("receipt-outline") }} />
            <Tab.Screen name="Productos" component={ProductosScreen} options={{ tabBarIcon: icono("fast-food-outline") }} />
            <Tab.Screen name="Inventario" component={MaterialesScreen} options={{ tabBarIcon: icono("cube-outline") }} />
            <Tab.Screen name="Más" component={MasScreen} options={{ tabBarIcon: icono("ellipsis-horizontal") }} />
        </Tab.Navigator>
    );
}