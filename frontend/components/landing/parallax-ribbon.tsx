"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const phrases = [
  "Royal Correspondence",
  "Living Scroll",
  "Polaroid Vault",
  "AI Biographer",
  "Illuminated Chapters",
  "Heirloom Sharing",
  "Magical Scrapbook",
  "Human Memories",
];

export function ParallaxRibbon() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const x = useTransform(scrollYProgress, [0, 1], [0, -280]);

  return (
    <div ref={ref} className="relative overflow-hidden border-y border-gold/15 py-6">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#12081c] via-transparent to-[#12081c] z-10" />
      <motion.div style={{ x }} className="flex w-max gap-10 whitespace-nowrap">
        {[...phrases, ...phrases, ...phrases].map((phrase, i) => (
          <span
            key={`${phrase}-${i}`}
            className="font-display text-2xl text-parchment/25 sm:text-3xl"
          >
            <span className="mx-3 text-gold/40">✦</span>
            {phrase}
          </span>
        ))}
      </motion.div>
    </div>
  );
}