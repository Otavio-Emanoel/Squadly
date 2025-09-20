"use client";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";

export default function PublicGroupLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);

  const direction = useMemo(() => {
    const from = prevPath.current || "";
    const to = pathname || "";
    // Direção: login -> register (1), register -> login (-1), demais 0
    const is = (p: string, k: string) => p.includes(`/${k}`);
    if (is(from, "login") && is(to, "register")) return 1;
    if (is(from, "register") && is(to, "login")) return -1;
    return 0;
  }, [pathname]);

  useEffect(() => { prevPath.current = pathname; }, [pathname]);

  return (
    <div className="relative min-h-dvh" style={{ overflowX: "clip" }}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: direction === 0 ? 0 : direction * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction === 0 ? 0 : direction * -24 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{ willChange: "transform" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
