import { cn } from "@/lib/utils";

const LEAF =
  "M12 12C9.2 9.6 7.4 6 9.6 4.1c1-.9 2.4-.5 2.4.9 0-1.4 1.4-1.8 2.4-.9C16.6 6 14.8 9.6 12 12Z";

type LogoMarkProps = {
  className?: string;
  title?: string;
};

/** Trevo de quatro folhas em traço. A cor vem de `currentColor`. */
export function LogoMark({ className, title }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinejoin="round"
      strokeLinecap="round"
      className={cn("size-6", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {[0, 90, 180, 270].map((deg) => (
        <path key={deg} d={LEAF} transform={`rotate(${deg} 12 12)`} />
      ))}
      <path d="M12 12c1.4 3.2 3.6 5.8 6.5 7.5" />
    </svg>
  );
}

type LogoProps = {
  className?: string;
};

/** Marca completa: símbolo + nome. */
export function Logo({ className }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex size-9 items-center justify-center rounded-[10px] bg-graphite text-primary">
        <LogoMark className="size-5" />
      </span>
      <span className="font-display text-[22px] font-semibold tracking-[-0.5px] text-foreground">
        Trevo
      </span>
    </span>
  );
}
