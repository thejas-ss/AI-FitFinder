import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, Ruler, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useFitStore } from "@/store/fitStore";
import { initials } from "@/utils/format";

const LINKS = [
  { to: "/home", label: "Home" },
  { to: "/brands", label: "Brands" },
  { to: "/upload", label: "Scan" },
  { to: "/profile", label: "Profile" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const resetFlow = useFitStore((s) => s.reset);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    resetFlow();
    navigate("/login", { replace: true });
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      isActive ? "bg-white/15 text-white" : "text-white/70 hover:text-white"
    }`;

  return (
    <header className="sticky top-4 z-40 mx-auto w-[min(1200px,calc(100%-2rem))]">
      <nav aria-label="Main" className="glass flex items-center justify-between px-4 py-3 !rounded-full">
        <Link to="/home" className="flex items-center gap-2 font-bold">
          <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary">
            <Ruler className="size-5" aria-hidden />
          </span>
          <span>
            AI-<span className="text-gradient">FitFinder</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user && (
            <Link
              to="/profile"
              aria-label="Your profile"
              className="grid size-9 place-items-center overflow-hidden rounded-full bg-white/15 text-sm font-semibold"
            >
              {user.avatar_url ? <img src={user.avatar_url} alt="" className="size-full object-cover" /> : initials(user.name)}
            </Link>
          )}
          <button type="button" onClick={handleLogout} className="btn-ghost !rounded-full !px-4 !py-2 text-sm">
            <LogOut className="size-4" aria-hidden /> Logout
          </button>
        </div>

        <button
          type="button"
          className="rounded-full p-2 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X aria-hidden /> : <Menu aria-hidden />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass mt-2 flex flex-col gap-1 p-3 md:hidden"
          >
            {LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            <button type="button" onClick={handleLogout} className="btn-ghost mt-2">
              <LogOut className="size-4" aria-hidden /> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
