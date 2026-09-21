import { useEffect, useState } from "react";
import Sidebar from "../shared/Sidebar";
import { IcoDash, IcoCuentas, IcoTransfer, IcoPagos, IcoPrestamos, IcoInversiones, IcoExtractos, IcoChevron, IcoAlert, IcoInfo } from "../shared/icons";
import { fmtCOP, fmtFecha, generarRef } from "../shared/helpers";
import { HISTORIAL_INICIAL, CANALES_RETIRO } from "../shared/data";
import { getAccount, getAccountsByClient, getActiveClient, getStoredAccounts, storeAccount, toCuenta, withdraw } from "../shared/api";
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

type WdStep = "form" | "confirm" | "success";

const STEPS = [
  { key: "form", label: "Datos del retiro", num: 1 },
  { key: "confirm", label: "Confirmar operación", num: 2 },
  { key: "success", label: "Retiro procesado", num: 3 },
];

function Stepper({ step }: { step: WdStep }) {
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

export default function WithdrawView() {
  const activeClient = getActiveClient();
  const [activeNav, setActiveNav] = useState("cuentas");
  const [cuentas, setCuentas] = useState<Cuenta[]>(() => {
    const stored = getStoredAccounts();
    return stored.map(toCuenta);
  });
  const [historial, setHistorial] = useState<Transaccion[]>(HISTORIAL_INICIAL);
  const [step, setStep] = useState<WdStep>("form");

  const [cuentaNum, setCuentaNum] = useState(cuentas[0]?.numero ?? "");
  const [montoStr, setMontoStr] = useState("");
  const [canal, setCanal] = useState("cajero");
  const [concepto, setConcepto] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [referencia, setReferencia] = useState("");
  const [codigoRetiro, setCodigoRetiro] = useState("");

  const cuenta = cuentas.find((c) => c.numero === cuentaNum) ?? { numero: "", tipo: "", saldo: 0 };
  const monto = parseFloat(montoStr.replace(/\./g, "").replace(",", ".")) || 0;

  useEffect(() => {
    if (!activeClient) return;
    getAccountsByClient(activeClient.id).then((accounts) => {
      accounts.forEach(storeAccount);
      const next = accounts.map(toCuenta);
      setCuentas(next);
      if (!cuentaNum && next[0]) setCuentaNum(next[0].numero);
    }).catch((err) => setFieldErrors({ cuenta: err instanceof Error ? err.message : "No fue posible cargar las cuentas." }));
  }, [activeClient?.id, cuentaNum]);

  function formatMonto(val: string) {
    const digits = val.replace(/\D/g, "");
    return digits ? Number(digits).toLocaleString("es-CO") : "";
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!cuentaNum) e.cuenta = "Selecciona una cuenta.";
    if (!montoStr) e.monto = "Ingresa el monto a retirar.";
    else if (monto <= 0) e.monto = "El monto debe ser mayor a $0.";
    else if (monto < 10_000) e.monto = "El monto mínimo de retiro es $10.000.";
    else if (monto > 3_000_000) e.monto = "El monto máximo por retiro es $3.000.000.";
    else if (monto > cuenta.saldo) e.monto = `Saldo insuficiente. Disponible: ${fmtCOP(cuenta.saldo)}`;
    return e;
  }

  function handleContinue() {
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setReferencia(generarRef());
    setCodigoRetiro(Math.floor(100000 + Math.random() * 900000).toString());
    setStep("confirm");
  }

  async function handleConfirm() {
    try {
      const response = await withdraw(cuentaNum, monto);
      const account = await getAccount(cuentaNum);
      storeAccount(account);
      const nuevaTx: Transaccion = { id: String(response.id), fecha: response.fecha, tipo: "enviada", descripcion: response.descripcion || "Retiro", monto: response.monto, cuentaOrigen: response.cuentaOrigen, cuentaDestino: response.cuentaDestino, referencia: response.referencia };
      setCuentas((prev) => prev.map((c) => c.numero === cuentaNum ? { ...c, saldo: c.saldo - monto } : c));
      setHistorial((prev) => [nuevaTx, ...prev]);
      setReferencia(response.referencia);
      setStep("success");
    } catch (err) {
      setFieldErrors({ monto: err instanceof Error ? err.message : "No fue posible registrar el retiro." });
      setStep("form");
    }
  }

  function handleReset() {
    setMontoStr("");
    setConcepto("");
    setCanal("cajero");
    setFieldErrors({});
    setStep("form");
  }

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#0f0a1e" }}>
      <Sidebar navItems={CLIENT_NAV} activeNav={activeNav} onNav={setActiveNav} userLabel={activeClient?.nombre ?? "Cliente no registrado"} userSub={activeClient ? `CC ${activeClient.cedula}` : "Registra un cliente"} userInitials={activeClient?.iniciales ?? "?"} badge="Banca Personal" />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-10" style={{ background: "rgba(15,10,30,0.92)", borderBottom: "1px solid rgba(139,92,246,0.1)", backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: "#7c6fa0" }}>
            <span>Mis Cuentas</span><IcoChevron /><span style={{ color: "#c4b5fd" }}>Retirar Dinero</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
              Cliente Activo
            </div>
            <span className="px-3 py-1.5 rounded-lg text-xs" style={{ background: "rgba(109,40,217,0.15)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.2)" }}>HU-03-01-02</span>
          </div>
        </div>

        <div className="px-8 py-6" style={{ maxWidth: "960px" }}>
          <div className="mb-7">
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded mb-2 inline-block" style={{ background: "rgba(168,85,247,0.15)", color: "#a78bfa", fontFamily: "Instrument Sans,sans-serif" }}>Retiros</span>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#f1eeff", fontFamily: "Instrument Sans,sans-serif", letterSpacing: "-0.3px" }}>Retirar dinero</h1>
            <p className="text-sm" style={{ color: "#7c6fa0" }}>Selecciona tu cuenta, el canal de retiro y el monto que deseas disponer en efectivo.</p>
          </div>

          <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 320px" }}>
            <div>
              <Stepper step={step} />

              {step === "form" && (
                <div className="flex flex-col gap-5">
                  {/* Selector de cuenta */}
                  <div className="rounded-2xl p-5" style={{ background: "#130d24", border: "1px solid rgba(139,92,246,0.13)" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-4 rounded-full" style={{ background: "linear-gradient(180deg,#6d28d9,#a855f7)" }} />
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Cuenta a debitar</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {cuentas.map((c) => {
                        const sel = cuentaNum === c.numero;
                        const sinSaldo = c.saldo < 10_000;
                        return (
                          <button key={c.numero} disabled={sinSaldo} onClick={() => { setCuentaNum(c.numero); setFieldErrors((e) => ({ ...e, cuenta: undefined as unknown as string })); }} className="flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left" style={{ background: sel ? "rgba(109,40,217,0.2)" : sinSaldo ? "rgba(139,92,246,0.03)" : "rgba(139,92,246,0.05)", border: `1px solid ${sel ? "rgba(139,92,246,0.45)" : sinSaldo ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.12)"}`, opacity: sinSaldo ? 0.55 : 1, cursor: sinSaldo ? "not-allowed" : "pointer" }}>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: sel ? "rgba(109,40,217,0.35)" : "rgba(139,92,246,0.1)" }}>
                                <span style={{ color: sel ? "#a78bfa" : "#7c6fa0" }}><IcoCuentas /></span>
                              </div>
                              <div>
                                <div className="text-xs font-semibold" style={{ color: sel ? "#f1eeff" : "#c4b5fd" }}>{c.tipo}</div>
                                <div className="text-xs font-mono" style={{ color: "#7c6fa0" }}>{c.numero}</div>
                                {sinSaldo && <div className="text-xs mt-0.5" style={{ color: "#f87171" }}>Saldo insuficiente para retiros</div>}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs" style={{ color: "#7c6fa0" }}>Disponible</div>
                              <div className="text-sm font-bold" style={{ color: sel ? "#a78bfa" : "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>{fmtCOP(c.saldo)}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {fieldErrors.cuenta && <p className="flex items-center gap-1 text-xs mt-2" style={{ color: "#f87171" }}><IcoAlert />{fieldErrors.cuenta}</p>}
                  </div>

                  {/* Canal de retiro */}
                  <div className="rounded-2xl p-5" style={{ background: "#130d24", border: "1px solid rgba(139,92,246,0.13)" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-4 rounded-full" style={{ background: "linear-gradient(180deg,#6d28d9,#a855f7)" }} />
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Canal de retiro</span>
                    </div>
                    <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                      {CANALES_RETIRO.map((ch) => {
                        const sel = canal === ch.id;
                        return (
                          <button key={ch.id} onClick={() => setCanal(ch.id)} className="flex flex-col items-center gap-2 px-3 py-4 rounded-xl transition-all text-center" style={{ background: sel ? "rgba(109,40,217,0.22)" : "rgba(139,92,246,0.05)", border: `2px solid ${sel ? "rgba(139,92,246,0.5)" : "rgba(139,92,246,0.12)"}`, boxShadow: sel ? "0 0 0 3px rgba(109,40,217,0.1)" : "none" }} onMouseEnter={(e) => { if (!sel) { e.currentTarget.style.background = "rgba(139,92,246,0.1)"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.25)"; } }} onMouseLeave={(e) => { if (!sel) { e.currentTarget.style.background = "rgba(139,92,246,0.05)"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.12)"; } }}>
                            <span className="text-2xl">{ch.icon}</span>
                            <div className="text-xs font-semibold" style={{ color: sel ? "#f1eeff" : "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>{ch.label}</div>
                            <div className="text-xs leading-tight" style={{ color: "#7c6fa0" }}>{ch.desc}</div>
                            {sel && <div className="mt-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: "rgba(139,92,246,0.25)", color: "#a78bfa" }}>Seleccionado</div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Monto */}
                  <div className="rounded-2xl p-5" style={{ background: "#130d24", border: "1px solid rgba(139,92,246,0.13)" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-4 rounded-full" style={{ background: "linear-gradient(180deg,#6d28d9,#a855f7)" }} />
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Monto a retirar</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between px-4 py-2.5 rounded-lg" style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.15)" }}>
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: "#7c6fa0" }}><IcoInfo /><span>Límites diarios de retiro</span></div>
                        <div className="flex items-center gap-4 text-xs" style={{ color: "#a78bfa" }}>
                          <span>Mín: <strong>$10.000</strong></span>
                          <span>Máx: <strong>$3.000.000</strong></span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Monto (COP) <span style={{ color: "#a855f7" }}>*</span></label>
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
                          {[100_000, 200_000, 500_000, 1_000_000].map((v) => {
                            const disabled = v > cuenta.saldo;
                            return (
                              <button key={v} disabled={disabled} onClick={() => { setMontoStr(v.toLocaleString("es-CO")); setFieldErrors((e) => ({ ...e, monto: undefined as unknown as string })); }} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ background: disabled ? "rgba(139,92,246,0.03)" : "rgba(139,92,246,0.08)", color: disabled ? "#4c1d95" : "#7c6fa0", border: `1px solid ${disabled ? "rgba(139,92,246,0.08)" : "rgba(139,92,246,0.15)"}`, cursor: disabled ? "not-allowed" : "pointer" }} onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = "rgba(139,92,246,0.18)"; e.currentTarget.style.color = "#c4b5fd"; } }} onMouseLeave={(e) => { if (!disabled) { e.currentTarget.style.background = "rgba(139,92,246,0.08)"; e.currentTarget.style.color = "#7c6fa0"; } }}>
                                {fmtCOP(v)}
                              </button>
                            );
                          })}
                          <button onClick={() => { setMontoStr(cuenta.saldo.toLocaleString("es-CO")); setFieldErrors((e) => ({ ...e, monto: undefined as unknown as string })); }} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ background: "rgba(168,85,247,0.12)", color: "#a78bfa", border: "1px solid rgba(168,85,247,0.25)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(168,85,247,0.22)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(168,85,247,0.12)"; }}>
                            Todo el saldo
                          </button>
                        </div>
                        {monto > 0 && monto <= cuenta.saldo && (
                          <div className="flex items-center justify-between mt-2 px-3 py-2 rounded-lg" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)" }}>
                            <span className="text-xs" style={{ color: "#7c6fa0" }}>Saldo restante tras el retiro</span>
                            <span className="text-sm font-bold" style={{ color: "#a78bfa", fontFamily: "Instrument Sans,sans-serif" }}>{fmtCOP(cuenta.saldo - monto)}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Concepto (opcional)</label>
                        <input type="text" value={concepto} onChange={(ev) => setConcepto(ev.target.value)} placeholder="Ej: Gastos personales, arriendo..." maxLength={60} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.22)", color: "#f1eeff" }} onFocus={(ev) => { ev.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)"; }} onBlur={(ev) => { ev.currentTarget.style.boxShadow = "none"; }} />
                        <p className="text-xs text-right" style={{ color: "#7c6fa0" }}>{concepto.length}/60</p>
                      </div>
                    </div>
                  </div>

                  {Object.keys(fieldErrors).length > 0 && (
                    <div className="flex items-start gap-3 rounded-xl px-4 py-3.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                      <span style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }}><IcoAlert /></span>
                      <div>
                        <div className="text-sm font-semibold mb-0.5" style={{ color: "#f87171" }}>Corrija los errores antes de continuar</div>
                        <div className="text-xs" style={{ color: "#fca5a5" }}>Revisa los campos marcados e intenta de nuevo.</div>
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
                    <div className="px-6 py-5 flex items-center gap-4" style={{ background: "linear-gradient(135deg,rgba(109,40,217,0.25),rgba(168,85,247,0.12))", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl text-2xl" style={{ background: "rgba(109,40,217,0.3)" }}>
                        {CANALES_RETIRO.find((c) => c.id === canal)?.icon}
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#a78bfa", fontFamily: "Instrument Sans,sans-serif" }}>Resumen del retiro</div>
                        <div className="text-2xl font-bold" style={{ color: "#f1eeff", fontFamily: "Instrument Sans,sans-serif" }}>{fmtCOP(monto)}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#7c6fa0" }}>{CANALES_RETIRO.find((c) => c.id === canal)?.label}</div>
                      </div>
                    </div>
                    <div className="px-6 py-5 flex flex-col gap-3" style={{ background: "#130d24" }}>
                      {[
                        { label: "Titular", value: activeClient?.nombre ?? "—" },
                        { label: "Cuenta debitada", value: `${cuenta.tipo} · ${cuentaNum}` },
                        { label: "Canal de retiro", value: CANALES_RETIRO.find((c) => c.id === canal)?.label ?? canal },
                        { label: "Monto", value: fmtCOP(monto), highlight: true },
                        { label: "Saldo después del retiro", value: fmtCOP(cuenta.saldo - monto), muted: true },
                        { label: "Concepto", value: concepto || "Sin especificar", muted: !concepto },
                        { label: "Referencia", value: referencia },
                        { label: "Fecha y hora", value: new Date().toLocaleString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) },
                      ].map((r) => (
                        <div key={r.label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(139,92,246,0.07)" }}>
                          <span className="text-xs" style={{ color: "#7c6fa0" }}>{r.label}</span>
                          <span className="text-sm font-medium" style={{ color: (r as { highlight?: boolean }).highlight ? "#c4b5fd" : (r as { muted?: boolean }).muted ? "#7c6fa0" : "#f1eeff" }}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                    {canal === "cajero" && (
                      <div className="px-6 py-4" style={{ background: "rgba(109,40,217,0.08)", borderTop: "1px solid rgba(139,92,246,0.13)" }}>
                        <div className="flex items-center gap-2 mb-2"><IcoInfo /><span className="text-xs font-semibold" style={{ color: "#a78bfa" }}>Se generará un código de retiro sin tarjeta</span></div>
                        <p className="text-xs" style={{ color: "#7c6fa0", lineHeight: "1.6" }}>Al confirmar recibirás un código de 6 dígitos para usar en cualquier ATM Banco X. Válido por 30 minutos.</p>
                      </div>
                    )}
                    <div className="px-6 py-3.5" style={{ background: "rgba(139,92,246,0.04)", borderTop: "1px solid rgba(139,92,246,0.1)" }}>
                      <div className="flex items-start gap-2 text-xs" style={{ color: "#7c6fa0", lineHeight: "1.6" }}>
                        <span style={{ color: "#a78bfa", flexShrink: 0, marginTop: 1 }}><IcoInfo /></span>
                        Esta operación descontará el monto de tu cuenta de forma inmediata.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <button onClick={() => setStep("form")} className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all" style={{ background: "transparent", color: "#7c6fa0", border: "1px solid rgba(139,92,246,0.2)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#c4b5fd"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#7c6fa0"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.2)"; }}>← Volver</button>
                    <button onClick={handleConfirm} className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-all" style={{ background: "linear-gradient(135deg,#6d28d9,#a855f7)", color: "#fff", boxShadow: "0 4px 20px rgba(109,40,217,0.35)" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}>Confirmar retiro</button>
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
                    <h2 className="text-xl font-bold mb-1" style={{ color: "#f1eeff", fontFamily: "Instrument Sans,sans-serif" }}>¡Retiro procesado exitosamente!</h2>
                    <p className="text-sm max-w-sm mx-auto" style={{ color: "#7c6fa0", lineHeight: "1.6" }}>El monto ha sido descontado de tu cuenta y registrado en tu historial.</p>
                  </div>
                  {canal === "cajero" && (
                    <div className="w-full max-w-xs rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(139,92,246,0.25)" }}>
                      <div className="px-5 py-4" style={{ background: "linear-gradient(135deg,rgba(109,40,217,0.3),rgba(168,85,247,0.15))", borderBottom: "1px solid rgba(139,92,246,0.2)" }}>
                        <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#a78bfa", fontFamily: "Instrument Sans,sans-serif" }}>Código de retiro sin tarjeta</div>
                        <div className="text-4xl font-bold tracking-[0.25em]" style={{ color: "#f1eeff", fontFamily: "Instrument Sans,sans-serif" }}>{codigoRetiro}</div>
                      </div>
                      <div className="px-5 py-3" style={{ background: "#130d24" }}>
                        <div className="flex items-center gap-2 text-xs" style={{ color: "#7c6fa0" }}>
                          <span>⏱</span>
                          <span>Válido por <strong style={{ color: "#a78bfa" }}>30 minutos</strong> en cualquier ATM Banco X</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="w-full max-w-sm rounded-2xl overflow-hidden text-left" style={{ border: "1px solid rgba(139,92,246,0.2)" }}>
                    <div className="px-5 py-4" style={{ background: "linear-gradient(135deg,rgba(109,40,217,0.2),rgba(168,85,247,0.1))", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
                      <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: "#a78bfa", fontFamily: "Instrument Sans,sans-serif" }}>Comprobante de retiro</div>
                      <div className="text-xl font-bold" style={{ color: "#f1eeff", fontFamily: "Instrument Sans,sans-serif" }}>{fmtCOP(monto)}</div>
                    </div>
                    <div className="px-5 py-4 flex flex-col gap-2.5" style={{ background: "#130d24" }}>
                      {[
                        { label: "Referencia", value: referencia },
                        { label: "Canal", value: CANALES_RETIRO.find((c) => c.id === canal)?.label ?? canal },
                        { label: "Cuenta debitada", value: `${cuenta.tipo} · ${cuentaNum}` },
                        { label: "Fecha", value: fmtFecha(new Date().toISOString()) },
                        { label: "Estado", value: "Procesado", green: true },
                      ].map((r) => (
                        <div key={r.label} className="flex items-center justify-between py-1" style={{ borderBottom: "1px solid rgba(139,92,246,0.07)" }}>
                          <span className="text-xs" style={{ color: "#7c6fa0" }}>{r.label}</span>
                          <span className="text-xs font-semibold" style={{ color: (r as { green?: boolean }).green ? "#34d399" : "#c4b5fd" }}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-full max-w-sm rounded-xl px-5 py-4 text-left" style={{ background: "#130d24", border: "1px solid rgba(139,92,246,0.15)" }}>
                    <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#7c6fa0", fontFamily: "Instrument Sans,sans-serif" }}>Saldos actualizados</div>
                    {cuentas.map((c) => (
                      <div key={c.numero} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(139,92,246,0.07)" }}>
                        <div>
                          <div className="text-xs font-semibold" style={{ color: "#c4b5fd" }}>{c.tipo}</div>
                          <div className="text-xs font-mono" style={{ color: "#7c6fa0" }}>{c.numero}</div>
                        </div>
                        <div className="text-sm font-bold" style={{ color: "#a78bfa", fontFamily: "Instrument Sans,sans-serif" }}>{fmtCOP(c.saldo)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleReset} className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.25)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.15)"; }}>Nuevo retiro</button>
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
                <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#7c6fa0", fontFamily: "Instrument Sans,sans-serif" }}>Sobre los canales</div>
                <div className="flex flex-col gap-3">
                  {CANALES_RETIRO.map((ch) => (
                    <div key={ch.id} className="flex items-start gap-3 py-2" style={{ borderBottom: "1px solid rgba(139,92,246,0.07)" }}>
                      <span className="text-lg">{ch.icon}</span>
                      <div>
                        <div className="text-xs font-semibold mb-0.5" style={{ color: "#c4b5fd" }}>{ch.label}</div>
                        <div className="text-xs" style={{ color: "#7c6fa0", lineHeight: "1.5" }}>{ch.desc}</div>
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
