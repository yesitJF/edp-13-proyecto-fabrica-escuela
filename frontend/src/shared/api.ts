import type { ManagerFormData } from "./types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "https://edp-13-proyecto-fabrica-escuela.onrender.com").replace(/\/$/, "");
const ACTIVE_CLIENT_KEY = "banco-x-cliente-activo";
const ACCOUNTS_KEY = "banco-x-cuentas";

export type ApiClient = {
  id: number;
  idCliente: string;
  cedula: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  email?: string;
  activo: boolean;
};

export type ApiAccount = {
  id: number;
  numeroCuenta: string;
  tipo: "AHORROS" | "CORRIENTE";
  saldo: number;
  activa: boolean;
  idCliente: string;
};

export type ApiTransaction = {
  id: number;
  referencia: string;
  tipo: "TRANSFERENCIA" | "RETIRO" | "CONSIGNACION";
  monto: number;
  cuentaOrigen: string;
  cuentaDestino: string;
  fecha: string;
  descripcion?: string;
};

export type ActiveClient = ApiClient & {
  nombre: string;
  iniciales: string;
};

type ApiError = { error?: string; mensaje?: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new Error("No fue posible conectar con el backend. Verifica la URL configurada y CORS.");
  }

  const text = await response.text();
  let data: T | ApiError = {} as T;
  if (text) {
    try {
      data = JSON.parse(text) as T | ApiError;
    } catch {
      data = { mensaje: text };
    }
  }
  if (!response.ok) {
    const error = data as ApiError;
    throw new Error(error.mensaje || error.error || `El backend rechazó la solicitud (${response.status}).`);
  }
  return data as T;
}

export function createClient(form: ManagerFormData) {
  return request<ApiClient>("/api/clientes", {
    method: "POST",
    body: JSON.stringify({
      ...form,
      cedula: form.cedula.replace(/\D/g, ""),
      segundoNombre: form.segundoNombre || null,
      segundoApellido: form.segundoApellido || null,
      genero: form.genero || null,
      email: form.email || null,
      telefono: form.telefono || null,
      direccion: form.direccion || null,
      ciudad: form.ciudad || null,
      departamento: form.departamento || null,
    }),
  });
}

export function createAccount(clienteId: number, tipo: "AHORROS" | "CORRIENTE") {
  return request<ApiAccount>("/api/cuentas", {
    method: "POST",
    body: JSON.stringify({ clienteId, tipo }),
  });
}

export function getAccount(numero: string) {
  return request<ApiAccount>(`/api/cuentas/${encodeURIComponent(numero)}`);
}

export function getAccountsByClient(clienteId: number) {
  return request<ApiAccount[]>(`/api/cuentas/cliente/${clienteId}`);
}

export function transfer(cuentaOrigen: string, cuentaDestino: string, monto: number, concepto: string) {
  return request<ApiTransaction>("/api/transacciones/transferencia", {
    method: "POST",
    body: JSON.stringify({ cuentaOrigen, cuentaDestino, monto, concepto: concepto || null }),
  });
}

export function withdraw(numeroCuenta: string, monto: number) {
  return request<ApiTransaction>("/api/transacciones/retiro", {
    method: "POST",
    body: JSON.stringify({ numeroCuenta, monto }),
  });
}

export function deposit(cuentaDestino: string, monto: number, remitente: string) {
  return request<ApiTransaction>("/api/transacciones/consignacion", {
    method: "POST",
    body: JSON.stringify({ cuentaDestino, monto, remitente: remitente || null }),
  });
}

export function getStoredClient(): ApiClient | null {
  try {
    const value = localStorage.getItem(ACTIVE_CLIENT_KEY);
    return value ? (JSON.parse(value) as ApiClient) : null;
  } catch {
    return null;
  }
}

export function getActiveClient(): ActiveClient | null {
  const client = getStoredClient();
  if (!client) return null;
  const nombre = [client.primerNombre, client.segundoNombre, client.primerApellido, client.segundoApellido]
    .filter(Boolean)
    .join(" ");
  return {
    ...client,
    nombre,
    iniciales: `${client.primerNombre[0] ?? ""}${client.primerApellido[0] ?? ""}`.toUpperCase(),
  };
}

export function toCuenta(account: ApiAccount) {
  return {
    numero: account.numeroCuenta,
    tipo: account.tipo === "AHORROS" ? "Ahorros" : "Corriente",
    saldo: account.saldo,
  };
}

export function storeClient(client: ApiClient) {
  localStorage.setItem(ACTIVE_CLIENT_KEY, JSON.stringify(client));
}

export function getStoredAccounts(): ApiAccount[] {
  try {
    const value = localStorage.getItem(ACCOUNTS_KEY);
    return value ? (JSON.parse(value) as ApiAccount[]) : [];
  } catch {
    return [];
  }
}

export function storeAccount(account: ApiAccount) {
  const accounts = getStoredAccounts().filter((item) => item.numeroCuenta !== account.numeroCuenta);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
}
