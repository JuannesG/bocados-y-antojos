import { supabase } from "./supabase";
import { fechaHace, nombreDia } from "./formato";

export type DiaVenta = { etiqueta: string; valor: number };
export type TopProducto = { nombre: string; cantidad: number; ingreso: number };
export type Resumen = {
    ventas: number;
    costo: number;
    ganancia: number;
    inversion: number;
    ultimosDias: DiaVenta[];
    topProductos: TopProducto[];
};

export async function cargarResumen(
    desde: string,
    hasta: string,
): Promise<Resumen> {
    const desdeConsulta = desde < fechaHace(6) ? desde : fechaHace(6);

    const [ventasRes, comprasRes] = await Promise.all([
        supabase
            .from("ventas_detalle")
            .select("fecha, producto, cantidad, ingreso, costo")
            .gte("fecha", desdeConsulta)
            .lte("fecha", hasta),
        supabase
            .from("compras")
            .select("total")
            .gte("fecha", desde)
            .lte("fecha", hasta),
    ]);

    let ventas = 0;
    let costo = 0;
    const porFecha: Record<string, number> = {};
    const porProducto: Record<string, TopProducto> = {};

    (ventasRes.data ?? []).forEach((f) => {
        const ingreso = Number(f.ingreso);
        porFecha[f.fecha] = (porFecha[f.fecha] ?? 0) + ingreso;

        if (f.fecha >= desde) {
            ventas += ingreso;
            costo += Number(f.costo);
            const p = porProducto[f.producto] ?? {
                nombre: f.producto,
                cantidad: 0,
                ingreso: 0,
            };
            p.cantidad += Number(f.cantidad);
            p.ingreso += ingreso;
            porProducto[f.producto] = p;
        }
    });

    const inversion = (comprasRes.data ?? []).reduce(
        (suma, c) => suma + Number(c.total),
        0,
    );

    const ultimosDias: DiaVenta[] = [];
    for (let i = 6; i >= 0; i--) {
        const fecha = fechaHace(i);
        ultimosDias.push({
            etiqueta: nombreDia(fecha),
            valor: porFecha[fecha] ?? 0,
        });
    }

    const topProductos = Object.values(porProducto)
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);

    return {
        ventas,
        costo,
        ganancia: ventas - costo,
        inversion,
        ultimosDias,
        topProductos,
    };
}
