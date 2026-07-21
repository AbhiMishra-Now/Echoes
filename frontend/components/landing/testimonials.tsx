"use client";

import { Quote, Star } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";

const items = [
  {
    name: "Amelia R.",
    role: "Daughter & keeper of stories",
    quote:
      "Dad never wanted to “write a book.” With Echoes he just talked. Now we have a Living Scroll the grandkids open like treasure.",
    initials: "AR",
  },
  {
    name: "Jonah K.",
    role: "Memoirist",
    quote:
      "The UI feels like Hogwarts met a design studio. I open it and suddenly I’m willing to tell the hard chapters too.",
    initials: "JK",
  },
  {
    name: "Priya S.",
    role: "Family historian",
    quote:
      "Polaroids, voice notes, wax-seal moments — it finally looks like how memory feels. Magical without being gimmicky.",
    initials: "PS",
  },
];

export function Testimonials({
  extras = [],
}: {
  extras?: Array<{
    name: string;
    role: string;
    quote: string;
    avatarInitials: string;
  }>;
}) {
  const all = [
    ...items,
    ...extras.map((t) => ({
      name: t.name,
      role: t.role,
      quote: t.quote,
      initials: t.avatarInitials,
    })),
  ].slice(0, 3);

  return (
    <section className="relative py-24 sm:py-28">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_bottom,rgba(212,168,83,0.08),transparent_50%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            light
            eyebrow="Letters from the Archive"
            title="Loved ones, speaking softly about forever"
          />
        </Reveal>

        <Stagger className="mt-14 grid gap-6 lg:grid-cols-3">
          {all.map((t) => (
            <StaggerItem key={t.name}>
              <figure className="flex h-full flex-col rounded-3xl glass-royal p-7">
                <Quote className="h-8 w-8 text-gold/50" aria-hidden />
                <blockquote className="mt-4 flex-1 text-base leading-relaxed text-parchment/80">
                  “{t.quote}”
                </blockquote>
                <div className="mt-6 flex items-center gap-3 border-t border-gold/10 pt-5">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-royal-mid to-royal-deep font-display text-sm text-gold-bright">
                    {t.initials}
                  </div>
                  <div>
                    <figcaption className="font-medium text-parchment">
                      {t.name}
                    </figcaption>
                    <p className="text-xs text-parchment/50">{t.role}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5 text-gold">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                </div>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}