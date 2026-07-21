"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, ScrollText, X } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "#features", label: "Features" },
  { href: "#showcase", label: "Living Scroll" },
  { href: "#benefits", label: "Why Echoes" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-500",
        scrolled
          ? "border-b border-gold/15 bg-[#140a22]/75 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-leather glow-gold transition group-hover:scale-105">
            <ScrollText className="h-5 w-5 text-gold-bright" aria-hidden />
          </span>
          <span className="font-display text-2xl tracking-wide text-parchment">
            Echoes
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-parchment/70 transition hover:text-gold-bright"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/dashboard"
            className="rounded-full px-4 py-2 text-sm text-parchment/80 transition hover:text-gold-bright"
          >
            Open Archive
          </Link>
          <a
            href="#waitlist"
            className="rounded-full bg-gradient-to-r from-gold to-gold-dim px-5 py-2.5 text-sm font-semibold text-ink shadow-[0_8px_24px_rgba(212,168,83,0.28)] transition hover:brightness-110"
          >
            Begin Your Story
          </a>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gold/20 text-parchment md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        id="mobile-nav"
        className={cn(
          "border-t border-gold/10 bg-[#140a22]/95 backdrop-blur-xl md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <div className="flex flex-col gap-1 px-4 py-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-3 text-parchment/85 hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/dashboard"
            className="mt-2 rounded-full bg-gradient-to-r from-gold to-gold-dim px-5 py-3 text-center text-sm font-semibold text-ink"
            onClick={() => setOpen(false)}
          >
            Enter the Archive
          </Link>
        </div>
      </div>
    </header>
  );
}