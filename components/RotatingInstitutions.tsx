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

export function RotatingInstitutions() {
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

  return (
    <p className="mt-3 max-w-xl text-sm text-plains-muted sm:text-base">
      <span className="text-foreground/90">Ranked predictions from the best of the best at…</span>{" "}
      <span
        className="font-mono text-plains-accent tabular-nums"
        style={{ textShadow: phase < 1 ? "0 0 12px rgba(0,229,168,0.25)" : undefined }}
      >
        {display}
      </span>
    </p>
  );
}
