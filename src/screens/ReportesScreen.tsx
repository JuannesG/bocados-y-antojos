import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { fechaHace, hoy, inicioMes } from "../lib/formato";
import ReporteVentas from "../components/reportes/ReporteVentas";
import ReporteCompras from "../components/reportes/ReporteCompras";
import ReporteInventario from "../components/reportes/ReporteInventario";
import ReporteClientes from "../components/reportes/ReporteClientes";
import { styles } from "../styles/Reportes.styles";

type Seccion = "ventas" | "compras" | "inventario" | "clientes";
type Periodo = "hoy" | "semana" | "mes" | "todo";

const secciones: { valor: Seccion; etiqueta: string }[] = [
    { valor: "ventas", etiqueta: "Ventas" },
    { valor: "compras", etiqueta: "Compras" },
    { valor: "inventario", etiqueta: "Inventario" },
    { valor: "clientes", etiqueta: "Clientes" },
];

const periodos: { valor: Periodo; etiqueta: string }[] = [
    { valor: "hoy", etiqueta: "Hoy" },
    { valor: "semana", etiqueta: "7 días" },
    { valor: "mes", etiqueta: "Este mes" },
    { valor: "todo", etiqueta: "Todo" },
];

function desdeDe(periodo: Periodo) {
    if (periodo === "hoy") return hoy();
    if (periodo === "semana") return fechaHace(6);
    if (periodo === "mes") return inicioMes();
    return "2000-01-01";
}

export default function ReportesScreen() {
    const [seccion, setSeccion] = useState<Seccion>("ventas");
    const [periodo, setPeriodo] = useState<Periodo>("mes");
    const desde = desdeDe(periodo);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
                {secciones.map((s) => {
                    const activa = s.valor === seccion;
                    return (
                        <Pressable
                            key={s.valor}
                            style={[styles.tab, activa && styles.tabActiva]}
                            onPress={() => setSeccion(s.valor)}
                        >
                            <Text style={[styles.tabTexto, activa && styles.tabTextoActiva]}>
                                {s.etiqueta}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {seccion !== "inventario" ? (
                <View style={styles.selector}>
                    {periodos.map((p) => (
                        <Pressable
                            key={p.valor}
                            style={[styles.opcion, periodo === p.valor && styles.opcionActiva]}
                            onPress={() => setPeriodo(p.valor)}
                        >
                            <Text
                                style={[
                                    styles.opcionTexto,
                                    periodo === p.valor && styles.opcionTextoActiva,
                                ]}
                            >
                                {p.etiqueta}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            ) : (
                <View style={{ height: 14 }} />
            )}

            {seccion === "ventas" ? <ReporteVentas desde={desde} /> : null}
            {seccion === "compras" ? <ReporteCompras desde={desde} /> : null}
            {seccion === "inventario" ? <ReporteInventario /> : null}
            {seccion === "clientes" ? <ReporteClientes desde={desde} /> : null}
        </ScrollView>
    );
}