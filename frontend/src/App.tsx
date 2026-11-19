import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatedBackground } from "@/components/Background/AnimatedBackground";
import { AppLayout, AuthLayout } from "@/layouts/AppLayout";
import { FlowGuard, GuestRoute, ProtectedRoute } from "@/routes/guards";

const LoginPage = lazy(() => import("@/pages/Login/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/Register/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/Password/PasswordPages").then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("@/pages/Password/PasswordPages").then((m) => ({ default: m.ResetPasswordPage })));
const HomePage = lazy(() => import("@/pages/Home/HomePage"));
const BrandsPage = lazy(() => import("@/pages/Brands/BrandsPage"));
const UploadPage = lazy(() => import("@/pages/Upload/UploadPage"));
const ProcessingPage = lazy(() => import("@/pages/Processing/ProcessingPage"));
const ResultPage = lazy(() => import("@/pages/Result/ResultPage"));
const ShoppingPage = lazy(() => import("@/pages/Shopping/ShoppingPage"));
const ProfilePage = lazy(() => import("@/pages/Profile/ProfilePage"));
const NotFoundPage = lazy(() => import("@/pages/NotFound/NotFoundPage"));

function PageFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status">
      <span className="size-10 animate-spin rounded-full border-4 border-white/20 border-t-accent" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <>
      <AnimatedBackground />
      <Suspense fallback={<PageFallback />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Navigate to="/home" replace />} />

            <Route element={<GuestRoute />}>
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              </Route>
            </Route>
            <Route element={<AuthLayout />}>
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/brands" element={<FlowGuard requires="brand"><BrandsPage /></FlowGuard>} />
                <Route path="/upload" element={<FlowGuard requires="scan"><UploadPage /></FlowGuard>} />
                <Route path="/processing" element={<FlowGuard requires="scan"><ProcessingPage /></FlowGuard>} />
                <Route path="/result" element={<FlowGuard requires="recommendation"><ResultPage /></FlowGuard>} />
                <Route path="/shopping" element={<FlowGuard requires="recommendation"><ShoppingPage /></FlowGuard>} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  );
}
