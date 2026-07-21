"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";

const chapters = [
  { title: "Origins", year: "1962–1978", note: "Roots, kitchens, first snows" },
  { title: "Becoming", year: "1979–1995", note: "Cities, letters, first loves" },
  { title: "Gathering", year: "1996–2010", note: "Family tables & quiet bravery" },
  { title: "Legacy", year: "2011–Now", note: "Wisdom worth leaving behind" },
];

export function Showcase() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const rotateY = useTransform(scrollYProgress, [0, 0.5, 1], [18, 0, -12]);
  const lift = useTransform(scrollYProgress, [0, 0.5, 1], [60, 0, -40]);

  return (
    <section
      id="showcase"
      ref={ref}
      className="relative overflow-hidden py-24 sm:py-32"
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-[#1a0d2c] to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            light
            eyebrow="Product Showcase"
            title="The Living Scroll — your life, unfurled in gold"
            description="Not a PDF. Not a folder of notes. A dimensional chronicle you can turn, share, and feel — as if the archive itself remembers with you."
          />
        </Reveal>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            style={{ rotateY, y: lift }}
            className="perspective-scroll relative mx-auto w-full max-w-lg"
          >
            <div className="absolute -inset-8 rounded-full bg-royal-mid/20 blur-3xl animate-pulse-glow" />
            <div className="scroll-face relative rounded-[1.75rem] border border-gold/35 bg-gradient-to-b from-[#4a286e] to-[#1a0b2e] p-4 shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
              <div className="overflow-hidden rounded-[1.25rem] border border-gold/20">
                <Image
                  src="/images/living-scroll.png"
                  alt="Interactive Living Scroll product view"
                  width={800}
                  height={1000}
                  className="h-auto w-full object-cover"
                />
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {chapters.map((c) => (
                  <div
                    key={c.title}
                    className="rounded-xl border border-gold/15 bg-white/5 px-2 py-3 text-center"
                  >
                    <p className="font-display text-sm text-gold-bright">
                      {c.title}
                    </p>
                    <p className="mt-1 text-[10px] text-parchment/50">{c.year}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="space-y-6">
            {[
              {
                title: "Conversational capture",
                body: "Speak or type freely. The AI biographer asks the questions a great interviewer would — gentle, precise, unforgettable.",
              },
              {
                title: "Media that feels kept",
                body: "Polaroids, voice fragments, and film clips rest on parchment pages with tape, seals, and handwritten captions.",
              },
              {
                title: "A scroll the family can hold",
                body: "Gift a Living Scroll at reunions, birthdays, or farewells. One link. Generations of presence.",
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 0.08}>
                <div className="rounded-2xl glass-royal p-6 transition hover:border-gold/35">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="font-display text-2xl text-gold">
                      0{i + 1}
                    </span>
                    <h3 className="font-display text-2xl text-parchment">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-parchment/65">
                    {item.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}