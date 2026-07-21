"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

const benefits = [
  "Preserve voice, warmth, and wit — not just dates and facts",
  "Guided prompts for elders who “don’t know where to start”",
  "Private by default with heirloom sharing controls",
  "Beautiful enough to gift; deep enough to last centuries",
  "Works on mobile so memories can be caught in the moment",
  "Export chapters or present the Living Scroll in full glory",
];

export function Benefits() {
  return (
    <section id="benefits" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-gold/20 to-royal-mid/30 blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-gold/25 shadow-[0_30px_80px_rgba(0,0,0,0.4)]">
                <Image
                  src="/images/ai-biographer.webp"
                  alt="AI biographer writing on illuminated parchment"
                  width={900}
                  height={700}
                  className="h-auto w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-2 max-w-xs rounded-2xl glass-parchment p-4 sm:-right-6">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold-dim">
                  From the quill
                </p>
                <p className="mt-1 font-display text-lg leading-snug text-ink">
                  “Every life is already a masterpiece. We simply turn the
                  pages.”
                </p>
              </div>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <SectionHeading
                light
                align="left"
                eyebrow="Why families choose Echoes"
                title="Because stories disappear unless someone keeps the light on"
                description="Echoes is built for the people you love — and the versions of yourself you refuse to let fade."
              />
            </Reveal>

            <ul className="mt-10 space-y-4">
              {benefits.map((benefit, i) => (
                <Reveal key={benefit} delay={i * 0.05}>
                  <li className="flex items-start gap-3 text-parchment/80">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-gold"
                      aria-hidden
                    />
                    <span className="text-sm leading-relaxed sm:text-base">
                      {benefit}
                    </span>
                  </li>
                </Reveal>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
