"use client";
import { useEffect, useState, useRef } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

const GOLD_COLORS = ["#D4AF37", "#FFDF00", "#F5D061", "#E6C543", "#FFF8DC"];

export function SparkleTrail() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const nextId = useRef(0);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const newParticles: Particle[] = [];
      const count = Math.random() > 0.5 ? 2 : 1;
      
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 1.5 + 0.5;
        newParticles.push({
          id: nextId.current++,
          x: e.clientX,
          y: e.clientY + window.scrollY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.8,
          size: Math.random() * 6 + 4,
          color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
          alpha: 1,
        });
      }
      
      setParticles((prev) => [...prev, ...newParticles].slice(-40));
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const updateParticles = () => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            alpha: p.alpha - 0.03,
          }))
          .filter((p) => p.alpha > 0)
      );
      requestRef.current = requestAnimationFrame(updateParticles);
    };

    requestRef.current = requestAnimationFrame(updateParticles);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: "50%",
            transform: "translate(-50%, -50%) rotate(45deg)",
            opacity: p.alpha,
            boxShadow: `0 0 ${p.size * 1.5}px ${p.color}`,
            pointerEvents: "none",
            clipPath: "polygon(50% 0%, 65% 35%, 100% 50%, 65% 65%, 50% 100%, 35% 65%, 0% 50%, 35% 35%)",
          }}
        />
      ))}
    </div>
  );
}
