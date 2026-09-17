import type { Transaccion } from "./types";

export const CEDULAS_EXISTENTES = ["1234567890", "9876543210", "1111111111"];

export const CLIENTE_ACTIVO = {
  id: "BX-M9K3A2-X7F",
  nombre: "Valentina Morales",
  cedula: "1023456789",
  email: "v.morales@email.com",
  estado: "Activo",
  iniciales: "VM",
  cuentas: [
    { numero: "301-847-2291-05", tipo: "Ahorros", saldo: 4_820_500 },
    { numero: "501-293-8841-17", tipo: "Corriente", saldo: 1_250_000 },
  ],
};

export const CUENTAS_SISTEMA: Record<string, { nombre: string; tipo: string; activa: boolean }> = {
  "301-847-2291-05": { nombre: "Valentina Morales", tipo: "Ahorros", activa: true },
  "501-293-8841-17": { nombre: "Valentina Morales", tipo: "Corriente", activa: true },
  "301-002-4419-88": { nombre: "Carlos Herrera", tipo: "Ahorros", activa: true },
  "501-774-3310-22": { nombre: "Lucía Fernández", tipo: "Corriente", activa: true },
  "301-558-7764-03": { nombre: "Jorge Medina", tipo: "Ahorros", activa: false },
  "501-001-0000-99": { nombre: "Ana Torres", tipo: "Corriente", activa: true },
};

export const HISTORIAL_INICIAL: Transaccion[] = [
  { id: "tx-001", fecha: "2026-09-08T14:23:00", tipo: "recibida", descripcion: "Transferencia de Carlos Herrera", monto: 500_000, cuentaOrigen: "301-002-4419-88", cuentaDestino: "301-847-2291-05", referencia: "REF-8812KA" },
  { id: "tx-002", fecha: "2026-09-07T09:10:00", tipo: "enviada", descripcion: "Pago a Lucía Fernández", monto: 120_000, cuentaOrigen: "301-847-2291-05", cuentaDestino: "501-774-3310-22", referencia: "REF-7741MX" },
  { id: "tx-003", fecha: "2026-09-05T18:45:00", tipo: "recibida", descripcion: "Transferencia de Ana Torres", monto: 800_000, cuentaOrigen: "501-001-0000-99", cuentaDestino: "501-293-8841-17", referencia: "REF-3309ZQ" },
];

export const CANALES_RETIRO = [
  { id: "cajero", label: "Cajero Automático", desc: "Retira en cualquier ATM Banco X con tu código", icon: "🏧" },
  { id: "ventanilla", label: "Ventanilla", desc: "Presentando tu documento en cualquier sucursal", icon: "🏦" },
  { id: "digital", label: "Billetera Digital", desc: "Transferencia a tu billetera vinculada (Nequi, Daviplata)", icon: "📱" },
];

export const CANALES_CONSIGNACION = [
  { id: "efectivo", label: "Efectivo en sucursal", desc: "Entrega el dinero en cualquier oficina Banco X", icon: "💵" },
  { id: "cheque", label: "Cheque", desc: "Cheques propios o de otros bancos (hasta 24 h hábiles)", icon: "📄" },
  { id: "pse", label: "PSE / Banca virtual", desc: "Desde otro banco directamente a tu cuenta", icon: "🔗" },
  { id: "corresponsal", label: "Corresponsal bancario", desc: "Puntos autorizados Éxito, Olímpica, Supermercados", icon: "🏪" },
];
