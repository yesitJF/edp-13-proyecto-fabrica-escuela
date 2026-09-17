import { useState } from "react";
import Sidebar from "../shared/Sidebar";
import { IcoDash, IcoCuentas, IcoTransfer, IcoPagos, IcoPrestamos, IcoInversiones, IcoExtractos, IcoChevron, IcoAlert, IcoInfo, IcoShield } from "../shared/icons";
import { fmtCOP, fmtFecha, generarRef } from "../shared/helpers";
import { CLIENTE_ACTIVO, CUENTAS_SISTEMA, HISTORIAL_INICIAL } from "../shared/data";
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

type TxStep = "form" | "confirm" | "success";

const STEPS = [
  { key: "form", label: "Datos de transferencia", num: 1 },
  { key: "confirm", label: "Confirmar operación", num: 2 },
  { key: "success", label: "Transferencia enviada", num: 3 },
];

function Stepper({ step }: { step: TxStep }) {
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

export default function TransferView() {
  const [activeNav, setActiveNav] = useState("transferencias");
  const [cuentas, setCuentas] = useState<Cuenta[]>(CLIENTE_ACTIVO.cuentas.map((c) => ({ ...c })));
  const [historial, setHistorial] = useState<Transaccion[]>(HISTORIAL_INICIAL);
  const [step, setStep] = useState<TxStep>("form");

  const [cuentaOrigenNum, setCuentaOrigenNum] = useState(cuentas[0].numero);
  const [cuentaDestinoNum, setCuentaDestinoNum] = useState("");
  const [montoStr, setMontoStr] = useState("");
  const [concepto, setConcepto] = useState("");
  const [destinoStatus, setDestinoStatus] = useState<"idle" | "checking" | "ok" | "inactive" | "notfound">("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [referencia, setReferencia] = useState("");

  const cuentaOrigen = cuentas.find((c) => c.numero === cuentaOrigenNum)!;
  const monto = parseFloat(montoStr.replace(/\./g, "").replace(",", ".")) || 0;
  const destinoInfo = CUENTAS_SISTEMA[cuentaDestinoNum];

  function formatMonto(val: string) {
    const digits = val.replace(/\D/g, "");
    return digits ? Number(digits).toLocaleString("es-CO") : "";
  }

  function handleDestinoBlur() {
    if (!cuentaDestinoNum.trim()) return;
    setDestinoStatus("checking");
    setTimeout(() => {
      const info = CUENTAS_SISTEMA[cuentaDestinoNum.trim()];
      if (!info) setDestinoStatus("notfound");
      else if (!info.activa) setDestinoStatus("inactive");
      else setDestinoStatus("ok");
    }, 700);
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!cuentaOrigenNum) e.origen = "Selecciona una cuenta origen.";
    if (!cuentaDestinoNum.trim()) e.destino = "Ingresa el número de cuenta destino.";
    else if (destinoStatus === "notfound") e.destino = "La cuenta destino no existe en el sistema.";
    else if (destinoStatus === "inactive") e.destino = "La cuenta destino está inactiva.";
    else if (cuentaDestinoNum.trim() === cuentaOrigenNum) e.destino = "La cuenta destino debe ser diferente a la cuenta origen.";
    if (!montoStr) e.monto = "Ingresa un monto a transferir.";
    else if (monto <= 0) e.monto = "El monto debe ser mayor a $0.";
    else if (monto > cuentaOrigen.saldo) e.monto = `Saldo insuficiente. Disponible: ${fmtCOP(cuentaOrigen.saldo)}`;
    else if (monto < 1000) e.monto = "El monto mínimo de transferencia es $1.000.";
    return e;
  }

  function handleContinue() {
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setReferencia(generarRef());
    setStep("confirm");
  }

  function handleConfirm() {
    const nuevaTx: Transaccion = {
      id: "tx-" + Date.now(),
      fecha: new Date().toISOString(),
      tipo: "enviada",
      descripcion: concepto || `Transferencia a ${destinoInfo?.nombre ?? cuentaDestinoNum}`,
      monto,
      cuentaOrigen: cuentaOrigenNum,
      cuentaDestino: cuentaDestinoNum,
      referencia,
    };
    setCuentas((prev) => prev.map((c) => {
      if (c.numero === cuentaOrigenNum) return { ...c, saldo: c.saldo - monto };
      if (c.numero === cuentaDestinoNum) return { ...c, saldo: c.saldo + monto };
      return c;
    }));
    setHistorial((prev) => [nuevaTx, ...prev]);
    setStep("success");
  }

  function handleReset() {
    setCuentaDestinoNum("");
    setMontoStr("");
    setConcepto("");
    setDestinoStatus("idle");
    setFieldErrors({});
    setStep("form");
  }

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#0f0a1e" }}>
      <Sidebar navItems={CLIENT_NAV} activeNav={activeNav} onNav={setActiveNav} userLabel={CLIENTE_ACTIVO.nombre} userSub={`CC ${CLIENTE_ACTIVO.cedula}`} userInitials={CLIENTE_ACTIVO.iniciales} badge="Banca Personal" />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 py-5 flex items-center justify-between sticky top-0 z-10" style={{ background: "rgba(15,10,30,0.92)", borderBottom: "1px solid rgba(139,92,246,0.1)", backdropFilter: "blur(8px)" }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: "#7c6fa0" }}>
            <span>Transferencias</span><IcoChevron /><span style={{ color: "#c4b5fd" }}>Nueva Transferencia</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs" style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.25)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
              Cliente Activo
            </div>
            <span className="px-3 py-1.5 rounded-lg text-xs" style={{ background: "rgba(109,40,217,0.15)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.2)" }}>HU-03-01-01</span>
          </div>
        </div>

        <div className="px-8 py-6" style={{ maxWidth: "960px" }}>
          <div className="mb-7">
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded mb-2 inline-block" style={{ background: "rgba(168,85,247,0.15)", color: "#a78bfa", fontFamily: "Instrument Sans,sans-serif" }}>Transferencias</span>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#f1eeff", fontFamily: "Instrument Sans,sans-serif", letterSpacing: "-0.3px" }}>Transferir dinero</h1>
            <p className="text-sm" style={{ color: "#7c6fa0" }}>Envía fondos a cuentas propias o a terceros de forma segura e inmediata.</p>
          </div>

          <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 340px" }}>
            <div>
              <Stepper step={step} />

              {step === "form" && (
                <div className="flex flex-col gap-5">
                  {/* Cuenta origen */}
                  <div className="rounded-2xl p-5" style={{ background: "#130d24", border: "1px solid rgba(139,92,246,0.13)" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-4 rounded-full" style={{ background: "linear-gradient(180deg,#6d28d9,#a855f7)" }} />
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Mis cuentas disponibles</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {cuentas.map((c) => (
                        <button key={c.numero} onClick={() => { setCuentaOrigenNum(c.numero); setFieldErrors((e) => ({ ...e, origen: undefined as unknown as string })); }} className="flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left" style={{ background: cuentaOrigenNum === c.numero ? "rgba(109,40,217,0.2)" : "rgba(139,92,246,0.05)", border: `1px solid ${cuentaOrigenNum === c.numero ? "rgba(139,92,246,0.45)" : "rgba(139,92,246,0.12)"}` }}>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ background: cuentaOrigenNum === c.numero ? "rgba(109,40,217,0.35)" : "rgba(139,92,246,0.1)" }}>
                              <span style={{ color: cuentaOrigenNum === c.numero ? "#a78bfa" : "#7c6fa0" }}><IcoCuentas /></span>
                            </div>
                            <div>
                              <div className="text-xs font-semibold" style={{ color: cuentaOrigenNum === c.numero ? "#f1eeff" : "#c4b5fd" }}>{c.tipo}</div>
                              <div className="text-xs font-mono" style={{ color: "#7c6fa0" }}>{c.numero}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs" style={{ color: "#7c6fa0" }}>Disponible</div>
                            <div className="text-sm font-bold" style={{ color: cuentaOrigenNum === c.numero ? "#a78bfa" : "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>{fmtCOP(c.saldo)}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {fieldErrors.origen && <p className="flex items-center gap-1 text-xs mt-2" style={{ color: "#f87171" }}><IcoAlert />{fieldErrors.origen}</p>}
                  </div>

                  {/* Cuenta destino */}
                  <div className="rounded-2xl p-5" style={{ background: "#130d24", border: "1px solid rgba(139,92,246,0.13)" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-4 rounded-full" style={{ background: "linear-gradient(180deg,#6d28d9,#a855f7)" }} />
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Cuenta destino</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Número de cuenta <span style={{ color: "#a855f7" }}>*</span></label>
                        <div className="relative">
                          <input type="text" value={cuentaDestinoNum} onChange={(ev) => { setCuentaDestinoNum(ev.target.value); setDestinoStatus("idle"); setFieldErrors((e) => ({ ...e, destino: undefined as unknown as string })); }} onBlur={handleDestinoBlur} placeholder="Ej: 301-002-4419-88" className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-sm outline-none transition-all font-mono" style={{ background: "rgba(139,92,246,0.06)", border: `1px solid ${fieldErrors.destino ? "#ef4444" : destinoStatus === "ok" ? "#10b981" : destinoStatus === "inactive" || destinoStatus === "notfound" ? "#ef4444" : "rgba(139,92,246,0.22)"}`, color: "#f1eeff" }} onFocus={(ev) => { ev.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)"; }} onBlurCapture={(ev) => { ev.currentTarget.style.boxShadow = "none"; }} />
                          {destinoStatus === "checking" && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "rgba(168,139,250,0.5)", borderTopColor: "transparent" }} />}
                          {destinoStatus === "ok" && <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold" style={{ color: "#10b981" }}>✓</span>}
                          {(destinoStatus === "notfound" || destinoStatus === "inactive") && <span className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#ef4444" }}>✕</span>}
                        </div>
                        {destinoStatus === "ok" && !fieldErrors.destino && destinoInfo && (
                          <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-lg" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
                            <span style={{ color: "#10b981" }}><IcoShield /></span>
                            <span className="text-xs font-semibold" style={{ color: "#34d399" }}>{destinoInfo.nombre}</span>
                            <span className="text-xs ml-2" style={{ color: "#7c6fa0" }}>· Cuenta {destinoInfo.tipo} · Activa</span>
                          </div>
                        )}
                        {destinoStatus === "notfound" && <p className="flex items-center gap-1 text-xs mt-1" style={{ color: "#f87171" }}><IcoAlert />La cuenta ingresada no existe en el sistema.</p>}
                        {destinoStatus === "inactive" && destinoInfo && (
                          <div className="flex items-center gap-2 mt-1 px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                            <span style={{ color: "#f87171" }}><IcoAlert /></span>
                            <span className="text-xs" style={{ color: "#f87171" }}>La cuenta <strong>{destinoInfo.nombre}</strong> está inactiva.</span>
                          </div>
                        )}
                        {fieldErrors.destino && destinoStatus === "idle" && <p className="flex items-center gap-1 text-xs mt-1" style={{ color: "#f87171" }}><IcoAlert />{fieldErrors.destino}</p>}
                        <p className="text-xs mt-0.5" style={{ color: "#7c6fa0" }}>Ingresa el número de cuenta y presiona Tab para validar.</p>
                      </div>

                      <div>
                        <div className="text-xs mb-2" style={{ color: "#7c6fa0" }}>Contactos frecuentes:</div>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { nombre: "Carlos H.", cuenta: "301-002-4419-88" },
                            { nombre: "Lucía F.", cuenta: "501-774-3310-22" },
                            { nombre: "Ana T.", cuenta: "501-001-0000-99" },
                          ].map((c) => (
                            <button key={c.cuenta} onClick={() => { setCuentaDestinoNum(c.cuenta); setDestinoStatus("checking"); setTimeout(() => setDestinoStatus("ok"), 500); setFieldErrors((e) => ({ ...e, destino: undefined as unknown as string })); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all" style={{ background: cuentaDestinoNum === c.cuenta ? "rgba(109,40,217,0.25)" : "rgba(139,92,246,0.08)", color: cuentaDestinoNum === c.cuenta ? "#c4b5fd" : "#7c6fa0", border: `1px solid ${cuentaDestinoNum === c.cuenta ? "rgba(139,92,246,0.4)" : "rgba(139,92,246,0.15)"}` }} onMouseEnter={(e) => { if (cuentaDestinoNum !== c.cuenta) { e.currentTarget.style.background = "rgba(139,92,246,0.15)"; e.currentTarget.style.color = "#a78bfa"; } }} onMouseLeave={(e) => { if (cuentaDestinoNum !== c.cuenta) { e.currentTarget.style.background = "rgba(139,92,246,0.08)"; e.currentTarget.style.color = "#7c6fa0"; } }}>
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "rgba(109,40,217,0.3)", color: "#c4b5fd" }}>{c.nombre[0]}</div>
                              {c.nombre}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Monto y concepto */}
                  <div className="rounded-2xl p-5" style={{ background: "#130d24", border: "1px solid rgba(139,92,246,0.13)" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1 h-4 rounded-full" style={{ background: "linear-gradient(180deg,#6d28d9,#a855f7)" }} />
                      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Monto y concepto</span>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Monto a transferir (COP) <span style={{ color: "#a855f7" }}>*</span></label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: "#7c6fa0" }}>$</span>
                          <input type="text" inputMode="numeric" value={montoStr} onChange={(ev) => { setMontoStr(formatMonto(ev.target.value)); setFieldErrors((e) => ({ ...e, monto: undefined as unknown as string })); }} placeholder="0" className="w-full pl-7 pr-3.5 py-3 rounded-lg text-lg font-bold outline-none transition-all" style={{ background: "rgba(139,92,246,0.06)", border: `1px solid ${fieldErrors.monto ? "#ef4444" : "rgba(139,92,246,0.22)"}`, color: "#f1eeff", fontFamily: "Instrument Sans,sans-serif" }} onFocus={(ev) => { ev.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)"; }} onBlur={(ev) => { ev.currentTarget.style.boxShadow = "none"; }} />
                        </div>
                        {fieldErrors.monto && <p className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "#f87171" }}><IcoAlert />{fieldErrors.monto}</p>}
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {[50_000, 100_000, 200_000, 500_000].map((v) => (
                            <button key={v} onClick={() => { setMontoStr(v.toLocaleString("es-CO")); setFieldErrors((e) => ({ ...e, monto: undefined as unknown as string })); }} className="px-3 py-1 rounded-lg text-xs font-medium transition-all" style={{ background: "rgba(139,92,246,0.08)", color: "#7c6fa0", border: "1px solid rgba(139,92,246,0.15)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.18)"; e.currentTarget.style.color = "#c4b5fd"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.08)"; e.currentTarget.style.color = "#7c6fa0"; }}>
                              {fmtCOP(v)}
                            </button>
                          ))}
                        </div>
                        {cuentaOrigen && monto > 0 && monto <= cuentaOrigen.saldo && (
                          <p className="text-xs mt-1" style={{ color: "#7c6fa0" }}>Saldo restante: <span style={{ color: "#a78bfa" }}>{fmtCOP(cuentaOrigen.saldo - monto)}</span></p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>Concepto / Descripción</label>
                        <input type="text" value={concepto} onChange={(ev) => setConcepto(ev.target.value)} placeholder="Ej: Pago arriendo, envío familiar..." maxLength={80} className="w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.22)", color: "#f1eeff" }} onFocus={(ev) => { ev.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)"; }} onBlur={(ev) => { ev.currentTarget.style.boxShadow = "none"; }} />
                        <p className="text-xs text-right" style={{ color: "#7c6fa0" }}>{concepto.length}/80</p>
                      </div>
                    </div>
                  </div>

                  {Object.keys(fieldErrors).length > 0 && (
                    <div className="flex items-start gap-3 rounded-xl px-4 py-3.5" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                      <span style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }}><IcoAlert /></span>
                      <div>
                        <div className="text-sm font-semibold mb-0.5" style={{ color: "#f87171" }}>Corrija los errores antes de continuar</div>
                        <div className="text-xs" style={{ color: "#fca5a5" }}>Se encontraron {Object.keys(fieldErrors).length} {Object.keys(fieldErrors).length === 1 ? "error" : "errores"} en el formulario.</div>
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
                    <div className="px-6 py-5" style={{ background: "linear-gradient(135deg,rgba(109,40,217,0.25),rgba(168,85,247,0.12))", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
                      <div className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "#a78bfa", fontFamily: "Instrument Sans,sans-serif" }}>Resumen de la operación</div>
                      <div className="text-2xl font-bold" style={{ color: "#f1eeff", fontFamily: "Instrument Sans,sans-serif" }}>{fmtCOP(monto)}</div>
                      <div className="text-xs mt-0.5" style={{ color: "#7c6fa0" }}>{concepto || "Sin concepto especificado"}</div>
                    </div>
                    <div className="px-6 py-5 flex flex-col gap-3" style={{ background: "#130d24" }}>
                      {[
                        { label: "Cuenta origen", value: `${cuentaOrigen?.tipo} · ${cuentaOrigenNum}` },
                        { label: "Titular origen", value: CLIENTE_ACTIVO.nombre },
                        { label: "Cuenta destino", value: `${destinoInfo?.tipo} · ${cuentaDestinoNum}` },
                        { label: "Titular destino", value: destinoInfo?.nombre ?? cuentaDestinoNum },
                        { label: "Monto", value: fmtCOP(monto), highlight: true },
                        { label: "Saldo después", value: fmtCOP(cuentaOrigen.saldo - monto), muted: true },
                        { label: "Referencia", value: referencia },
                        { label: "Fecha estimada", value: new Date().toLocaleString("es-CO", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) },
                      ].map((r) => (
                        <div key={r.label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(139,92,246,0.07)" }}>
                          <span className="text-xs" style={{ color: "#7c6fa0" }}>{r.label}</span>
                          <span className="text-sm font-medium" style={{ color: (r as { highlight?: boolean }).highlight ? "#c4b5fd" : (r as { muted?: boolean }).muted ? "#7c6fa0" : "#f1eeff" }}>{r.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="px-6 py-3.5" style={{ background: "rgba(139,92,246,0.05)", borderTop: "1px solid rgba(139,92,246,0.1)" }}>
                      <div className="flex items-start gap-2 text-xs" style={{ color: "#7c6fa0", lineHeight: "1.6" }}>
                        <span style={{ color: "#a78bfa", flexShrink: 0, marginTop: 1 }}><IcoInfo /></span>
                        Esta operación es inmediata e irreversible. Verifica los datos antes de confirmar.
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <button onClick={() => setStep("form")} className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all" style={{ background: "transparent", color: "#7c6fa0", border: "1px solid rgba(139,92,246,0.2)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#c4b5fd"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.4)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "#7c6fa0"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.2)"; }}>← Volver</button>
                    <button onClick={handleConfirm} className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-all" style={{ background: "linear-gradient(135deg,#6d28d9,#a855f7)", color: "#fff", boxShadow: "0 4px 20px rgba(109,40,217,0.35)" }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}>Confirmar transferencia</button>
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
                    <h2 className="text-xl font-bold mb-1" style={{ color: "#f1eeff", fontFamily: "Instrument Sans,sans-serif" }}>¡Transferencia exitosa!</h2>
                    <p className="text-sm" style={{ color: "#7c6fa0" }}>Los fondos han sido enviados y los saldos actualizados en tiempo real.</p>
                  </div>
                  <div className="w-full max-w-sm rounded-2xl overflow-hidden text-left" style={{ border: "1px solid rgba(139,92,246,0.2)" }}>
                    <div className="px-5 py-4" style={{ background: "linear-gradient(135deg,rgba(109,40,217,0.2),rgba(168,85,247,0.1))", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
                      <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: "#a78bfa", fontFamily: "Instrument Sans,sans-serif" }}>Comprobante</div>
                      <div className="text-xl font-bold" style={{ color: "#f1eeff", fontFamily: "Instrument Sans,sans-serif" }}>{fmtCOP(monto)}</div>
                    </div>
                    <div className="px-5 py-4 flex flex-col gap-2.5" style={{ background: "#130d24" }}>
                      {[
                        { label: "Referencia", value: referencia },
                        { label: "Destino", value: destinoInfo?.nombre ?? cuentaDestinoNum },
                        { label: "Cuenta destino", value: cuentaDestinoNum },
                        { label: "Fecha", value: fmtFecha(new Date().toISOString()) },
                        { label: "Estado", value: "Completada", green: true },
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
                    <button onClick={handleReset} className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.25)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.15)"; }}>Nueva transferencia</button>
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
                <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#7c6fa0", fontFamily: "Instrument Sans,sans-serif" }}>Historial reciente</div>
                <div className="flex flex-col gap-1">
                  {historial.slice(0, 6).map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 py-2.5 rounded-lg px-1" style={{ borderBottom: "1px solid rgba(139,92,246,0.06)" }}>
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0" style={{ background: tx.tipo === "recibida" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tx.tipo === "recibida" ? "#10b981" : "#f87171"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          {tx.tipo === "recibida" ? <path d="M12 19V5M5 12l7 7 7-7" /> : <path d="M12 5v14M19 12l-7-7-7 7" />}
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: "#c4b5fd" }}>{tx.descripcion}</div>
                        <div className="text-xs" style={{ color: "#7c6fa0" }}>{fmtFecha(tx.fecha)}</div>
                      </div>
                      <div className="text-xs font-bold shrink-0" style={{ color: tx.tipo === "recibida" ? "#34d399" : "#f87171", fontFamily: "Instrument Sans,sans-serif" }}>
                        {tx.tipo === "recibida" ? "+" : "-"}{fmtCOP(tx.monto)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-5" style={{ background: "#130d24", border: "1px solid rgba(139,92,246,0.13)" }}>
                <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#7c6fa0", fontFamily: "Instrument Sans,sans-serif" }}>Cuentas frecuentes</div>
                {[
                  { nombre: "Carlos Herrera", cuenta: "301-002-4419-88" },
                  { nombre: "Lucía Fernández", cuenta: "501-774-3310-22" },
                  { nombre: "Ana Torres", cuenta: "501-001-0000-99" },
                ].map((c) => (
                  <button key={c.cuenta} onClick={() => { setCuentaDestinoNum(c.cuenta); setDestinoStatus("ok"); setFieldErrors((e) => ({ ...e, destino: undefined as unknown as string })); if (step !== "form") setStep("form"); }} className="flex items-center gap-3 w-full py-2.5 rounded-lg px-1 transition-all text-left" style={{ borderBottom: "1px solid rgba(139,92,246,0.06)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.06)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: "rgba(109,40,217,0.25)", color: "#c4b5fd", fontFamily: "Instrument Sans,sans-serif" }}>
                      {c.nombre.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate" style={{ color: "#c4b5fd" }}>{c.nombre}</div>
                      <div className="text-xs font-mono" style={{ color: "#7c6fa0", fontSize: "10px" }}>{c.cuenta}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
