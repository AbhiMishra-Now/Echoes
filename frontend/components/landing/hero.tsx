"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import { useRef } from "react";
import { MagicalParticles } from "@/components/ui/magical-particles";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.2]);
  const scrollRotate = useTransform(scrollYProgress, [0, 1], [0, -8]);

  return (
    <section
      ref={ref}
      className="relative isolate min-h-[100svh] overflow-hidden pt-24 sm:pt-28"
    >
      <div className="absolute inset-0 -z-20">
        <Image
          src="/images/hero-archive.png"
          alt="The Royal Archive of Human Memories — enchanted library hall"
          fill
          priority
          className="object-cover object-center opacity-45"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#140a22]/70 via-[#1c0f2e]/85 to-[#12081c]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(18,8,28,0.75)_75%)]" />
      </div>

      <MagicalParticles count={36} />

      <motion.div
        style={{ y, opacity }}
        className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-24 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:px-8 lg:pb-32"
      >
        <div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08 }}
            className="font-script text-3xl text-gold-bright/90 sm:text-4xl"
          >
            The Royal Archive of Human Memories
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.14 }}
            className="mt-4 font-display text-balance text-5xl leading-[1.02] text-parchment sm:text-6xl lg:text-7xl"
          >
            Turn living memories into a{" "}
            <span className="text-gold-gradient animate-shimmer">
              lasting legacy
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.22 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-parchment/75 sm:text-lg"
          >
            Echoes is an AI-powered biography builder that listens like a
            cherished confidant, writes like a master storyteller, and preserves
            your life as a gold-trimmed Living Scroll — handcrafted, magical,
            and forever yours.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <a
              href="#waitlist"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-bright via-gold to-gold-dim px-7 py-3.5 text-sm font-semibold text-ink shadow-[0_12px_40px_rgba(212,168,83,0.35)] transition hover:brightness-110"
            >
              Seal Your First Memory
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </a>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/30 bg-white/5 px-7 py-3.5 text-sm font-medium text-parchment backdrop-blur transition hover:border-gold/50 hover:bg-white/10"
            >
              <BookOpenCheck className="h-4 w-4 text-gold-bright" />
              Explore the Dashboard
            </Link>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-12 grid grid-cols-3 gap-4 border-t border-gold/15 pt-8"
          >
            {[
              { label: "Memories preserved", value: "48k+" },
              { label: "Living Scrolls", value: "12k" },
              { label: "Avg. legacy score", value: "98%" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="text-[11px] uppercase tracking-[0.18em] text-parchment/45">
                  {stat.label}
                </dt>
                <dd className="mt-1 font-display text-2xl text-gold-bright sm:text-3xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          style={{ rotateX: scrollRotate }}
          className="perspective-scroll relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <div className="scroll-face relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-royal-mid/30 via-transparent to-gold/20 blur-2xl animate-pulse-glow" />
            <div className="relative overflow-hidden rounded-[1.6rem] border border-gold/30 bg-leather p-3 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold-bright to-transparent" />
              <div className="relative overflow-hidden rounded-[1.2rem]">
                <Image
                  src="/images/living-scroll.png"
                  alt="Gold-trimmed Living Scroll biography preview"
                  width={900}
                  height={1100}
                  className="h-auto w-full object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1c0f2e]/90 via-transparent to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-5 sm:p-6">
                  <p className="font-script text-2xl text-gold-bright">
                    Chapter III — The Golden Years
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-parchment/80">
                    “She kept every ticket stub like a star chart, mapping the
                    nights that made her brave…”
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gold-bright animate-pulse-glow" />
                    <span className="text-xs uppercase tracking-[0.2em] text-parchment/60">
                      Living Scroll · Interactive
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -left-6 top-16 hidden w-36 rotate-[-8deg] sm:block">
              <div className="polaroid">
                <div className="aspect-square overflow-hidden bg-parchment-deep">
                  <Image
                    src="/images/polaroid-memories.png"
                    alt="Polaroid memory collage"
                    width={240}
                    height={240}
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="mt-2 text-center font-script text-lg text-ink">
                  Keep this
                </p>
              </div>
              <div className="tape absolute -top-2 left-1/2 h-5 w-16 -translate-x-1/2 rotate-2" />
            </div>

            <div className="absolute -right-4 bottom-20 hidden max-w-[11rem] rotate-[6deg] rounded-xl glass-parchment p-3 sm:block">
              <p className="text-[10px] uppercase tracking-[0.18em] text-gold-dim">
                AI Biographer
              </p>
              <p className="mt-1 text-xs leading-relaxed text-ink/80">
                “Tell me about the kitchen that smelled like cinnamon…”
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#12081c] to-transparent" />
    </section>
  );
}
