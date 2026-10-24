import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import ComprasScreen from "../screens/ComprasScreen";
import InicioScreen from "../screens/InicioScreen";
import PedidosScreen from "../screens/PedidosScreen";
import ProductosScreen from "../screens/ProductosScreen";
import ReportesScreen from "../screens/ReportesScreen";
import MaterialesScreen from "../screens/MaterialesScreen";

const Tab = createBottomTabNavigator();

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
            <Tab.Screen name="Inicio" component={InicioScreen} />
            <Tab.Screen name="Productos" component={ProductosScreen} />
            <Tab.Screen name="Pedidos" component={PedidosScreen} />
            <Tab.Screen name="Compras" component={ComprasScreen} />
            <Tab.Screen name="Reportes" component={ReportesScreen} />
            <Tab.Screen name="Materiales" component={MaterialesScreen} />
        </Tab.Navigator>
    );
}