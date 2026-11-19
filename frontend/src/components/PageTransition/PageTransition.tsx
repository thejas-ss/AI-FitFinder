import { motion } from "framer-motion";

export function PageTransition({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.main
      id="main"
      initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`mx-auto w-[min(1200px,calc(100%-2rem))] ${className}`}
    >
      {children}
    </motion.main>
  );
}

export function PageHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <header className="mb-8 text-center">
      {eyebrow && <p className="text-sm font-medium uppercase tracking-widest text-accent">{eyebrow}</p>}
      <h1 className="mt-2 text-balance text-4xl font-bold sm:text-5xl">{title}</h1>
      {description && <p className="mx-auto mt-3 max-w-2xl text-pretty text-white/70">{description}</p>}
    </header>
  );
}
