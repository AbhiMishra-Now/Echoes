"use client";

import {
  Feather,
  Images,
  MessageCircleHeart,
  Scroll,
  Sparkles,
  Library,
} from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";

const features = [
  {
    icon: MessageCircleHeart,
    title: "AI Biographer Chat",
    body: "A warm, curious confidant that draws out the details you forgot you remembered — then crafts luminous prose.",
  },
  {
    icon: Feather,
    title: "Illuminated Chapters",
    body: "Memories become chapters with era labels, mood, and narrative arcs worthy of a royal chronicle.",
  },
  {
    icon: Images,
    title: "Polaroid Media Vault",
    body: "Photos, voice notes, and video attach like taped keepsakes — preserved with museum-grade care.",
  },
  {
    icon: Scroll,
    title: "Living Scroll 3D",
    body: "Your biography unfurls as a gold-trimmed magical scroll — interactive, shareable, unforgettable.",
  },
  {
    icon: Library,
    title: "Royal Archive Library",
    body: "Navigate decades like wings of a library. Every corridor is a chapter; every shelf a season of you.",
  },
  {
    icon: Sparkles,
    title: "Handcrafted Magic UI",
    body: "Parchment chat, leather navigation, wax-seal moments — a scrapbook reborn as enchanted correspondence.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-28">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(91,45,142,0.18),transparent_55%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            light
            eyebrow="The Archive Toolkit"
            title="Everything a legacy deserves — nothing a form should demand"
            description="Echoes blends conversational AI with a museum-quality memory vault so your story feels discovered, not documented."
          />
        </Reveal>

        <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <article className="group h-full rounded-3xl glass-royal p-6 transition duration-500 hover:-translate-y-1 hover:glow-violet">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-royal-mid/50 to-royal-deep border border-gold/20 text-gold-bright transition group-hover:scale-105">
                  <feature.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="font-display text-2xl text-parchment">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-parchment/65">
                  {feature.body}
                </p>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}