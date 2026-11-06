import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { cargarResumen } from "../../lib/resumen";
import type { Resumen } from "../../lib/resumen";
import { hoy, pesos } from "../../lib/formato";
import { useBase } from "../../lib/diseno";
import TarjetaDato from "../TarjetaDato";
import BarrasDia from "../BarrasDia";
import FilaBarra from "../FilaBarra";
import { styles } from "../../styles/Reportes.styles";

type Props = { desde: string };

export default function ReporteVentas({ desde }: Props) {
    const base = useBase();
    const [resumen, setResumen] = useState<Resumen | null>(null);

    useEffect(() => {
        cargarResumen(desde, hoy()).then(setResumen);
    }, [desde]);

    const top = resumen?.topProductos ?? [];
    const maximo = Math.max(...top.map((p) => p.cantidad), 1);

    return (
        <View>
            <View style={styles.rejilla}>
                <TarjetaDato titulo="Ventas totales" valor={pesos(resumen?.ventas ?? 0)} icono="trending-up-outline" base={base} />
                <TarjetaDato titulo="Costo de productos" valor={pesos(resumen?.costo ?? 0)} icono="pricetag-outline" base={base} />
                <TarjetaDato titulo="Ganancia estimada" valor={pesos(resumen?.ganancia ?? 0)} icono="cash-outline" base={base} />
                <TarjetaDato titulo="Inversión (compras)" valor={pesos(resumen?.inversion ?? 0)} icono="wallet-outline" base={base} />
            </View>

            <View style={styles.caja}>
                <Text style={styles.subtitulo}>Ventas de la última semana</Text>
                <BarrasDia datos={resumen?.ultimosDias ?? []} />
            </View>

            <View style={styles.caja}>
                <Text style={styles.subtitulo}>Productos más vendidos</Text>
                {top.length === 0 ? (
                    <Text style={styles.vacio}>Aún no hay ventas en este periodo</Text>
                ) : (
                    top.map((p, i) => (
                        <FilaBarra
                            key={i}
                            etiqueta={p.nombre}
                            valor={`${p.cantidad} · ${pesos(p.ingreso)}`}
                            porcentaje={(p.cantidad / maximo) * 100}
                        />
                    ))
                )}
            </View>
        </View>
    );
}