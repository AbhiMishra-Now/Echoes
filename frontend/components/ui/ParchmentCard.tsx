import { type ReactNode } from "react";
export function ParchmentCard({ children, className = "" }: { children: ReactNode; className?: string }) { return <article className={`parchment-card parchment-texture ${className}`}>{children}</article>; }
