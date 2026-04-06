"use client";

import { useEffect, useState } from "react";

const NAMES = [
  "Goldman Sachs",
  "Citadel",
  "Jane Street",
  "Two Sigma",
  "DE Shaw",
  "Renaissance",
  "Bridgewater",
  "BlackRock",
  "JPMorgan",
  "Berkeley",
  "MIT",
  "Stanford",
  "Oxford",
  "DeepMind",
  "OpenAI",
  "Palantir",
  "Anduril",
  "McKinsey",
  "BCG",
  "the White House",
];

function scrambleToward(target: string, progress: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvw0123456789";
  let out = "";
  const len = Math.max(target.length, 8);
  for (let i = 0; i < len; i++) {
    const t = target[i] ?? "";
    if (progress >= 1 || t === " ") {
      out += t === undefined ? "" : t;
      continue;
    }
    if (t === " ") {
      out += " ";
      continue;
    }
    if (Math.random() < progress) out += t;
    else out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function RotatingInstitutions({
  tone = "default",
  compact = false,
}: {
  tone?: "default" | "hero" | "light";
  /** Smaller copy for homepage subhead */
  compact?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState(NAMES[0]);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const target = NAMES[index % NAMES.length];
    let frame = 0;
    const totalFrames = 28;
    const id = setInterval(() => {
      frame++;
      const p = frame / totalFrames;
      setPhase(p);
      setDisplay(scrambleToward(target, p * p));
      if (frame >= totalFrames) {
        clearInterval(id);
        setDisplay(target);
      }
    }, 45);
    return () => clearInterval(id);
  }, [index]);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % NAMES.length);
    }, 3800);
    return () => clearInterval(t);
  }, []);

  const muted =
    tone === "hero" ? "text-white/65" : tone === "light" ? "text-plains-muted" : "text-plains-muted";
  const lead =
    tone === "hero"
      ? "text-white/88"
      : tone === "light"
        ? "text-plains-void/80 font-medium tracking-[-0.01em]"
        : "text-foreground/90";
  const glow =
    tone === "hero" || tone === "light"
      ? phase < 1
        ? "0 0 14px rgba(232,185,35,0.4)"
        : undefined
      : undefined;

  const wrap = compact
    ? "mt-2 max-w-xl text-[13px] leading-snug sm:text-sm sm:leading-relaxed"
    : "mt-3 max-w-xl text-sm sm:text-base";

  return (
    <p className={`${wrap} ${muted}`}>
      <span className={lead}>Ranked predictions from the best of the best at…</span>{" "}
      <span className="font-mono text-sm font-semibold text-plains-accentDim tabular-nums" style={{ textShadow: glow }}>
        {display}
      </span>
    </p>
  );
}
