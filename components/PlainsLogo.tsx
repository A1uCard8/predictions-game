export function PlainsLogo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-mono text-lg font-bold uppercase tracking-[0.15em] text-plains-accent ${className}`}
    >
      Plains
    </span>
  );
}
