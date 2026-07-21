"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Is Echoes just another journaling app?",
    a: "No. Echoes is a biography builder with an AI biographer, chapter architecture, media vault, and a 3D Living Scroll presentation layer — designed as a royal archive, not a daily log.",
  },
  {
    q: "Can elders who dislike technology use it?",
    a: "Yes. Many families sit together and speak memories aloud. The chat interface is conversational, large-type friendly, and guided with gentle prompts.",
  },
  {
    q: "What happens to my photos and recordings?",
    a: "Media is stored securely and attached to memories as Polaroid-style keepsakes inside your archive. You control sharing — private by default.",
  },
  {
    q: "Can I gift a Living Scroll?",
    a: "Absolutely. Chronicle and Royal House plans include heirloom sharing so you can present a scroll at celebrations, memorials, or reunions.",
  },
  {
    q: "Does the AI invent stories?",
    a: "The biographer expands from what you provide — clarifying, structuring, and illuminating. You remain the author of truth; Echoes is the quill and the binding.",
  },
  {
    q: "Is this ready for the Codex hackathon demo?",
    a: "Yes. Explore the magical landing experience, then open the dashboard to chat with the biographer, pin memories, and preview the Living Scroll.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            light
            eyebrow="Illuminated Answers"
            title="Questions from the reading room"
          />
        </Reveal>

        <div className="mt-12 space-y-3">
          {faqs.map((item, index) => {
            const isOpen = open === index;
            return (
              <Reveal key={item.q} delay={index * 0.04}>
                <div className="rounded-2xl glass-royal">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : index)}
                  >
                    <span className="font-display text-lg text-parchment sm:text-xl">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-gold transition duration-300",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-all duration-300",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm leading-relaxed text-parchment/65">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}