import type { Metadata } from "next";
// @ts-ignore: Allow side-effect CSS import without type declarations
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Echoes — Preserve your legacy in magic",
  description: "Transform your life stories into an enchanted journey through time.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
