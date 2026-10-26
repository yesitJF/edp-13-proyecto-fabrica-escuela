import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";
import Sidebar from "../shared/Sidebar";
import {
  changeCredentials, createAccount, createClient, createCreditCard, createDebitCard,
  deposit, getAccount, getAccountHistory, getClientByIdentifier, getMe,
  getStoredClient, getTransactionDetail, login, logout, storeClient, transfer, withdraw,
  type ApiAccount, type ApiCard, type ApiClient, type ApiTransaction,
} from "../shared/api";
import type { ManagerFormData } from "../shared/types";

function Layout({ children, manager = false }: { children: ReactNode; manager?: boolean }) {
  const client = getStoredClient();
  const navigate = useNavigate();
  const navItems = manager
    ? [{ id: "clientes", label: "Consultar clientes", icon: "👥" }, { id: "nuevo", label: "Registrar cliente", icon: "➕" }]
    : [{ id: "inicio", label: "Inicio", icon: "⌂" }, { id: "cuentas", label: "Abrir cuenta", icon: "▣" }, { id: "saldo", label: "Consultar saldo", icon: "$" }, { id: "historial", label: "Historial", icon: "≡" }, { id: "tarjetas", label: "Tarjetas", icon: "▤" }, { id: "transferencias", label: "Transferencias", icon: "⇄" }, { id: "retiros", label: "Retiros", icon: "−" }, { id: "consignaciones", label: "Consignaciones", icon: "+" }, { id: "seguridad", label: "Seguridad", icon: "⚿" }];
  const routes: Record<string, string> = manager
    ? { clientes: "/gestor/clientes", nuevo: "/gestor/clientes/nuevo" }
    : { inicio: "/inicio", cuentas: "/cuentas/nueva", saldo: "/cuentas/saldo", historial: "/cuentas/historial", tarjetas: "/tarjetas/debito", transferencias: "/transferencias", retiros: "/retiros", consignaciones: "/consignaciones", seguridad: "/perfil/seguridad" };
  return <div className="flex h-full min-h-screen overflow-hidden bg-bg-base">
    <Sidebar navItems={navItems.map((item) => ({ ...item, icon: <span>{item.icon}</span> }))} activeNav="" onNav={(id) => navigate(routes[id])} userLabel={client ? `${client.primerNombre} ${client.primerApellido}` : "Sesión activa"} userSub={client?.cedula ?? "Usuario autenticado"} userInitials={client ? `${client.primerNombre[0]}${client.primerApellido[0]}` : "BX"} badge={manager ? "Plataforma Gestión" : "Banca Personal"} />
    <main className="flex-1 overflow-y-auto p-8 text-text-primary"><div className="mx-auto mb-5 flex max-w-4xl justify-end"><button type="button" onClick={() => navigate("/inicio/logout")} className="rounded-lg border border-border px-3 py-2 text-sm text-text-muted hover:text-white">Cerrar sesión</button></div>{children}</main>
  </div>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="max-w-4xl mx-auto rounded-2xl border border-border bg-bg-surface/70 p-6 shadow-xl"><h1 className="text-2xl font-bold text-purple-100 mb-5">{title}</h1>{children}</section>;
}
function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label className="block text-sm text-text-muted mb-4">{label}<input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-bg-base px-3 py-2 text-text-primary outline-none focus:border-purple-400" /></label>;
}
function Submit({ children = "Guardar" }: { children?: ReactNode }) { return <button className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-500" type="submit">{children}</button>; }
function ErrorMessage({ error }: { error: string }) { return error ? <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null; }

export function LoginView() {
  const navigate = useNavigate();
  const [username, setUsername] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    try { const result = await login(username, password); const me = await getMe(); if (result.role === "GESTOR" && me.idCliente) storeClient(await getClientByIdentifier(me.idCliente)); navigate(result.role === "GESTOR" ? "/gestor/clientes" : "/inicio"); }
    catch (err) { setError(err instanceof Error ? err.message : "No fue posible iniciar sesión."); }
  }
  return <div className="flex min-h-screen items-center justify-center bg-bg-base p-6"><Panel title="Banco X — Iniciar sesión"><form onSubmit={submit}><Field label="Usuario" value={username} onChange={setUsername} /><Field label="Contraseña" type="password" value={password} onChange={setPassword} /><ErrorMessage error={error} /><Submit>Ingresar</Submit></form></Panel></div>;
}

export function LogoutView() {
  const navigate = useNavigate();
  useEffect(() => { void logout().finally(() => navigate("/login", { replace: true })); }, [navigate]);
  return <div className="p-8 text-text-primary">Cerrando sesión...</div>;
}

export function DashboardView() {
  const navigate = useNavigate(); const [accounts, setAccounts] = useState<ApiAccount[]>([]); const [error, setError] = useState("");
  useEffect(() => { getAccounts().then(setAccounts).catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar las cuentas.")); }, []);
  return <Layout><Panel title="Panel principal"><p className="mb-4 text-text-muted">Consulta y administra tus productos bancarios.</p><ErrorMessage error={error} /><div className="grid gap-3 md:grid-cols-2">{accounts.map((account) => <div key={account.id} className="rounded-xl border border-border p-4"><p className="text-text-muted">{account.tipo}</p><p className="text-lg">{account.numeroCuenta}</p><p className="text-2xl font-bold text-purple-200">${Number(account.saldo).toLocaleString("es-CO")}</p></div>)}</div><button onClick={() => navigate("/cuentas/nueva")} className="mt-5 rounded-lg bg-purple-600 px-4 py-2 text-white">Abrir nueva cuenta</button></Panel></Layout>;
}

export function AccountView() {
  const client = getStoredClient(); const [type, setType] = useState<"AHORROS" | "CORRIENTE">("AHORROS"); const [result, setResult] = useState<ApiAccount>(); const [error, setError] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); try { setResult(await createAccount(client?.id, type)); } catch (err) { setError(err instanceof Error ? err.message : "No fue posible abrir la cuenta."); } }
  return <Layout><Panel title="Abrir nueva cuenta"><form onSubmit={submit}><label className="block mb-4 text-text-muted">Tipo<select value={type} onChange={(e) => setType(e.target.value as "AHORROS" | "CORRIENTE")} className="mt-1 w-full rounded-lg border border-border bg-bg-base p-2 text-text-primary"><option value="AHORROS">Ahorros</option><option value="CORRIENTE">Corriente</option></select></label><ErrorMessage error={error} /><Submit>Crear cuenta</Submit></form>{result && <p className="mt-5 text-emerald-300">Cuenta creada: {result.numeroCuenta}</p>}</Panel></Layout>;
}

export function BalanceView() {
  const [number, setNumber] = useState(""); const [account, setAccount] = useState<ApiAccount>(); const [error, setError] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); try { setError(""); setAccount(await getAccount(number)); } catch (err) { setAccount(undefined); setError(err instanceof Error ? err.message : "Cuenta no encontrada."); } }
  return <Layout><Panel title="Consultar saldo"><form onSubmit={submit}><Field label="Número de cuenta" value={number} onChange={setNumber} /><ErrorMessage error={error} /><Submit>Consultar</Submit></form>{account && <div className="mt-6 rounded-xl border border-emerald-500/30 p-4"><p>{account.numeroCuenta} · {account.tipo}</p><p className="text-3xl font-bold text-emerald-300">${Number(account.saldo).toLocaleString("es-CO")}</p></div>}</Panel></Layout>;
}

export function TransactionForm({ kind }: { kind: "transfer" | "withdraw" | "deposit" }) {
  const [origin, setOrigin] = useState(""); const [destination, setDestination] = useState(""); const [amount, setAmount] = useState(""); const [description, setDescription] = useState(""); const [result, setResult] = useState<ApiTransaction>(); const [error, setError] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); try { const value = Number(amount); const response = kind === "transfer" ? await transfer(origin, destination, value, description) : kind === "withdraw" ? await withdraw(origin, value) : await deposit(destination, value, description); setResult(response); setError(""); } catch (err) { setError(err instanceof Error ? err.message : "No fue posible registrar la operación."); } }
  return <Layout><Panel title={kind === "transfer" ? "Transferencia" : kind === "withdraw" ? "Retiro" : "Consignación"}><form onSubmit={submit}>{kind !== "deposit" && <Field label="Cuenta origen" value={origin} onChange={setOrigin} />}{kind !== "withdraw" && <Field label="Cuenta destino" value={destination} onChange={setDestination} />}<Field label="Monto" type="number" value={amount} onChange={setAmount} />{kind !== "withdraw" && <Field label="Descripción o remitente" value={description} onChange={setDescription} />}<ErrorMessage error={error} /><Submit>Confirmar operación</Submit></form>{result && <p className="mt-5 text-emerald-300">Operación registrada: {result.referencia}</p>}</Panel></Layout>;
}

export function HistoryView() {
  const [account, setAccount] = useState(""); const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [items, setItems] = useState<ApiTransaction[]>([]); const [error, setError] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); try { setItems(await getAccountHistory(account, from || undefined, to || undefined)); setError(""); } catch (err) { setError(err instanceof Error ? err.message : "No fue posible consultar el historial."); } }
  return <Layout><Panel title="Historial de transacciones"><form onSubmit={submit} className="grid gap-2 md:grid-cols-4"><Field label="Cuenta" value={account} onChange={setAccount} /><Field label="Desde" type="date" value={from} onChange={setFrom} /><Field label="Hasta" type="date" value={to} onChange={setTo} /><div className="self-end"><Submit>Consultar</Submit></div></form><ErrorMessage error={error} /><div className="mt-5 space-y-2">{items.map((item) => <div key={item.id} className="rounded-lg border border-border p-3"><b>{item.tipo}</b> · ${Number(item.monto).toLocaleString("es-CO")} · {new Date(item.fecha).toLocaleString("es-CO")}<span className="block text-sm text-text-muted">{item.referencia} · {item.cuentaOrigen} → {item.cuentaDestino}</span></div>)}</div></Panel></Layout>;
}

export function DetailView() {
  const [params] = useSearchParams(); const [account, setAccount] = useState(""); const [item, setItem] = useState<ApiTransaction>(); const [error, setError] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); try { setItem(await getTransactionDetail(params.get("id") ?? "", account)); setError(""); } catch (err) { setError(err instanceof Error ? err.message : "Transacción no encontrada."); } }
  return <Layout><Panel title="Detalle de transacción"><form onSubmit={submit}><Field label="Cuenta asociada" value={account} onChange={setAccount} /><ErrorMessage error={error} /><Submit>Consultar detalle</Submit></form>{item && <pre className="mt-5 whitespace-pre-wrap rounded-xl border border-border p-4 text-sm">{JSON.stringify(item, null, 2)}</pre>}</Panel></Layout>;
}

export function CardView({ credit = false }: { credit?: boolean }) {
  const [accountId, setAccountId] = useState(""); const [card, setCard] = useState<ApiCard>(); const [error, setError] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); try { setCard(credit ? await createCreditCard() : await createDebitCard(Number(accountId))); } catch (err) { setError(err instanceof Error ? err.message : "No fue posible emitir la tarjeta."); } }
  return <Layout><Panel title={credit ? "Tarjeta de crédito" : "Tarjeta de débito"}><form onSubmit={submit}>{!credit && <Field label="ID de cuenta activa" type="number" value={accountId} onChange={setAccountId} />}<ErrorMessage error={error} /><Submit>Solicitar tarjeta</Submit></form>{card && <p className="mt-5 text-emerald-300">Tarjeta {card.tipo} terminada en {card.ultimosCuatroDigitos}</p>}</Panel></Layout>;
}

export function CredentialsView() {
  const [current, setCurrent] = useState(""); const [username, setUsername] = useState(""); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  async function submit(event: FormEvent) { event.preventDefault(); try { await changeCredentials(current, username, password, confirm); setMessage("Credenciales actualizadas correctamente."); setError(""); } catch (err) { setError(err instanceof Error ? err.message : "No fue posible cambiar las credenciales."); } }
  return <Layout><Panel title="Cambiar usuario o contraseña"><form onSubmit={submit}><Field label="Clave actual" type="password" value={current} onChange={setCurrent} /><Field label="Nuevo usuario (opcional)" value={username} onChange={setUsername} /><Field label="Nueva contraseña (opcional)" type="password" value={password} onChange={setPassword} /><Field label="Confirmar nueva contraseña" type="password" value={confirm} onChange={setConfirm} /><ErrorMessage error={error} /><Submit>Guardar cambios</Submit></form>{message && <p className="mt-4 text-emerald-300">{message}</p>}</Panel></Layout>;
}

const emptyForm: ManagerFormData = { cedula: "", primerNombre: "", segundoNombre: "", primerApellido: "", segundoApellido: "", fechaNacimiento: "", genero: "", email: "", telefono: "", direccion: "", ciudad: "", departamento: "" };
export function ManagerLookupView({ create = false }: { create?: boolean }) {
  const [identifier, setIdentifier] = useState(""); const [client, setClient] = useState<ApiClient>(); const [form, setForm] = useState(emptyForm); const [error, setError] = useState(""); const [message, setMessage] = useState(""); const [credentials, setCredentials] = useState<{ username: string; password: string }>();
  async function lookup(event: FormEvent) { event.preventDefault(); try { setClient(await getClientByIdentifier(identifier)); setError(""); } catch (err) { setClient(undefined); setError(err instanceof Error ? err.message : "Cliente no encontrado."); } }
  async function save(event: FormEvent) { event.preventDefault(); try { const saved = await createClient(form); storeClient(saved); setCredentials({ username: saved.cedula, password: saved.idCliente }); setMessage(`Cliente creado: ${saved.idCliente}`); setError(""); } catch (err) { setError(err instanceof Error ? err.message : "No fue posible registrar el cliente."); } }
  return <Layout manager><Panel title={create ? "Registrar cliente" : "Consultar cliente"}>{create ? <form onSubmit={save}>{(["cedula", "primerNombre", "segundoNombre", "primerApellido", "segundoApellido", "fechaNacimiento", "genero", "email", "telefono", "direccion", "ciudad", "departamento"] as (keyof ManagerFormData)[]).map((key) => <Field key={key} label={key} type={key === "fechaNacimiento" ? "date" : "text"} value={form[key]} onChange={(value) => setForm({ ...form, [key]: value })} />)}<ErrorMessage error={error} /><Submit>Registrar cliente</Submit></form> : <form onSubmit={lookup}><Field label="Cédula o identificador" value={identifier} onChange={setIdentifier} /><ErrorMessage error={error} /><Submit>Buscar</Submit></form>}{client && <pre className="mt-5 whitespace-pre-wrap rounded-xl border border-border p-4 text-sm">{JSON.stringify(client, null, 2)}</pre>}{message && <p className="mt-4 text-emerald-300">{message}</p>}{credentials && <div className="mt-4 rounded-lg border border-purple-400/30 bg-purple-500/10 p-4 text-sm text-purple-100"><p>Credenciales iniciales del cliente:</p><p>Usuario: <strong>{credentials.username}</strong></p><p>Contraseña: <strong>{credentials.password}</strong></p></div>}</Panel></Layout>;
}
