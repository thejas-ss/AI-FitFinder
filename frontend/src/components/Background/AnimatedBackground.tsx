import { motion, useReducedMotion } from "framer-motion";

const BLOBS = [
  { color: "#4F8CFF", size: 520, x: ["-10%", "15%", "-10%"], y: ["-10%", "10%", "-10%"], pos: "left-0 top-0" },
  { color: "#8B5CF6", size: 460, x: ["10%", "-15%", "10%"], y: ["5%", "-10%", "5%"], pos: "right-0 top-1/4" },
  { color: "#EC4899", size: 420, x: ["0%", "12%", "0%"], y: ["10%", "-5%", "10%"], pos: "left-1/4 bottom-0" },
];

/** Floating gradient blobs behind the glass UI (blue → purple → pink). */
export function AnimatedBackground() {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-base">
      {BLOBS.map((b) => (
        <motion.div
          key={b.color}
          className={`absolute rounded-full opacity-40 blur-3xl ${b.pos}`}
          style={{ width: b.size, height: b.size, background: b.color }}
          animate={reduce ? undefined : { x: b.x, y: b.y }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(15,23,42,0)_0%,rgba(15,23,42,0.7)_70%)]" />
    </div>
  );
}
