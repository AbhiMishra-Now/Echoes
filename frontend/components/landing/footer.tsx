import Link from "next/link";
import { ScrollText } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gold/10 bg-[#0c0614] py-14">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-leather glow-gold">
              <ScrollText className="h-5 w-5 text-gold-bright" />
            </span>
            <span className="font-display text-2xl text-parchment">Echoes</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-parchment/55">
            The Royal Archive of Human Memories — an AI-powered biography
            builder that turns life into a Living Scroll.
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold/70">
            Explore
          </p>
          <ul className="mt-4 space-y-2 text-sm text-parchment/60">
            <li>
              <a href="#features" className="hover:text-gold-bright">
                Features
              </a>
            </li>
            <li>
              <a href="#showcase" className="hover:text-gold-bright">
                Living Scroll
              </a>
            </li>
            <li>
              <a href="#pricing" className="hover:text-gold-bright">
                Pricing
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:text-gold-bright">
                FAQ
              </a>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold/70">
            Product
          </p>
          <ul className="mt-4 space-y-2 text-sm text-parchment/60">
            <li>
              <Link href="/dashboard" className="hover:text-gold-bright">
                Open Dashboard
              </Link>
            </li>
            <li>
              <a href="#waitlist" className="hover:text-gold-bright">
                Join Waitlist
              </a>
            </li>
            <li>
              <span className="text-parchment/40">Privacy (soon)</span>
            </li>
            <li>
              <span className="text-parchment/40">Terms (soon)</span>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold/70">
            Correspondence
          </p>
          <p className="mt-4 text-sm text-parchment/60">
            hello@echoes.archive
          </p>
          <p className="mt-2 text-sm text-parchment/45">
            Crafted with parchment, gold leaf, and careful code.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-7xl border-t border-gold/10 px-4 pt-6 text-center text-xs text-parchment/35 sm:px-6 lg:px-8">
        © {new Date().getFullYear()} Echoes — Royal Archive of Human Memories.
        All stories remain with their authors.
      </div>
    </footer>
  );
}
