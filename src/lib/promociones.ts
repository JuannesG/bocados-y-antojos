export type Promo = {
    grupo: string;
    nombre: string;
    unidades: number;
    precio: number;
};

type Linea = { productoId: string; cantidad: number; precio: number };

export function calcularDescuento(
    lineas: Linea[],
    grupoDe: (productoId: string) => string | null,
    promos: Promo[]
) {
    let total = 0;
    const detalle: string[] = [];

    for (const promo of promos) {
        const delGrupo = lineas.filter((l) => grupoDe(l.productoId) === promo.grupo);
        const unidades = delGrupo.reduce((suma, l) => suma + l.cantidad, 0);
        if (unidades < promo.unidades) continue;

        const valorLista = delGrupo.reduce((suma, l) => suma + l.cantidad * l.precio, 0);
        const promedio = valorLista / unidades;
        const combos = Math.floor(unidades / promo.unidades);
        const porCombo = Math.max(0, promo.unidades * promedio - promo.precio);
        const descuento = Math.round(combos * porCombo);

        if (descuento > 0) {
            total += descuento;
            detalle.push(`${combos} × ${promo.nombre}`);
        }
    }

    return { total, detalle };
}