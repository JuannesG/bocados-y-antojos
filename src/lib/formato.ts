export const pesos = (n: number) => "$" + Number(n).toLocaleString("es-CO");

export function hoy() {
    const d = new Date();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mes}-${dia}`;
}
