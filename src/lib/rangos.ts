import { hoy, fechaHace, inicioMes } from "./formato";

export const rangosPedidos = [
    { valor: "todas", etiqueta: "Todas las fechas" },
    { valor: "hoy", etiqueta: "Hoy" },
    { valor: "proximos", etiqueta: "Próximos" },
    { valor: "mes", etiqueta: "Este mes" },
];

export const rangosCompras = [
    { valor: "todas", etiqueta: "Todas las fechas" },
    { valor: "hoy", etiqueta: "Hoy" },
    { valor: "semana", etiqueta: "7 días" },
    { valor: "mes", etiqueta: "Este mes" },
];

export function enRango(fecha: string | null, rango: string) {
    if (rango === "todas") return true;
    if (!fecha) return false;
    if (rango === "hoy") return fecha === hoy();
    if (rango === "proximos") return fecha > hoy();
    if (rango === "semana") return fecha >= fechaHace(6) && fecha <= hoy();
    return fecha >= inicioMes() && fecha <= hoy();
}