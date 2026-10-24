export const pesos = (n: number) => "$" + Number(n).toLocaleString("es-CO");

function aTexto(d: Date) {
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function hoy() {
  return aTexto(new Date());
}

export function fechaHace(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return aTexto(d);
}

export function inicioMes() {
  const d = new Date();
  d.setDate(1);
  return aTexto(d);
}

export function nombreDia(fecha: string) {
  const dias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return dias[new Date(fecha + "T00:00:00").getDay()];
}
