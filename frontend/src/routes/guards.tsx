import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useFitStore } from "@/store/fitStore";

export function ProtectedRoute() {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function GuestRoute() {
  const token = useAuthStore((s) => s.token);
  return token ? <Navigate to="/home" replace /> : <Outlet />;
}

type Step = "brand" | "scan" | "recommendation";

/** Keeps users from deep-linking into a step whose prerequisites are missing. */
export function FlowGuard({ requires, children }: { requires: Step; children: React.ReactNode }) {
  const { category, brand, scan, recommendation } = useFitStore();
  if (!category) return <Navigate to="/home" replace />;
  if (requires !== "brand" && !brand) return <Navigate to="/brands" replace />;
  if (requires === "recommendation" && !scan) return <Navigate to="/upload" replace />;
  if (requires === "recommendation" && !recommendation) return <Navigate to="/processing" replace />;
  return <>{children}</>;
}
