import { useState } from "react";
import Sidebar from "../shared/Sidebar";
import {
  IcoDash,
  IcoCuentas,
  IcoTransfer,
  IcoPagos,
  IcoPrestamos,
  IcoInversiones,
  IcoExtractos,
  IcoChevron,
  IcoInfo,
  IcoShield,
  IcoStar,
} from "../shared/icons";
import { CLIENTE_ACTIVO } from "../shared/data";

type TipoCuenta = "ahorros" | "corriente" | "";
type ClientStep = "select" | "confirm" | "success";

type CuentaResponse = {
  numeroCuenta?: string;
  numero?: string;
  accountNumber?: string;
  message?: string;
};

const API_CUENTAS_URL = "http://localhost:8080/api/cuentas";

const CLIENT_NAV = [
  { id: "inicio", label: "Inicio", icon: <IcoDash /> },
  { id: "cuentas", label: "Mis Cuentas", icon: <IcoCuentas /> },
  { id: "transferencias", label: "Transferencias", icon: <IcoTransfer /> },
  { id: "pagos", label: "Pagos", icon: <IcoPagos /> },
  { id: "prestamos", label: "Préstamos", icon: <IcoPrestamos /> },
  { id: "inversiones", label: "Inversiones", icon: <IcoInversiones /> },
  { id: "extractos", label: "Extractos", icon: <IcoExtractos /> },
];

const CUENTA_INFO = {
  ahorros: {
    titulo: "Cuenta de Ahorros",
    descripcion:
      "Ideal para guardar tu dinero y ganar rendimientos. Sin cuota de manejo los primeros 6 meses.",
    beneficios: [
      "Sin cuota de manejo por 6 meses",
      "Rendimientos del 4.2% E.A.",
      "Tarjeta débito virtual incluida",
      "Retiros ilimitados en cajeros BX",
    ],
    badge: "Más popular",
  },
  corriente: {
    titulo: "Cuenta Corriente",
    descripcion:
      "Perfecta para movimientos frecuentes y transacciones comerciales sin límite de operaciones.",
    beneficios: [
      "Transacciones ilimitadas",
      "Chequera digital incluida",
      "Acceso a sobregiro aprobado",
      "Integración con pasarelas de pago",
    ],
    badge: "Para negocios",
  },
};

export default function ClientView() {
  const [activeNav, setActiveNav] = useState("cuentas");
  const [step, setStep] = useState<ClientStep>("select");
  const [tipoCuenta, setTipoCuenta] = useState<TipoCuenta>("");
  const [numeroCuenta, setNumeroCuenta] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  function handleContinue() {
    if (!tipoCuenta) {
      setError("Selecciona un tipo de cuenta para continuar.");
      return;
    }

    setError("");
    setStep("confirm");
  }

  async function handleConfirm() {
    if (!tipoCuenta || guardando) return;

    setGuardando(true);
    setError("");

    try {
      const response = await fetch(API_CUENTAS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idCliente: CLIENTE_ACTIVO.id,
          tipo: tipoCuenta,
          saldoInicial: 0,
        }),

      const contentType = response.headers.get("content-type") ?? "";
      const responseText = await response.text();

      let data: CuentaResponse & {
        error?: string;
        errors?: Record<string, string>;
      } = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { message: responseText };
      }

      if (!response.ok) {
        const detalles =
          data.message ||
          data.error ||
          (data.errors ? JSON.stringify(data.errors) : "") ||
          `El backend rechazó la solicitud (${response.status}).`;

        throw new Error(detalles);
      }

      const numero = data.numeroCuenta ?? data.numero ?? data.accountNumber;

      if (!numero) {
        throw new Error(
          "El backend creó la cuenta, pero no devolvió el número de cuenta.",
        );
      }

      setNumeroCuenta(numero);
      setStep("success");
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "No fue posible conectar con el backend. Verifica que esté ejecutándose en el puerto 8080 y que CORS esté habilitado.",
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "No fue posible abrir la cuenta.",
        );
      }
    } finally {
      setGuardando(false);
    }
  }

  function handleReset() {
    setTipoCuenta("");
    setNumeroCuenta("");
    setError("");
    setStep("select");
  }

  const info = tipoCuenta ? CUENTA_INFO[tipoCuenta] : null;

  const STEPS = [
    { key: "select", label: "Tipo de cuenta", num: 1 },
    { key: "confirm", label: "Confirmar apertura", num: 2 },
    { key: "success", label: "Cuenta creada", num: 3 },
  ];

  return (
    <div className="flex h-full overflow-hidden" style={{ background: "#0f0a1e" }}>
      <Sidebar
        navItems={CLIENT_NAV}
        activeNav={activeNav}
        onNav={setActiveNav}
        userLabel={CLIENTE_ACTIVO.nombre}
        userSub={`CC ${CLIENTE_ACTIVO.cedula}`}
        userInitials={CLIENTE_ACTIVO.iniciales}
        badge="Banca Personal"
      />

      <main className="flex-1 overflow-y-auto">
        <div
          className="px-8 py-5 flex items-center justify-between sticky top-0 z-10"
          style={{
            background: "rgba(15,10,30,0.92)",
            borderBottom: "1px solid rgba(139,92,246,0.1)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="flex items-center gap-2 text-sm" style={{ color: "#7c6fa0" }}>
            <span>Mis Cuentas</span>
            <IcoChevron />
            <span style={{ color: "#c4b5fd" }}>Abrir Nueva Cuenta</span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: "rgba(16,185,129,0.1)",
                color: "#34d399",
                border: "1px solid rgba(16,185,129,0.25)",
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
              Cliente Activo
            </div>
            <span
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: "rgba(109,40,217,0.15)",
                color: "#c4b5fd",
                border: "1px solid rgba(139,92,246,0.2)",
              }}
            >
              HU-02-01-01
            </span>
          </div>
        </div>

        <div className="px-8 py-6 max-w-4xl">
          <div className="mb-8">
            <span
              className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded mb-2 inline-block"
              style={{
                background: "rgba(168,85,247,0.15)",
                color: "#a78bfa",
                fontFamily: "Instrument Sans,sans-serif",
              }}
            >
              Nueva Cuenta
            </span>
            <h1
              className="text-2xl font-bold mb-1"
              style={{
                color: "#f1eeff",
                fontFamily: "Instrument Sans,sans-serif",
                letterSpacing: "-0.3px",
              }}
            >
              Abre tu cuenta financiera
            </h1>
            <p className="text-sm" style={{ color: "#7c6fa0" }}>
              Selecciona el tipo de cuenta que mejor se adapta a tus necesidades.
            </p>
          </div>

          <div className="flex items-center gap-0 mb-8">
            {STEPS.map((s, i) => {
              const done =
                (step === "confirm" && s.key === "select") || step === "success";
              const active = step === s.key;

              return (
                <div key={s.key} className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                      style={{
                        background: done
                          ? "rgba(16,185,129,0.2)"
                          : active
                            ? "linear-gradient(135deg,#6d28d9,#a855f7)"
                            : "rgba(139,92,246,0.1)",
                        color: done ? "#10b981" : active ? "#fff" : "#7c6fa0",
                        border: done
                          ? "1px solid rgba(16,185,129,0.4)"
                          : active
                            ? "none"
                            : "1px solid rgba(139,92,246,0.2)",
                        fontFamily: "Instrument Sans,sans-serif",
                      }}
                    >
                      {done ? "✓" : s.num}
                    </div>
                    <span
                      className="text-xs font-medium"
                      style={{ color: active ? "#c4b5fd" : done ? "#10b981" : "#7c6fa0" }}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div
                      className="w-12 h-px mx-3"
                      style={{
                        background: done
                          ? "rgba(16,185,129,0.4)"
                          : "rgba(139,92,246,0.15)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {step === "select" && (
            <div className="flex flex-col gap-5">
              <div
                className="flex items-center gap-4 rounded-2xl px-5 py-4"
                style={{ background: "#130d24", border: "1px solid rgba(139,92,246,0.13)" }}
              >
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full font-bold"
                  style={{
                    background: "linear-gradient(135deg,rgba(109,40,217,0.4),rgba(168,85,247,0.3))",
                    color: "#c4b5fd",
                    fontFamily: "Instrument Sans,sans-serif",
                  }}
                >
                  {CLIENTE_ACTIVO.iniciales}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ color: "#f1eeff" }}>
                    {CLIENTE_ACTIVO.nombre}
                  </div>
                  <div className="text-xs" style={{ color: "#7c6fa0" }}>
                    CC {CLIENTE_ACTIVO.cedula} · {CLIENTE_ACTIVO.email}
                  </div>
                </div>
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: "rgba(16,185,129,0.12)",
                    color: "#34d399",
                    border: "1px solid rgba(16,185,129,0.25)",
                  }}
                >
                  <IcoShield /> Verificado
                </div>
                <div
                  className="text-xs px-3 py-1 rounded-full"
                  style={{
                    background: "rgba(139,92,246,0.1)",
                    color: "#a78bfa",
                    border: "1px solid rgba(139,92,246,0.2)",
                  }}
                >
                  ID: {CLIENTE_ACTIVO.id}
                </div>
              </div>

              <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                {(["ahorros", "corriente"] as const).map((tipo) => {
                  const ci = CUENTA_INFO[tipo];
                  const selected = tipoCuenta === tipo;

                  return (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => {
                        setTipoCuenta(tipo);
                        setError("");
                      }}
                      className="relative text-left rounded-2xl p-6 transition-all duration-200 w-full"
                      style={{
                        background: selected
                          ? "linear-gradient(135deg,rgba(109,40,217,0.22),rgba(168,85,247,0.12))"
                          : "#130d24",
                        border: selected
                          ? "2px solid rgba(139,92,246,0.55)"
                          : "2px solid rgba(139,92,246,0.13)",
                        boxShadow: selected ? "0 0 0 4px rgba(109,40,217,0.1)" : "none",
                      }}
                    >
                      <div
                        className="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: selected ? "rgba(168,85,247,0.25)" : "rgba(139,92,246,0.1)",
                          color: selected ? "#c4b5fd" : "#7c6fa0",
                          border: `1px solid ${selected ? "rgba(139,92,246,0.4)" : "rgba(139,92,246,0.15)"}`,
                        }}
                      >
                        {ci.badge}
                      </div>

                      <div
                        className="flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                        style={{ background: selected ? "rgba(109,40,217,0.3)" : "rgba(139,92,246,0.1)" }}
                      >
                        <span
                          style={{
                            color: selected ? "#a78bfa" : "#7c6fa0",
                            transform: "scale(1.4)",
                            display: "block",
                          }}
                        >
                          <IcoCuentas />
                        </span>
                      </div>

                      <div className="pr-16">
                        <div
                          className="text-base font-bold mb-1"
                          style={{
                            color: selected ? "#f1eeff" : "#c4b5fd",
                            fontFamily: "Instrument Sans,sans-serif",
                          }}
                        >
                          {ci.titulo}
                        </div>
                        <div className="text-xs mb-4" style={{ color: "#7c6fa0", lineHeight: "1.5" }}>
                          {ci.descripcion}
                        </div>
                        <ul className="flex flex-col gap-2">
                          {ci.beneficios.map((beneficio) => (
                            <li
                              key={beneficio}
                              className="flex items-start gap-2 text-xs"
                              style={{ color: selected ? "#c4b5fd" : "#7c6fa0" }}
                            >
                              <span
                                className="mt-0.5 shrink-0"
                                style={{ color: selected ? "#a78bfa" : "#4c1d95" }}
                              >
                                <IcoStar />
                              </span>
                              {beneficio}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div
                        className="absolute bottom-4 right-4 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{
                          background: selected
                            ? "linear-gradient(135deg,#6d28d9,#a855f7)"
                            : "rgba(139,92,246,0.12)",
                          border: selected ? "none" : "2px solid rgba(139,92,246,0.25)",
                        }}
                      >
                        {selected && <span className="text-white text-xs">✓</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3.5"
                style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)" }}
              >
                <span style={{ color: "#a78bfa", flexShrink: 0, marginTop: "1px" }}>
                  <IcoInfo />
                </span>
                <p className="text-xs" style={{ color: "#7c6fa0", lineHeight: "1.6" }}>
                  El <strong style={{ color: "#a78bfa" }}>saldo inicial será $0</strong>. El número de cuenta se genera automáticamente.
                </p>
              </div>

              {error && (
                <div
                  className="flex items-center gap-2 rounded-xl px-4 py-3"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
                >
                  <span style={{ color: "#f87171" }}>⚠</span>
                  <span className="text-sm" style={{ color: "#f87171" }}>{error}</span>
                </div>
              )}

              <div className="flex justify-end pb-6">
                <button
                  type="button"
                  onClick={handleContinue}
                  className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: "linear-gradient(135deg,#6d28d9,#a855f7)", color: "#fff", boxShadow: "0 4px 20px rgba(109,40,217,0.35)" }}
                >
                  Continuar <IcoChevron />
                </button>
              </div>
            </div>
          )}

          {step === "confirm" && info && (
            <div className="flex flex-col gap-5">
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(139,92,246,0.2)" }}>
                <div className="px-6 py-5" style={{ background: "linear-gradient(135deg,rgba(109,40,217,0.25),rgba(168,85,247,0.12))", borderBottom: "1px solid rgba(139,92,246,0.15)" }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#a78bfa", fontFamily: "Instrument Sans,sans-serif" }}>Resumen de apertura</div>
                  <div className="text-xl font-bold" style={{ color: "#f1eeff", fontFamily: "Instrument Sans,sans-serif" }}>{info.titulo}</div>
                </div>
                <div className="px-6 py-5" style={{ background: "#130d24" }}>
                  {[
                    { label: "Titular", value: CLIENTE_ACTIVO.nombre },
                    { label: "ID de cliente", value: CLIENTE_ACTIVO.id },
                    { label: "Tipo de cuenta", value: info.titulo },
                    { label: "Número de cuenta", value: "Se generará al confirmar", muted: true },
                    { label: "Saldo inicial", value: "$0,00 COP", highlight: true },
                    { label: "Estado", value: "Activa inmediatamente", green: true },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                      <span className="text-xs" style={{ color: "#7c6fa0" }}>{row.label}</span>
                      <span className="text-sm font-medium" style={{ color: row.green ? "#34d399" : row.highlight ? "#c4b5fd" : row.muted ? "#7c6fa0" : "#f1eeff" }}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-4" style={{ background: "rgba(139,92,246,0.05)", borderTop: "1px solid rgba(139,92,246,0.1)" }}>
                  <div className="flex items-start gap-2 text-xs" style={{ color: "#7c6fa0", lineHeight: "1.6" }}>
                    <span style={{ color: "#a78bfa", flexShrink: 0 }}><IcoInfo /></span>
                    Al confirmar aceptas los <span style={{ color: "#a78bfa", cursor: "pointer" }}>Términos y Condiciones</span> de Banco X.
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
                  <span style={{ color: "#f87171" }}>⚠</span>
                  <span className="text-sm" style={{ color: "#f87171" }}>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-between pb-6">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep("select");
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: "transparent", color: "#7c6fa0", border: "1px solid rgba(139,92,246,0.2)" }}
                >
                  ← Volver
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={guardando}
                  className="px-7 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: guardando ? "rgba(139,92,246,0.4)" : "linear-gradient(135deg,#6d28d9,#a855f7)",
                    color: "#fff",
                    boxShadow: "0 4px 20px rgba(109,40,217,0.35)",
                    cursor: guardando ? "not-allowed" : "pointer",
                  }}
                >
                  {guardando ? "Abriendo cuenta..." : "Confirmar apertura"}
                </button>
              </div>
            </div>
          )}

          {step === "success" && info && (
            <div className="flex flex-col items-center text-center gap-6 py-4 pb-10">
              <div className="relative flex items-center justify-center w-24 h-24 rounded-full" style={{ background: "rgba(16,185,129,0.1)", border: "2px solid rgba(16,185,129,0.35)" }}>
                <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "rgba(16,185,129,0.08)" }} />
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: "#f1eeff", fontFamily: "Instrument Sans,sans-serif" }}>¡Cuenta creada exitosamente!</h2>
                <p className="text-sm max-w-sm mx-auto" style={{ color: "#7c6fa0", lineHeight: "1.6" }}>Tu {info.titulo.toLowerCase()} ha sido abierta y está lista para usar.</p>
              </div>

              <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg,#3b0764,#6d28d9,#7c3aed)", boxShadow: "0 20px 40px rgba(109,40,217,0.4)" }}>
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between mb-8">
                    <div className="text-xs font-semibold tracking-wider opacity-70">BANCO X</div>
                    <div className="text-xs opacity-60">{info.titulo.toUpperCase()}</div>
                  </div>
                  <div className="text-lg font-bold tracking-widest mb-1" style={{ letterSpacing: "0.08em" }}>{numeroCuenta}</div>
                  <div className="text-xs opacity-60 mb-6">Número de cuenta</div>
                  <div className="flex items-end justify-between">
                    <div><div className="text-xs opacity-60 mb-0.5">Titular</div><div className="text-sm font-semibold">{CLIENTE_ACTIVO.nombre}</div></div>
                    <div className="text-right"><div className="text-xs opacity-60 mb-0.5">Saldo disponible</div><div className="text-lg font-bold">$0</div></div>
                  </div>
                </div>
                <div className="px-6 py-3 flex items-center justify-between" style={{ background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <span className="text-xs opacity-60">Estado</span>
                  <span className="text-xs font-semibold" style={{ color: "#86efac" }}>● Activa</span>
                </div>
              </div>

              <div className="w-full max-w-sm rounded-xl px-5 py-4 text-left" style={{ background: "#130d24", border: "1px solid rgba(139,92,246,0.15)" }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#7c6fa0", fontFamily: "Instrument Sans,sans-serif" }}>Detalles de la apertura</div>
                {[
                  { label: "Número de cuenta", value: numeroCuenta },
                  { label: "Tipo", value: info.titulo },
                  { label: "Saldo inicial", value: "$0,00 COP" },
                  { label: "Fecha de apertura", value: new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }) },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid rgba(139,92,246,0.07)" }}>
                    <span className="text-xs" style={{ color: "#7c6fa0" }}>{row.label}</span>
                    <span className="text-xs font-medium" style={{ color: "#c4b5fd" }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={handleReset} className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)" }}>Abrir otra cuenta</button>
                <button type="button" onClick={() => setActiveNav("inicio")} className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all" style={{ background: "linear-gradient(135deg,#6d28d9,#a855f7)", color: "#fff", boxShadow: "0 4px 20px rgba(109,40,217,0.35)" }}>Ir al inicio</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
