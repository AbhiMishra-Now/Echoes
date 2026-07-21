"use client";

import { Check } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Quill",
    price: "Free",
    blurb: "Begin the archive with your first chapters.",
    features: [
      "1 Living Scroll",
      "AI biographer (limited)",
      "Photo attachments",
      "Private link sharing",
    ],
    cta: "Start Free",
    featured: false,
  },
  {
    name: "Chronicle",
    price: "$19",
    period: "/month",
    blurb: "For families building a full multi-decade legacy.",
    features: [
      "Unlimited chapters",
      "Full AI biographer stream",
      "Audio & video memories",
      "Heirloom sharing circles",
      "Priority Living Scroll render",
    ],
    cta: "Begin Chronicle",
    featured: true,
  },
  {
    name: "Royal House",
    price: "$49",
    period: "/month",
    blurb: "Institutions, multi-elder homes, and estate keepsakes.",
    features: [
      "Up to 10 biographies",
      "Curator workspace",
      "Export & print suites",
      "Dedicated onboarding",
      "Custom seal & cover tones",
    ],
    cta: "Request Access",
    featured: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            light
            eyebrow="Membership Seals"
            title="Choose how your archive grows"
            description="Start with a single memory. Upgrade when the story asks for more room."
          />
        </Reveal>

        <Stagger className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <StaggerItem key={plan.name}>
              <article
                className={cn(
                  "relative flex h-full flex-col rounded-3xl p-7 transition duration-500",
                  plan.featured
                    ? "bg-gradient-to-b from-[#5b2d8e] to-[#2a1048] glow-gold scale-[1.02]"
                    : "glass-royal hover:-translate-y-1",
                )}
              >
                {plan.featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-gold-bright to-gold px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink">
                    Most cherished
                  </span>
                ) : null}
                <h3 className="font-display text-3xl text-parchment">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-parchment/60">{plan.blurb}</p>
                <p className="mt-6 font-display text-5xl text-gold-bright">
                  {plan.price}
                  {plan.period ? (
                    <span className="text-lg text-parchment/50">
                      {plan.period}
                    </span>
                  ) : null}
                </p>
                <ul className="mt-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-parchment/75"
                    >
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                        aria-hidden
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#waitlist"
                  className={cn(
                    "mt-8 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition",
                    plan.featured
                      ? "bg-gradient-to-r from-gold-bright via-gold to-gold-dim text-ink hover:brightness-110"
                      : "border border-gold/30 text-parchment hover:bg-white/5",
                  )}
                >
                  {plan.cta}
                </a>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}