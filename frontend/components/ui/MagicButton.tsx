import Link from "next/link";
import { type ReactNode } from "react";

type Props = { children: ReactNode; href?: string; variant?: "gold" | "outline"; className?: string };
export function MagicButton({ children, href = "/dashboard", variant = "gold", className = "" }: Props) {
  return <Link href={href} className={`magic-button ${variant === "outline" ? "outline" : ""} ${className}`}>{children}</Link>;
}
