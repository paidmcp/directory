"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useMemo } from "react";

type MagneticButtonProps = {
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
};

export function MagneticButton({ children, className, type = "button", onClick }: MagneticButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 180, damping: 16 });
  const springY = useSpring(y, { stiffness: 180, damping: 16 });
  const style = useMemo(() => ({ x: springX, y: springY }), [springX, springY]);

  return (
    <motion.button
      type={type}
      className={className}
      style={prefersReducedMotion ? undefined : style}
      onMouseMove={(event) => {
        if (prefersReducedMotion) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        x.set(dx * 0.12);
        y.set(dy * 0.12);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}
