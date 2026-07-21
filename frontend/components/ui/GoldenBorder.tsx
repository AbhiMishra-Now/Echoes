import { type ReactNode } from "react";
export function GoldenBorder({ children, className = "" }: { children: ReactNode; className?: string }) { return <div className={`golden-border ${className}`}>{children}</div>; }
