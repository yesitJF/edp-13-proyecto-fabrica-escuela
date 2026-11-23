import { Navigate, createBrowserRouter } from "react-router";
import {
  AccountView, BalanceView, CardView, CredentialsView, DashboardView, DetailView,
  HistoryView, LoginView, LogoutView, ManagerLookupView, TransactionForm,
} from "./views/FunctionalViews";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", Component: LoginView },
  { path: "/inicio", Component: DashboardView },
  { path: "/cuentas/nueva", Component: AccountView },
  { path: "/cuentas/saldo", Component: BalanceView },
  { path: "/cuentas/historial", Component: HistoryView },
  { path: "/cuentas/transaccion", Component: DetailView },
  { path: "/tarjetas/debito", element: <CardView /> },
  { path: "/tarjetas/credito", element: <CardView credit /> },
  { path: "/transferencias", element: <TransactionForm kind="transfer" /> },
  { path: "/retiros", element: <TransactionForm kind="withdraw" /> },
  { path: "/consignaciones", element: <TransactionForm kind="deposit" /> },
  { path: "/perfil/seguridad", Component: CredentialsView },
  { path: "/gestor/clientes", element: <ManagerLookupView /> },
  { path: "/gestor/clientes/nuevo", element: <ManagerLookupView create /> },
  { path: "/inicio/logout", Component: LogoutView },
  { path: "*", element: <Navigate to="/login" replace /> },
]);
