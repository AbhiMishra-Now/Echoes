"use client";

import { useMemo } from "react";

export function MagicalParticles({ count = 28 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        top: `${(i * 53) % 100}%`,
        size: 2 + (i % 4),
        delay: `${(i % 10) * 0.4}s`,
        duration: `${5 + (i % 6)}s`,
        gold: i % 3 === 0,
      })),
    [count],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full animate-float"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
            background: p.gold
              ? "radial-gradient(circle, #f0d78c, transparent)"
              : "radial-gradient(circle, #c4a1ff, transparent)",
            opacity: 0.55,
            boxShadow: p.gold
              ? "0 0 10px rgba(240, 215, 140, 0.6)"
              : "0 0 10px rgba(196, 161, 255, 0.55)",
          }}
        />
      ))}
    </div>
  );
}