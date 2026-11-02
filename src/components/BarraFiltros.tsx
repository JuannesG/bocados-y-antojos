import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Panel from "./Panel";
import { colores } from "../styles/tema";
import { comunes } from "../styles/comunes";
import { styles } from "../styles/BarraFiltros.styles";

type Opcion = { valor: string; etiqueta: string; cantidad?: number };

type Grupo = {
    clave: string;
    titulo: string;
    opciones: Opcion[];
    valor: string;
    porDefecto: string;
    onCambio: (valor: string) => void;
};

type Props = { grupos: Grupo[] };

export default function BarraFiltros({ grupos }: Props) {
    const [abierto, setAbierto] = useState(false);
    const activos = grupos.filter((g) => g.valor !== g.porDefecto);
    const hayActivos = activos.length > 0;

    function restablecer() {
        grupos.forEach((g) => g.onCambio(g.porDefecto));
    }

    return (
        <View style={styles.fila}>
            <Pressable
                style={[styles.boton, hayActivos && styles.botonActivo]}
                onPress={() => setAbierto(true)}
            >
                <Ionicons
                    name="options-outline"
                    size={18}
                    color={hayActivos ? colores.textoSobreOscuro : colores.texto}
                />
                <Text style={[styles.botonTexto, hayActivos && styles.botonTextoActivo]}>
                    Filtros{hayActivos ? ` (${activos.length})` : ""}
                </Text>
            </Pressable>

            {activos.map((g) => (
                <Pressable
                    key={g.clave}
                    style={styles.etiqueta}
                    onPress={() => g.onCambio(g.porDefecto)}
                >
                    <Text style={styles.etiquetaTexto}>
                        {g.opciones.find((o) => o.valor === g.valor)?.etiqueta ?? g.valor}
                    </Text>
                    <Ionicons name="close" size={14} color={colores.acento} />
                </Pressable>
            ))}

            {hayActivos ? (
                <Pressable onPress={restablecer}>
                    <Text style={styles.limpiar}>Limpiar</Text>
                </Pressable>
            ) : null}

            <Panel visible={abierto} titulo="Filtros" onCerrar={() => setAbierto(false)}>
                {grupos.map((g) => (
                    <View key={g.clave}>
                        <Text style={styles.grupoTitulo}>{g.titulo}</Text>
                        <View style={styles.opciones}>
                            {g.opciones.map((o) => {
                                const activo = o.valor === g.valor;
                                return (
                                    <Pressable
                                        key={o.valor}
                                        style={[styles.chip, activo && styles.chipActivo]}
                                        onPress={() => g.onCambio(o.valor)}
                                    >
                                        <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>
                                            {o.etiqueta}
                                            {o.cantidad !== undefined ? ` (${o.cantidad})` : ""}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                ))}

                <Pressable style={comunes.botonPrimario} onPress={() => setAbierto(false)}>
                    <Text style={comunes.botonPrimarioTexto}>Ver resultados</Text>
                </Pressable>
                <Pressable onPress={restablecer}>
                    <Text style={styles.restablecer}>Limpiar filtros</Text>
                </Pressable>
            </Panel>
        </View>
    );
}