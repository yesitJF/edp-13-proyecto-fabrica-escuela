import type { ManagerFormData } from "./types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "https://edp-13-proyecto-fabrica-escuela.onrender.com").replace(/\/$/, "");
const AUTH_TOKEN_KEY = "banco-x-auth-token";
const ACTIVE_CLIENT_KEY = "banco-x-cliente-activo";

export type ApiClient = {
  id: number; idCliente: string; cedula: string; primerNombre: string; segundoNombre?: string;
  primerApellido: string; segundoApellido?: string; email?: string; activo: boolean;
};
export type ApiAccount = {
  id: number; numeroCuenta: string; tipo: "AHORROS" | "CORRIENTE"; saldo: number; activa: boolean; idCliente: string;
};
export type ApiCard = {
  id: number; ultimosCuatroDigitos: string; tipo: "DEBITO" | "CREDITO"; estado: string;
  cuentaId: number; cupo?: number; cupoDisponible?: number; fechaCreacion?: string;
};
export type ApiTransaction = {
  id: number; referencia: string; tipo: "TRANSFERENCIA" | "RETIRO" | "CONSIGNACION";
  direccion?: "enviada" | "recibida"; monto: number; cuentaOrigen: string; cuentaDestino: string;
  fecha: string; descripcion?: string; estado?: string;
};
export type LoginResponse = { accessToken: string; tokenType: string; expiresIn: number; role: "CLIENTE" | "GESTOR" };
export type MeResponse = { username: string; role: "CLIENTE" | "GESTOR"; idCliente?: string; nombre: string };
type ApiError = { error?: string; mensaje?: string; message?: string };

export function getAuthToken() { return localStorage.getItem(AUTH_TOKEN_KEY); }
export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(ACTIVE_CLIENT_KEY);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const token = getAuthToken();
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  if (init?.body !== undefined && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new Error("No fue posible conectar con el backend. Verifica la URL y CORS.");
  }
  const text = await response.text();
  let data: T | ApiError = {} as T;
  if (text) {
    try { data = JSON.parse(text) as T | ApiError; } catch { data = { mensaje: text }; }
  }
  if (!response.ok) {
    const error = data as ApiError;
    throw new Error(error.mensaje || error.message || error.error || `El backend rechazó la solicitud (${response.status}).`);
  }
  return data as T;
}

export async function login(username: string, password: string) {
  const response = await request<LoginResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
  localStorage.setItem(AUTH_TOKEN_KEY, response.accessToken);
  return response;
}
export function logout() {
  const token = getAuthToken();
  clearAuthToken();
  if (!token) return Promise.resolve();
  return request<void>("/api/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
}
export function getMe() { return request<MeResponse>("/api/auth/me"); }
export function changeCredentials(currentPassword: string, newUsername?: string, newPassword?: string, confirmNewPassword?: string) {
  return request<void>("/api/auth/credentials", { method: "PUT", body: JSON.stringify({
    currentPassword, newUsername: newUsername || null, newPassword: newPassword || null, confirmNewPassword: confirmNewPassword || null,
  }) });
}
export function createClient(form: ManagerFormData) {
  return request<ApiClient>("/api/clientes", { method: "POST", body: JSON.stringify({ ...form, cedula: form.cedula.replace(/\D/g, "") }) });
}
export function getClientByIdentifier(identifier: string) { return request<ApiClient>(`/api/clientes/${encodeURIComponent(identifier)}`); }
export function createClientUser(clienteId: number, username: string, password: string) {
  return request<void>("/api/usuarios/clientes", { method: "POST", body: JSON.stringify({ clienteId, username, password }) });
}
export function createAccount(clienteId: number | undefined, tipo: "AHORROS" | "CORRIENTE") {
  return request<ApiAccount>("/api/cuentas", { method: "POST", body: JSON.stringify({ ...(clienteId === undefined ? {} : { clienteId }), tipo }) });
}
export function getAccount(numero: string) { return request<ApiAccount>(`/api/cuentas/${encodeURIComponent(numero)}`); }
export function getAccounts() { return request<ApiAccount[]>("/api/cuentas"); }
export function getAccountsByClient(clienteId: number) { return request<ApiAccount[]>(`/api/cuentas/cliente/${clienteId}`); }
export function transfer(cuentaOrigen: string, cuentaDestino: string, monto: number, concepto: string) {
  return request<ApiTransaction>("/api/transacciones/transferencia", { method: "POST", body: JSON.stringify({ cuentaOrigen, cuentaDestino, monto, concepto: concepto || null }) });
}
export function withdraw(numeroCuenta: string, monto: number) {
  return request<ApiTransaction>("/api/transacciones/retiro", { method: "POST", body: JSON.stringify({ numeroCuenta, monto }) });
}
export function deposit(cuentaDestino: string, monto: number, remitente: string) {
  return request<ApiTransaction>("/api/transacciones/consignacion", { method: "POST", body: JSON.stringify({ cuentaDestino, monto, remitente: remitente || null }) });
}
export function createDebitCard(cuentaId: number) { return request<ApiCard>("/api/tarjetas/debito", { method: "POST", body: JSON.stringify({ cuentaId }) }); }
export function createCreditCard() { return request<ApiCard>("/api/tarjetas/credito", { method: "POST" }); }
export function getAccountHistory(numeroCuenta: string, desde?: string, hasta?: string) {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  const query = params.toString();
  return request<ApiTransaction[]>(`/api/transacciones/cuentas/${encodeURIComponent(numeroCuenta)}/historial${query ? `?${query}` : ""}`);
}
export function getTransactionDetail(identifier: string | number, numeroCuenta?: string) {
  const query = numeroCuenta ? `?cuenta=${encodeURIComponent(numeroCuenta)}` : "";
  return request<ApiTransaction>(`/api/transacciones/${encodeURIComponent(String(identifier))}${query}`);
}
export function storeClient(client: ApiClient) { localStorage.setItem(ACTIVE_CLIENT_KEY, JSON.stringify(client)); }
export function getStoredClient(): ApiClient | null {
  const value = localStorage.getItem(ACTIVE_CLIENT_KEY);
  return value ? JSON.parse(value) as ApiClient : null;
}
