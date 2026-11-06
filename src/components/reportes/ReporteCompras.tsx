import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { supabase } from "../../lib/supabase";
import { hoy, pesos } from "../../lib/formato";
import { useBase } from "../../lib/diseno";
import TarjetaDato from "../TarjetaDato";
import FilaBarra from "../FilaBarra";
import { styles } from "../../styles/Reportes.styles";

type Props = { desde: string };
type Grupo = { nombre: string; total: number; veces: number };

export default function ReporteCompras({ desde }: Props) {
    const base = useBase();
    const [total, setTotal] = useState(0);
    const [cantidad, setCantidad] = useState(0);
    const [lugares, setLugares] = useState<Grupo[]>([]);
    const [materiales, setMateriales] = useState<Grupo[]>([]);

    useEffect(() => {
        async function cargar() {
            const [facs, comps, mats] = await Promise.all([
                supabase
                    .from("facturas")
                    .select("id, proveedor")
                    .gte("fecha", desde)
                    .lte("fecha", hoy()),
                supabase
                    .from("compras")
                    .select("factura_id, material_id, total")
                    .gte("fecha", desde)
                    .lte("fecha", hoy()),
                supabase.from("materiales").select("id, nombre"),
            ]);

            const proveedorDe: Record<string, string> = {};
            (facs.data ?? []).forEach((f) => {
                proveedorDe[f.id] = f.proveedor;
            });
            const nombreDe: Record<string, string> = {};
            (mats.data ?? []).forEach((m) => {
                nombreDe[m.id] = m.nombre;
            });

            let suma = 0;
            const porLugar: Record<string, Grupo> = {};
            const porMaterial: Record<string, Grupo> = {};

            (comps.data ?? []).forEach((c) => {
                const t = Number(c.total);
                suma += t;

                const lugar = proveedorDe[c.factura_id] ?? "Sin lugar";
                const l = porLugar[lugar] ?? { nombre: lugar, total: 0, veces: 0 };
                l.total += t;
                porLugar[lugar] = l;

                const mat = nombreDe[c.material_id] ?? "—";
                const m = porMaterial[mat] ?? { nombre: mat, total: 0, veces: 0 };
                m.total += t;
                m.veces += 1;
                porMaterial[mat] = m;
            });

            (facs.data ?? []).forEach((f) => {
                if (porLugar[f.proveedor]) porLugar[f.proveedor].veces += 1;
            });

            const ordenar = (o: Record<string, Grupo>) =>
                Object.values(o)
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 6);

            setTotal(suma);
            setCantidad((facs.data ?? []).length);
            setLugares(ordenar(porLugar));
            setMateriales(ordenar(porMaterial));
        }
        cargar();
    }, [desde]);

    const maxLugar = Math.max(...lugares.map((l) => l.total), 1);
    const maxMaterial = Math.max(...materiales.map((m) => m.total), 1);

    return (
        <View>
            <View style={styles.rejilla}>
                <TarjetaDato titulo="Total comprado" valor={pesos(total)} icono="wallet-outline" base={base} />
                <TarjetaDato titulo="Compras realizadas" valor={String(cantidad)} icono="cart-outline" base={base} />
                <TarjetaDato
                    titulo="Promedio por compra"
                    valor={pesos(cantidad > 0 ? total / cantidad : 0)}
                    icono="calculator-outline"
                    base={base}
                />
                <TarjetaDato
                    titulo="Lugar más frecuente"
                    valor={lugares[0]?.nombre ?? "—"}
                    icono="storefront-outline"
                    base={base}
                />
            </View>

            <View style={styles.caja}>
                <Text style={styles.subtitulo}>Dónde gastas más</Text>
                {lugares.length === 0 ? (
                    <Text style={styles.vacio}>Aún no hay compras en este periodo</Text>
                ) : (
                    lugares.map((l, i) => (
                        <FilaBarra
                            key={i}
                            etiqueta={l.nombre}
                            valor={pesos(l.total)}
                            porcentaje={(l.total / maxLugar) * 100}
                            detalle={`${l.veces} ${l.veces === 1 ? "compra" : "compras"}`}
                        />
                    ))
                )}
            </View>

            <View style={styles.caja}>
                <Text style={styles.subtitulo}>Materiales con más gasto</Text>
                {materiales.length === 0 ? (
                    <Text style={styles.vacio}>Aún no hay compras en este periodo</Text>
                ) : (
                    materiales.map((m, i) => (
                        <FilaBarra
                            key={i}
                            etiqueta={m.nombre}
                            valor={pesos(m.total)}
                            porcentaje={(m.total / maxMaterial) * 100}
                        />
                    ))
                )}
            </View>
        </View>
    );
}