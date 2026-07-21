"use client";

import { Reveal } from "@/components/ui/reveal";

const logos = [
  "Heritage Weekly",
  "Storycraft Lab",
  "Lumen Press",
  "Atlas Journals",
  "Kinfolk AI",
  "Nova Archive",
];

export function SocialProof() {
  return (
    <section className="relative border-y border-gold/10 bg-[#10081a]/80 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <p className="text-center text-xs uppercase tracking-[0.28em] text-parchment/45">
            Trusted by families, memoirists & cultural institutions
          </p>
        </Reveal>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {logos.map((name) => (
            <span
              key={name}
              className="font-display text-lg tracking-wide text-parchment/35 transition hover:text-gold/70 sm:text-xl"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}