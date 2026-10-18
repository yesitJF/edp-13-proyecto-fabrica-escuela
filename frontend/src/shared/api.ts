import type { ManagerFormData } from "./types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "https://edp-13-proyecto-fabrica-escuela.onrender.com").replace(/\/$/, "");
const ACTIVE_CLIENT_KEY = "banco-x-cliente-activo";
const ACCOUNTS_KEY = "banco-x-cuentas";
const AUTH_TOKEN_KEY = "banco-x-auth-token";

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

export type ApiCard = {
  id: number;
  ultimosCuatroDigitos: string;
  tipo: "DEBITO" | "CREDITO";
  estado: string;
  cuentaId: number;
  cupo?: number;
  cupoDisponible?: number;
  fechaCreacion?: string;
};

export type ApiTransaction = {
  id: number;
  referencia: string;
  tipo: "TRANSFERENCIA" | "RETIRO" | "CONSIGNACION";
  direccion?: "enviada" | "recibida";
  monto: number;
  cuentaOrigen: string;
  cuentaDestino: string;
  fecha: string;
  descripcion?: string;
  estado?: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  role: string;
};

export type ActiveClient = ApiClient & {
  nombre: string;
  iniciales: string;
};

type ApiError = { error?: string; mensaje?: string; message?: string };

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  const headers = new Headers(init?.headers ?? {});
  const token = getAuthToken();

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (!headers.has("Content-Type") && init?.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
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
    throw new Error(error.mensaje || error.message || error.error || `El backend rechazó la solicitud (${response.status}).`);
  }
  return data as T;
}

export async function login(username: string, password: string) {
  const response = await request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  setAuthToken(response.accessToken);
  return response;
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

export function getClientByIdentifier(identifier: string) {
  return request<ApiClient>(`/api/clientes/${encodeURIComponent(identifier)}`);
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

export function getAccounts() {
  return request<ApiAccount[]>("/api/cuentas");
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

export function createDebitCard(cuentaId: number) {
  return request<ApiCard>("/api/tarjetas/debito", {
    method: "POST",
    body: JSON.stringify({ cuentaId }),
  });
}

export function createCreditCard() {
  return request<ApiCard>("/api/tarjetas/credito", {
    method: "POST",
  });
}

export function getAccountHistory(numeroCuenta: string, desde?: string, hasta?: string) {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  const query = params.toString();
  return request<ApiTransaction[]>(`/api/transacciones/cuentas/${encodeURIComponent(numeroCuenta)}/historial${query ? `?${query}` : ""}`);
}

export function getTransactionDetail(identifier: string | number, numeroCuenta: string) {
  return request<ApiTransaction>(`/api/transacciones/${encodeURIComponent(String(identifier))}?cuenta=${encodeURIComponent(numeroCuenta)}`);
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
