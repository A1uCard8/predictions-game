"use client";

import { useId } from "react";
import type { TierId } from "@/lib/tiers";

const common = "h-3.5 w-3.5 shrink-0";

export function TierIcon({ id }: { id: TierId }) {
  const raw = useId();
  const uid = raw.replace(/:/g, "");

  switch (id) {
    case "bronze":
      return (
        <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M8 1l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1 2-4z" fill="#b87333" opacity="0.9" />
        </svg>
      );
    case "silver":
      return (
        <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
          <rect x="2" y="4" width="12" height="9" rx="1" fill="#b8c0cc" />
          <path d="M5 2h6l1 2H4l1-2z" fill="#d1d5db" />
        </svg>
      );
    case "gold":
      return (
        <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M8 2l1.5 3 3.5.5-2.5 2.5.6 3.5L8 10l-3.1 1.5.6-3.5L3 5.5 6.5 5 8 2z" fill="#f5c542" />
        </svg>
      );
    case "platinum":
      return (
        <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M2 12L8 3l6 9H2z" fill="#67e8f9" opacity="0.85" />
        </svg>
      );
    case "diamond":
      return (
        <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M8 1l3 5 4 2-7 8-7-8 4-2 3-5z" fill="#a78bfa" />
        </svg>
      );
    case "master":
      return (
        <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
          <circle cx="8" cy="8" r="6" stroke="#fb7185" strokeWidth="2" />
          <circle cx="8" cy="8" r="2" fill="#fb7185" />
        </svg>
      );
    case "grandmaster": {
      const g = `gm-${uid}`;
      return (
        <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
          <defs>
            <linearGradient id={g} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00ffb3" />
              <stop offset="18%" stopColor="#00a8ff" />
              <stop offset="36%" stopColor="#6366f1" />
              <stop offset="52%" stopColor="#ec4899" />
              <stop offset="68%" stopColor="#fb923c" />
              <stop offset="84%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#00ffb3" />
            </linearGradient>
          </defs>
          <path
            d="M8 1l1.8 4.2L14 6.3l-3.2 3.1.8 4.6L8 11.9 4.4 14l.8-4.6L2 6.3l4.2-1.1L8 1z"
            fill={`url(#${g})`}
          />
        </svg>
      );
    }
    case "top500": {
      const g = `t5-${uid}`;
      return (
        <svg className={common} viewBox="0 0 16 16" fill="none" aria-hidden>
          <defs>
            <linearGradient id={g} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7f1d1d" />
              <stop offset="30%" stopColor="#ea580c" />
              <stop offset="58%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#fef9c3" />
            </linearGradient>
          </defs>
          <path
            d="M8 1l1.8 4.2L14 6.3l-3.2 3.1.8 4.6L8 11.9 4.4 14l.8-4.6L2 6.3l4.2-1.1L8 1z"
            fill={`url(#${g})`}
          />
        </svg>
      );
    }
    default:
      return null;
  }
}
