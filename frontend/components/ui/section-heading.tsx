import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  light = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  light?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto max-w-3xl",
        align === "center" ? "text-center" : "text-left",
      )}
    >
      <p
        className={cn(
          "mb-3 text-xs font-semibold uppercase tracking-[0.28em]",
          light ? "text-gold-bright/90" : "text-gold",
        )}
      >
        {eyebrow}
      </p>
      <h2
        className={cn(
          "font-display text-balance text-4xl leading-[1.1] md:text-5xl lg:text-[3.4rem]",
          light ? "text-parchment" : "text-ink",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-5 text-base leading-relaxed md:text-lg",
            light ? "text-parchment/75" : "text-ink-soft/80",
            align === "center" && "mx-auto max-w-2xl",
          )}
        >
          {description}
        </p>
      ) : null}
      <div
        className={cn(
          "ornament-line mt-7",
          align === "center" ? "mx-auto w-28" : "w-28",
        )}
      />
    </div>
  );
}