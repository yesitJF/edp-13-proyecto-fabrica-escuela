import { useEffect, useState } from "react";
import Sidebar from "../shared/Sidebar";
import { IcoDash, IcoCuentas, IcoTransfer, IcoPagos, IcoPrestamos, IcoInversiones, IcoExtractos, IcoChevron, IcoAlert, IcoInfo, IcoShield } from "../shared/icons";
import { fmtCOP, fmtFecha, generarRef } from "../shared/helpers";
import { HISTORIAL_INICIAL, CANALES_CONSIGNACION } from "../shared/data";
import { deposit, getAccount, getAccountsByClient, getActiveClient, getStoredAccounts, storeAccount, toCuenta } from "../shared/api";
import type { Cuenta, Transaccion } from "../shared/types";

const CLIENT_NAV = [
  { id: "inicio", label: "Inicio", icon: <IcoDash /> },
  { id: "cuentas", label: "Mis Cuentas", icon: <IcoCuentas /> },
  { id: "transferencias", label: "Transferencias", icon: <IcoTransfer /> },
  { id: "pagos", label: "Pagos", icon: <IcoPagos /> },
  { id: "prestamos", label: "Préstamos", icon: <IcoPrestamos /> },
  { id: "inversiones", label: "Inversiones", icon: <IcoInversiones /> },
  { id: "extractos", label: "Extractos", icon: <IcoExtractos /> },
];

type DpStep = "form" | "confirm" | "success";

const STEPS = [
  { key: "form", label: "Datos de la consignación", num: 1 },
  { key: "confirm", label: "Confirmar operación", num: 2 },
  { key: "success", label: "Consignación registrada", num: 3 },
];

function Stepper({ step }: { step: DpStep }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done = (step === "confirm" && s.key === "form") || (step === "success" && s.key !== "success");
        const active = step === s.key;
        return (
          <div key={s.key} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold" style={{ background: done ? "rgba(16,185,129,0.2)" : active ? "linear-gradient(135deg,#6d28d9,#a855f7)" : "rgba(139,92,246,0.1)", color: done ? "#10b981" : active ? "#fff" : "#7c6fa0", border: done ? "1px solid rgba(16,185,129,0.4)" : active ? "none" : "1px solid rgba(139,92,246,0.2)", fontFamily: "Instrument Sans,sans-serif" }}>
                {done ? "✓" : s.num}
              </div>
              <span className="text-xs font-medium" style={{ color: active ? "#c4b5fd" : done ? "#10b981" : "#7c6fa0" }}>{s.label}</span>
            </div>
            {i < 2 && <div className="w-10 h-px mx-3" style={{ background: done ? "rgba(16,185,129,0.4)" : "rgba(139,92,246,0.15)" }} />}
          </div>
        );
      })}
    </div>
  );
}

function buscarCuentaDeposito(num: string, cuentas: Cuenta[], nombreCliente: string): { nombre: string; tipo: string; activa: boolean } | null {
  const propia = cuentas.find((c) => c.numero === num);
  if (propia) return { nombre: nombreCliente, tipo: propia.tipo, activa: true };
  return null;
}

export default function DepositView() {
  const activeClient = getActiveClient();
  const [activeNav, setActiveNav] = useState("cuentas");
  const [cuentas, setCuentas] = useState<Cuenta[]>(() => {
    const stored = getStoredAccounts();
    return stored.map(toCuenta);
  });
  const [historial, setHistorial] = useState<Transaccion[]>(HISTORIAL_INICIAL);
  const [step, setStep] = useState<DpStep>("form");

  const [cuentaDestinoNum, setCuentaDestinoNum] = useState(cuentas[0]?.numero ?? "");
  const [destinoManual, setDestinoManual] = useState(false);
  const [destinoInput, setDestinoInput] = useState(cuentas[0]?.numero ?? "");
  const [destinoStatus, setDestinoStatus] = useState<"idle" | "checking" | "ok" | "inactive" | "notfound">("idle");
  const [canal, setCanal] = useState("efectivo");
  const [montoStr, setMontoStr] = useState("");
  const [concepto, setConcepto] = useState("");
  const [remitente, setRemitente] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [referencia, setReferencia] = useState("");

  const monto = parseFloat(montoStr.replace(/\./g, "").replace(",", ".")) || 0;
  const destinoInfo = buscarCuentaDeposito(cuentaDestinoNum, cuentas, activeClient?.nombre ?? "Cliente");
  const cuentaPropia = cuentas.find((c) => c.numero === cuentaDestinoNum);

  useEffect(() => {
    if (!activeClient) return;
    getAccountsByClient(activeClient.id).then((accounts) => {
      accounts.forEach(storeAccount);
      const next = accounts.map(toCuenta);
      setCuentas(next);
      if (!cuentaDestinoNum && next[0]) {
        setCuentaDestinoNum(next[0].numero);
        setDestinoInput(next[0].numero);
        setDestinoStatus("ok");
      }
    }).catch((err) => setFieldErrors({ destino: err instanceof Error ? err.message : "No fue posible cargar las cuentas." }));
  }, [activeClient?.id, cuentaDestinoNum]);

  function formatMonto(val: string) {
    const digits = val.replace(/\D/g, "");
    return digits ? Number(digits).toLocaleString("es-CO") : "";
  }

  function handleDestinoBlur() {
    if (!destinoInput.trim()) return;
    setCuentaDestinoNum(destinoInput.trim());
    setDestinoStatus("checking");
    getAccount(destinoInput.trim()).then((account) => {
      if (!account.activa) setDestinoStatus("inactive");
      else { setDestinoStatus("ok"); setCuentaDestinoNum(destinoInput.trim()); }
    }).catch(() => setDestinoStatus("notfound"));
  }

  function handleSelectPropia(num: string) {
    setDestinoInput(num);
    setCuentaDestinoNum(num);
    setDestinoStatus("ok");
    setDestinoManual(false);
    setFieldErrors((e) => ({ ...e, destino: undefined as unknown as string }));
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!cuentaDestinoNum.trim()) e.destino = "Ingresa o selecciona una cuenta destino.";
    else if (destinoStatus === "notfound") e.destino = "La cuenta no existe en el sistema.";
    else if (destinoStatus === "inactive") e.destino = "La cuenta está inactiva y no puede recibir consignaciones.";
    else if (destinoStatus === "checking") e.destino = "Espera mientras se valida la cuenta.";
    if (!montoStr) e.monto = "Ingresa el monto a consignar.";
    else if (monto <= 0) e.monto = "El monto debe ser mayor a $0.";
    else if (monto < 1_000) e.monto = "El monto mínimo de consignación es $1.000.";
    else if (monto > 50_000_000) e.monto = "El monto máximo por consignación es $50.000.000.";
    return e;
  }

  function handleContinue() {
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setReferencia(generarRef());
    setStep("confirm");
  }

  async function handleConfirm() {
    try {
      const response = await deposit(cuentaDestinoNum, monto, remitente);
      const account = await getAccount(cuentaDestinoNum);
      storeAccount(account);
      const nuevaTx: Transaccion = { id: String(response.id), fecha: response.fecha, tipo: "recibida", descripcion: response.descripcion || "Consignación", monto: response.monto, cuentaOrigen: response.cuentaOrigen, cuentaDestino: response.cuentaDestino, referencia: response.referencia };
      setCuentas((prev) => prev.map((c) => c.numero === cuentaDestinoNum ? { ...c, saldo: c.saldo + monto } : c));
      setHistorial((prev) => [nuevaTx, ...prev]);
      setReferencia(response.referencia);
      setStep("success");
    } catch (err) {
      setFieldErrors({ destino: err instanceof Error ? err.message : "No fue posible registrar la consignación." });
      setStep("form");
    }
  }

  function handleReset() {
    setMontoStr("");
    setConcepto("");
    setRemitente("");
    setCanal("efectivo");
    setFieldErrors({});
    setDestinoManual(false);
    setDestinoInput(cuentas[0]?.numero ?? "");
    setCuentaDestinoNum(cuentas[0]?.numero ?? "");
    setDestinoStatus(cuentas[0] ? "ok" : "idle");
    setStep("form");
  }

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#0f0a1e" }}>
      <Sidebar navItems={CLIENT_NAV} activeNav={activeNav} onNav={setActiveNav} userLabel={activeClient?.nombre ?? "Cliente no registrado"} userSub={activeClient ? `CC ${activeClient.cedula}` : "Registra un cliente"} userInitials={activeClient?.iniciales ?? "?"} badge="Banca Personal" />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-10" style={{ background: "rgba(15,10,30,0.92)", borderBottom: "1px solid rgba(139,92,246,0.1)", backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: "#7c6fa0" }}>
            <span>Mis Cuentas</span><IcoChevron /><span style={{ color: "#c4b5fd" }}>Consignar Dinero</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
              Cliente Activo
            </div>
            <span className="px-3 py-1.5 rounded-lg text-xs" style={{ background: "rgba(109,40,217,0.15)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.2)" }}>HU-03-01-03</span>
          </div>
        </div>

        <div className="px-8 py-6" style={{ maxWidth: "960px" }}>
          <div className="mb-7">
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded mb-2 inline-block" style={{ background: "rgba(16,185,129,0.12)", color: "#34d399", fontFamily: "Instrument Sans,sans-serif" }}>Consignaciones</span>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#f1eeff", fontFamily: "Instrument Sans,sans-serif", letterSpacing: "-0.3px" }}>Consignar dinero</h1>
            <p className="text-sm" style={{ color: "#7c6fa0" }}>Ingresa fondos a tu cuenta propia o indica la cuenta de destino para aumentar el saldo disponible.</p>
          </div>

          <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 320px" }}>
            <div>
              <Stepper step={step} />

              {step === "form" && (
                <div className="flex flex-col gap-5">
                  {/* Cuenta destino */}
                  <div className="rounded-2xl p-5" style={{ background: "#130d24", border: "1px solid rgba(139,92,246,0.13)" }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-4 rounded-full" style={{ background: "linear-gradient(180deg,#6d28d9,#a855f7)" }} />
                        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Cuenta destino</span>
                      </div>
                      <button onClick={() => { setDestinoManual(!destinoManual); if (!destinoManual) { setDestinoInput(""); setCuentaDestinoNum(""); setDestinoStatus("idle"); } else if (cuentas[0]) { handleSelectPropia(cuentas[0].numero); } }} className="text-xs px-3 py-1 rounded-lg transition-all" style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.2)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.1)"; }}>
                        {destinoManual ? "← Mis cuentas" : "Otra cuenta"}
                      </button>
                    </div>

                    {!destinoManual && (
                      <div className="flex flex-col gap-2">
                        {cuentas.map((c) => {
                          const sel = cuentaDestinoNum === c.numero;
                          return (
                            <button key={c.numero} onClick={() => handleSelectPropia(c.numero)} className="flex items-center justify-between px-4 py-3.5 rounded-xl transition-all text-left" style={{ background: sel ? "rgba(16,185,129,0.12)" : "rgba(139,92,246,0.05)", border: `2px solid ${sel ? "rgba(16,185,129,0.4)" : "rgba(139,92,246,0.12)"}`, boxShadow: sel ? "0 0 0 3px rgba(16,185,129,0.07)" : "none" }}>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: sel ? "rgba(16,185,129,0.18)" : "rgba(139,92,246,0.1)" }}>
                                  <span style={{ color: sel ? "#10b981" : "#7c6fa0" }}><IcoCuentas /></span>
                                </div>
                                <div>
                                  <div className="text-xs font-semibold" style={{ color: sel ? "#f1eeff" : "#c4b5fd" }}>{c.tipo}</div>
                                  <div className="text-xs font-mono" style={{ color: "#7c6fa0" }}>{c.numero}</div>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
                                    <span className="text-xs" style={{ color: "#34d399" }}>Activa</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs mb-0.5" style={{ color: "#7c6fa0" }}>Saldo actual</div>
                                <div className="text-sm font-bold" style={{ color: sel ? "#34d399" : "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>{fmtCOP(c.saldo)}</div>
                                {sel && monto > 0 && (
                                  <div className="text-xs mt-0.5" style={{ color: "#10b981" }}>+{fmtCOP(monto)} → {fmtCOP(c.saldo + monto)}</div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                        {fieldErrors.destino && <p className="flex items-center gap-1 text-xs mt-1" style={{ color: "#f87171" }}><IcoAlert />{fieldErrors.destino}</p>}
                      </div>
                    )}

                    {destinoManual && (
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Número de cuenta <span style={{ color: "#a855f7" }}>*</span></label>
                        <div className="relative">
                          <input type="text" value={destinoInput} onChange={(ev) => { setDestinoInput(ev.target.value); setDestinoStatus("idle"); setFieldErrors((e) => ({ ...e, destino: undefined as unknown as string })); }} onBlur={handleDestinoBlur} placeholder="Ej: 301-002-4419-88" className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-sm outline-none transition-all font-mono" style={{ background: "rgba(139,92,246,0.06)", border: `1px solid ${fieldErrors.destino ? "#ef4444" : destinoStatus === "ok" ? "#10b981" : destinoStatus === "inactive" || destinoStatus === "notfound" ? "#ef4444" : "rgba(139,92,246,0.22)"}`, color: "#f1eeff" }} onFocus={(ev) => { ev.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)"; }} onBlurCapture={(ev) => { ev.currentTarget.style.boxShadow = "none"; }} />
                          {destinoStatus === "checking" && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(168,139,250,0.5)", borderTopColor: "transparent" }} />}
                          {destinoStatus === "ok" && <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold" style={{ color: "#10b981" }}>✓</span>}
                          {(destinoStatus === "notfound" || destinoStatus === "inactive") && <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#ef4444" }}>✕</span>}
                        </div>
                        {destinoStatus === "ok" && destinoInfo && (
                          <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-lg" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                            <span style={{ color: "#10b981" }}><IcoShield /></span>
                            <span className="text-xs font-semibold" style={{ color: "#34d399" }}>{destinoInfo.nombre}</span>
                            <span className="text-xs" style={{ color: "#7c6fa0" }}>· Cuenta {destinoInfo.tipo} · Activa</span>
                          </div>
                        )}
                        {destinoStatus === "notfound" && <p className="flex items-center gap-1 text-xs mt-1" style={{ color: "#f87171" }}><IcoAlert />La cuenta ingresada no existe en el sistema.</p>}
                        {destinoStatus === "inactive" && (
                          <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                            <span style={{ color: "#f87171" }}><IcoAlert /></span>
                            <span className="text-xs" style={{ color: "#f87171" }}>Esta cuenta está inactiva y no puede recibir consignaciones.</span>
                          </div>
                        )}
                        {fieldErrors.destino && destinoStatus === "idle" && <p className="flex items-center gap-1 text-xs mt-1" style={{ color: "#f87171" }}><IcoAlert />{fieldErrors.destino}</p>}
                        <p className="text-xs" style={{ color: "#7c6fa0" }}>Ingresa el número y presiona Tab para validar.</p>
                      </div>
                    )}
                  </div>

                  {/* Canal de consignación */}
                  <div className="rounded-2xl p-5" style={{ background: "#130d24", border: "1px solid rgba(139,92,246,0.13)" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-4 rounded-full" style={{ background: "linear-gradient(180deg,#6d28d9,#a855f7)" }} />
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Canal de consignación</span>
                    </div>
                    <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                      {CANALES_CONSIGNACION.map((ch) => {
                        const sel = canal === ch.id;
                        return (
                          <button key={ch.id} onClick={() => setCanal(ch.id)} className="flex items-start gap-3 px-4 py-3.5 rounded-xl transition-all text-left" style={{ background: sel ? "rgba(109,40,217,0.22)" : "rgba(139,92,246,0.05)", border: `2px solid ${sel ? "rgba(139,92,246,0.5)" : "rgba(139,92,246,0.12)"}`, boxShadow: sel ? "0 0 0 3px rgba(109,40,217,0.1)" : "none" }} onMouseEnter={(e) => { if (!sel) { e.currentTarget.style.background = "rgba(139,92,246,0.1)"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.25)"; } }} onMouseLeave={(e) => { if (!sel) { e.currentTarget.style.background = "rgba(139,92,246,0.05)"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.12)"; } }}>
                            <span className="text-xl shrink-0 mt-0.5">{ch.icon}</span>
                            <div>
                              <div className="text-xs font-semibold mb-0.5" style={{ color: sel ? "#f1eeff" : "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>{ch.label}</div>
                              <div className="text-xs leading-relaxed" style={{ color: "#7c6fa0" }}>{ch.desc}</div>
                            </div>
                            {sel && (
                              <div className="ml-auto shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#6d28d9,#a855f7)" }}>
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Monto, remitente y concepto */}
                  <div className="rounded-2xl p-5" style={{ background: "#130d24", border: "1px solid rgba(139,92,246,0.13)" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-4 rounded-full" style={{ background: "linear-gradient(180deg,#6d28d9,#a855f7)" }} />
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Monto y detalle</span>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between px-4 py-2.5 rounded-lg" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: "#7c6fa0" }}><IcoInfo /><span>Límites de consignación</span></div>
                        <div className="flex items-center gap-4 text-xs" style={{ color: "#34d399" }}>
                          <span>Mín: <strong>$1.000</strong></span>
                          <span>Máx: <strong>$50.000.000</strong></span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Monto a consignar (COP) <span style={{ color: "#a855f7" }}>*</span></label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: "#7c6fa0" }}>$</span>
                          <input type="text" inputMode="numeric" value={montoStr} onChange={(ev) => { setMontoStr(formatMonto(ev.target.value)); setFieldErrors((e) => ({ ...e, monto: undefined as unknown as string })); }} placeholder="0" className="w-full pl-7 pr-3.5 py-3 rounded-lg text-xl font-bold outline-none transition-all" style={{ background: "rgba(139,92,246,0.06)", border: `1px solid ${fieldErrors.monto ? "#ef4444" : "rgba(139,92,246,0.22)"}`, color: "#f1eeff", fontFamily: "Instrument Sans,sans-serif" }} onFocus={(ev) => { ev.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)"; }} onBlur={(ev) => { ev.currentTarget.style.boxShadow = "none"; }} />
                        </div>
                        {fieldErrors.monto && (
                          <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                            <span style={{ color: "#f87171", flexShrink: 0 }}><IcoAlert /></span>
                            <span className="text-xs" style={{ color: "#f87171" }}>{fieldErrors.monto}</span>
                          </div>
                        )}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {[200_000, 500_000, 1_000_000, 2_000_000, 5_000_000].map((v) => (
                            <button key={v} onClick={() => { setMontoStr(v.toLocaleString("es-CO")); setFieldErrors((e) => ({ ...e, monto: undefined as unknown as string })); }} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ background: "rgba(139,92,246,0.08)", color: "#7c6fa0", border: "1px solid rgba(139,92,246,0.15)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.18)"; e.currentTarget.style.color = "#c4b5fd"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.08)"; e.currentTarget.style.color = "#7c6fa0"; }}>
                              {fmtCOP(v)}
                            </button>
                          ))}
                        </div>
                        {monto > 0 && cuentaPropia && (
                          <div className="flex items-center justify-between mt-2 px-3 py-2.5 rounded-lg" style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.18)" }}>
                            <span className="text-xs" style={{ color: "#7c6fa0" }}>Saldo proyectado tras consignación</span>
                            <span className="text-sm font-bold" style={{ color: "#34d399", fontFamily: "Instrument Sans,sans-serif" }}>{fmtCOP(cuentaPropia.saldo + monto)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Nombre del remitente (opcional)</label>
                        <input type="text" value={remitente} onChange={(ev) => setRemitente(ev.target.value)} placeholder="Ej: Juan Pérez, Empresa ABC..." maxLength={60} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.22)", color: "#f1eeff" }} onFocus={(ev) => { ev.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)"; }} onBlur={(ev) => { ev.currentTarget.style.boxShadow = "none"; }} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Concepto (opcional)</label>
                        <input type="text" value={concepto} onChange={(ev) => setConcepto(ev.target.value)} placeholder="Ej: Pago de nómina, ahorro mensual..." maxLength={80} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.22)", color: "#f1eeff" }} onFocus={(ev) => { ev.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)"; }} onBlur={(ev) => { ev.currentTarget.style.boxShadow = "none"; }} />
                        <p className="text-xs text-right" style={{ color: "#7c6fa0" }}>{concepto.length}/80</p>
                      </div>
                    </div>
                  </div>

                  {Object.keys(fieldErrors).length > 0 && (
                    <div className="flex items-start gap-3 rounded-xl px-4 py-3.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                      <span style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }}><IcoAlert /></span>
                      <div>
                        <div className="text-sm font-semibold mb-0.5" style={{ color: "#f87171" }}>Corrija los errores antes de continuar</div>
                        <div className="text-xs" style={{ color: "#fca5a5" }}>Se encontraron {Object.keys(fieldErrors).length} {Object.keys(fieldErrors).length === 1 ? "error" : "errores"}. Revisa los campos marcados.</div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pb-2">
                    <button onClick={handleContinue} className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-all" style={{ background: "linear-gradient(135deg,#6d28d9,#a855f7)", color: "#fff", boxShadow: "0 4px 20px rgba(109,40,217,0.35)" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}>
                      Continuar <IcoChevron />
                    </button>
                  </div>
                </div>
              )}

              {step === "confirm" && (
                <div className="flex flex-col gap-5">
                  <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(139,92,246,0.2)" }}>
                    <div className="px-6 py-5 flex items-center gap-4" style={{ background: "linear-gradient(135deg,rgba(16,185,129,0.15),rgba(109,40,217,0.15))", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl" style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.25)" }}>
                        {CANALES_CONSIGNACION.find((c) => c.id === canal)?.icon}
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#34d399", fontFamily: "Instrument Sans,sans-serif" }}>Resumen de la consignación</div>
                        <div className="text-2xl font-bold" style={{ color: "#f1eeff", fontFamily: "Instrument Sans,sans-serif" }}>{fmtCOP(monto)}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#7c6fa0" }}>{CANALES_CONSIGNACION.find((c) => c.id === canal)?.label}</div>
                      </div>
                    </div>
                    <div className="px-6 py-5 flex flex-col gap-3" style={{ background: "#130d24" }}>
                      {([
                        { label: "Cuenta destino", value: cuentaDestinoNum },
                        { label: "Titular", value: destinoInfo?.nombre ?? "—" },
                        { label: "Tipo de cuenta", value: destinoInfo?.tipo ?? "—" },
                        { label: "Estado de la cuenta", value: "Activa", green: true },
                        { label: "Monto a consignar", value: fmtCOP(monto), highlight: true },
                        ...(cuentaPropia ? [{ label: "Saldo proyectado", value: fmtCOP(cuentaPropia.saldo + monto), green: true }] : []),
                        { label: "Canal", value: CANALES_CONSIGNACION.find((c) => c.id === canal)?.label ?? canal },
                        { label: "Remitente", value: remitente || "No especificado", muted: !remitente },
                        { label: "Concepto", value: concepto || "No especificado", muted: !concepto },
                        { label: "Referencia", value: referencia },
                        { label: "Fecha y hora", value: new Date().toLocaleString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) },
                      ] as { label: string; value: string; green?: boolean; highlight?: boolean; muted?: boolean }[]).map((r) => (
                        <div key={r.label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(139,92,246,0.07)" }}>
                          <span className="text-xs" style={{ color: "#7c6fa0" }}>{r.label}</span>
                          <span className="text-sm font-medium" style={{ color: r.green ? "#34d399" : r.highlight ? "#c4b5fd" : r.muted ? "#7c6fa0" : "#f1eeff" }}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="px-6 py-3.5" style={{ background: "rgba(139,92,246,0.04)", borderTop: "1px solid rgba(139,92,246,0.1)" }}>
                      <div className="flex items-start gap-2 text-xs" style={{ color: "#7c6fa0", lineHeight: "1.6" }}>
                        <span style={{ color: "#a78bfa", flexShrink: 0, marginTop: 1 }}><IcoInfo /></span>
                        Al confirmar, el saldo de la cuenta destino se actualizará de forma inmediata.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <button onClick={() => setStep("form")} className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all" style={{ background: "transparent", color: "#7c6fa0", border: "1px solid rgba(139,92,246,0.2)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#c4b5fd"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#7c6fa0"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.2)"; }}>← Volver</button>
                    <button onClick={handleConfirm} className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-all" style={{ background: "linear-gradient(135deg,#6d28d9,#a855f7)", color: "#fff", boxShadow: "0 4px 20px rgba(109,40,217,0.35)" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}>Confirmar consignación</button>
                  </div>
                </div>
              )}

              {step === "success" && (
                <div className="flex flex-col items-center text-center gap-6 py-2">
                  <div className="relative flex items-center justify-center w-20 h-20 rounded-full" style={{ background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.35)" }}>
                    <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(16,185,129,0.07)" }} />
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-1" style={{ color: "#f1eeff", fontFamily: "Instrument Sans,sans-serif" }}>¡Consignación registrada!</h2>
                    <p className="text-sm max-w-sm mx-auto" style={{ color: "#7c6fa0", lineHeight: "1.6" }}>El monto ha sido acreditado a la cuenta destino y la transacción queda registrada en el historial.</p>
                  </div>
                  {cuentaPropia && (
                    <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg,#0f3d25,#1a4d35,#0d3b22)", border: "1px solid rgba(16,185,129,0.3)", boxShadow: "0 16px 40px rgba(16,185,129,0.15)" }}>
                      <div className="px-6 pt-5 pb-4">
                        <div className="flex items-center justify-between mb-6">
                          <div className="text-xs font-semibold tracking-wider opacity-70" style={{ fontFamily: "Instrument Sans,sans-serif" }}>BANCO X</div>
                          <div className="text-xs opacity-60">{cuentaPropia.tipo.toUpperCase()}</div>
                        </div>
                        <div className="text-sm font-mono mb-1 opacity-70">{cuentaPropia.numero}</div>
                        <div className="text-xs opacity-50 mb-4">Número de cuenta</div>
                        <div className="flex items-end justify-between">
                          <div>
                            <div className="text-xs opacity-60 mb-0.5">Titular</div>
                            <div className="text-sm font-semibold" style={{ fontFamily: "Instrument Sans,sans-serif" }}>{activeClient?.nombre ?? "Cliente no registrado"}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs opacity-60 mb-0.5">Saldo disponible</div>
                            <div className="text-2xl font-bold" style={{ fontFamily: "Instrument Sans,sans-serif", color: "#86efac" }}>{fmtCOP(cuentaPropia.saldo)}</div>
                          </div>
                        </div>
                      </div>
                      <div className="px-6 py-2.5 flex items-center justify-between" style={{ background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(16,185,129,0.2)" }}>
                        <span className="text-xs opacity-50">Acreditado</span>
                        <span className="text-sm font-bold" style={{ color: "#86efac" }}>+{fmtCOP(monto)}</span>
                      </div>
                    </div>
                  )}
                  <div className="w-full max-w-sm rounded-2xl overflow-hidden text-left" style={{ border: "1px solid rgba(139,92,246,0.2)" }}>
                    <div className="px-5 py-4" style={{ background: "linear-gradient(135deg,rgba(16,185,129,0.12),rgba(109,40,217,0.12))", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
                      <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: "#34d399", fontFamily: "Instrument Sans,sans-serif" }}>Comprobante de consignación</div>
                      <div className="text-xl font-bold" style={{ color: "#f1eeff", fontFamily: "Instrument Sans,sans-serif" }}>{fmtCOP(monto)}</div>
                    </div>
                    <div className="px-5 py-4 flex flex-col gap-2.5" style={{ background: "#130d24" }}>
                      {[
                        { label: "Referencia", value: referencia },
                        { label: "Cuenta acreditada", value: cuentaDestinoNum },
                        { label: "Titular", value: destinoInfo?.nombre ?? "—" },
                        { label: "Canal", value: CANALES_CONSIGNACION.find((c) => c.id === canal)?.label ?? canal },
                        { label: "Remitente", value: remitente || "No especificado" },
                        { label: "Fecha", value: fmtFecha(new Date().toISOString()) },
                        { label: "Estado", value: "Acreditado", green: true },
                      ].map((r) => (
                        <div key={r.label} className="flex items-center justify-between py-1" style={{ borderBottom: "1px solid rgba(139,92,246,0.07)" }}>
                          <span className="text-xs" style={{ color: "#7c6fa0" }}>{r.label}</span>
                          <span className="text-xs font-semibold" style={{ color: (r as { green?: boolean }).green ? "#34d399" : "#c4b5fd" }}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleReset} className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.25)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.15)"; }}>Nueva consignación</button>
                    <button onClick={() => setActiveNav("inicio")} className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: "linear-gradient(135deg,#6d28d9,#a855f7)", color: "#fff", boxShadow: "0 4px 20px rgba(109,40,217,0.35)" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}>Ir al inicio</button>
                  </div>
                </div>
              )}
            </div>

            {/* Panel derecho */}
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl p-5" style={{ background: "#130d24", border: "1px solid rgba(139,92,246,0.13)" }}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#7c6fa0", fontFamily: "Instrument Sans,sans-serif" }}>Mis saldos</div>
                {cuentas.map((c) => (
                  <div key={c.numero} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(139,92,246,0.07)" }}>
                    <div>
                      <div className="text-xs font-medium" style={{ color: "#c4b5fd" }}>{c.tipo}</div>
                      <div className="text-xs font-mono" style={{ color: "#7c6fa0", fontSize: "10px" }}>{c.numero}</div>
                    </div>
                    <div className="text-sm font-bold" style={{ color: "#a78bfa", fontFamily: "Instrument Sans,sans-serif" }}>{fmtCOP(c.saldo)}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl p-5" style={{ background: "#130d24", border: "1px solid rgba(139,92,246,0.13)" }}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#7c6fa0", fontFamily: "Instrument Sans,sans-serif" }}>Canales disponibles</div>
                <div className="flex flex-col gap-3">
                  {CANALES_CONSIGNACION.map((ch) => (
                    <div key={ch.id} className="flex items-start gap-3 py-2" style={{ borderBottom: "1px solid rgba(139,92,246,0.07)" }}>
                      <span className="text-lg">{ch.icon}</span>
                      <div>
                        <div className="text-xs font-semibold mb-0.5" style={{ color: "#c4b5fd" }}>{ch.label}</div>
                        <div className="text-xs leading-relaxed" style={{ color: "#7c6fa0" }}>{ch.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl p-5" style={{ background: "#130d24", border: "1px solid rgba(139,92,246,0.13)" }}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#7c6fa0", fontFamily: "Instrument Sans,sans-serif" }}>Historial reciente</div>
                <div className="flex flex-col gap-1">
                  {historial.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 py-2" style={{ borderBottom: "1px solid rgba(139,92,246,0.06)" }}>
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0" style={{ background: tx.tipo === "recibida" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={tx.tipo === "recibida" ? "#10b981" : "#f87171"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          {tx.tipo === "recibida" ? <path d="M12 19V5M5 12l7 7 7-7" /> : <path d="M12 5v14M19 12l-7-7-7 7" />}
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: "#c4b5fd" }}>{tx.descripcion}</div>
                        <div className="text-xs" style={{ color: "#7c6fa0", fontSize: "10px" }}>{fmtFecha(tx.fecha)}</div>
                      </div>
                      <div className="text-xs font-bold shrink-0" style={{ color: tx.tipo === "recibida" ? "#34d399" : "#f87171", fontFamily: "Instrument Sans,sans-serif" }}>
                        {tx.tipo === "recibida" ? "+" : "-"}{fmtCOP(tx.monto)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
