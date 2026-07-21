"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { MagicalParticles } from "@/components/ui/magical-particles";

export function WaitlistCTA() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Something went wrong.");
        return;
      }
      setStatus("done");
      setMessage(data.message || "You are inscribed in the archive.");
      setName("");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network tremor — try again in a moment.");
    }
  }

  return (
    <section id="waitlist" className="relative py-24 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-gold/30 bg-gradient-to-br from-[#5b2d8e] via-[#2a1048] to-[#12081c] px-6 py-12 sm:px-12 sm:py-16">
            <MagicalParticles count={20} />
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-violet-glow/10 blur-3xl" />

            <div className="relative mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.22em] text-gold-bright">
                <Sparkles className="h-3.5 w-3.5" />
                Seal your place
              </div>
              <h2 className="font-display text-4xl text-parchment sm:text-5xl">
                Your story is already waiting to be kept
              </h2>
              <p className="mt-4 text-parchment/70">
                Join the Royal Archive waitlist. Be first to craft chapters,
                pin Polaroids, and unfurl your Living Scroll.
              </p>

              <form
                onSubmit={onSubmit}
                className="mt-8 grid gap-3 sm:grid-cols-[1fr_1.2fr_auto]"
              >
                <label className="sr-only" htmlFor="waitlist-name">
                  Name
                </label>
                <input
                  id="waitlist-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="rounded-full border border-gold/20 bg-white/10 px-5 py-3 text-sm text-parchment placeholder:text-parchment/40 outline-none ring-gold-bright/40 focus:ring-2"
                />
                <label className="sr-only" htmlFor="waitlist-email">
                  Email
                </label>
                <input
                  id="waitlist-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="rounded-full border border-gold/20 bg-white/10 px-5 py-3 text-sm text-parchment placeholder:text-parchment/40 outline-none ring-gold-bright/40 focus:ring-2"
                />
                <button
                  type="submit"
                  disabled={status === "loading" || status === "done"}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-bright via-gold to-gold-dim px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-70"
                >
                  {status === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Inscribe me
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>

              {message ? (
                <p
                  role="status"
                  className={`mt-4 text-sm ${
                    status === "error" ? "text-red-300" : "text-gold-bright"
                  }`}
                >
                  {message}
                </p>
              ) : (
                <p className="mt-4 text-xs text-parchment/45">
                  No spam — only invitations, seals, and storycraft notes.
                </p>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}