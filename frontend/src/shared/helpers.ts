import { CEDULAS_EXISTENTES, CUENTAS_SISTEMA } from "./data";

export function validarCedula(cedula: string): { valid: boolean; error?: string } {
  const limpia = cedula.replace(/\D/g, "");
  if (!limpia) return { valid: false, error: "La cédula es requerida." };
  if (limpia.length < 6 || limpia.length > 10)
    return { valid: false, error: "La cédula debe tener entre 6 y 10 dígitos." };
  if (CEDULAS_EXISTENTES.includes(limpia))
    return { valid: false, error: "Ya existe un cliente registrado con esta cédula." };
  return { valid: true };
}

export function generarIdCliente(): string {
  return "BX-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 5).toUpperCase();
}

export function generarNumeroCuenta(tipo: string): string {
  const prefijo = tipo === "ahorros" ? "301" : "501";
  const mid = Math.floor(Math.random() * 900 + 100) + "-" + Math.floor(Math.random() * 9000 + 1000);
  const sufijo = Math.floor(Math.random() * 90 + 10);
  return `${prefijo}-${mid}-${sufijo}`;
}

export function generarRef(): string {
  return "REF-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function fmtCOP(n: number): string {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);
}

export function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatMonto(val: string): string {
  const digits = val.replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("es-CO") : "";
}

export function buscarCuentaDestino(num: string, cuentasPropias: { numero: string; tipo: string; saldo: number }[], nombreCliente: string) {
  const propia = cuentasPropias.find((c) => c.numero === num);
  if (propia) return { nombre: nombreCliente, tipo: propia.tipo, activa: true };
  return CUENTAS_SISTEMA[num] ?? null;
}
