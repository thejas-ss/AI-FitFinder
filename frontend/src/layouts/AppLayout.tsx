import { AnimatePresence } from "framer-motion";
import { useLocation, useOutlet } from "react-router-dom";
import { Footer } from "@/components/Footer/Footer";
import { Navbar } from "@/components/Navbar/Navbar";

/** Shell for signed-in pages: glass navbar, animated route transitions, footer. */
export function AppLayout() {
  const location = useLocation();
  const outlet = useOutlet();
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-base">
        Skip to content
      </a>
      <Navbar />
      <div className="flex-1 pt-10">
        <AnimatePresence mode="wait">
          <div key={location.pathname}>{outlet}</div>
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}

/** Centered shell for login/register/password pages. */
export function AuthLayout() {
  const location = useLocation();
  const outlet = useOutlet();
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <AnimatePresence mode="wait">
        <div key={location.pathname} className="w-full">
          {outlet}
        </div>
      </AnimatePresence>
    </div>
  );
}
