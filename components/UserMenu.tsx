"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Props = {
  email?: string;
  username: string | null;
  avatarUrl: string | null;
};

export function UserMenu({ email, username, avatarUrl }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const profileHref = username ? `/profile/${encodeURIComponent(username)}` : "/settings";
  const initials = (username ?? email ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden border-2 border-plains-border/30 bg-plains-containerHigh transition hover:border-plains-primary/40"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        {avatarUrl ? (
          avatarUrl.includes("supabase.co") ? (
            <Image src={avatarUrl} alt="" width={36} height={36} className="h-full w-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          )
        ) : (
          <span className="font-mono text-xs font-bold text-plains-void">{initials}</span>
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 z-[80] mt-2 w-52 bg-plains-panel py-1 shadow-glow"
          role="menu"
        >
          <div className="border-b border-plains-border/15 px-3 py-2">
            <p className="truncate font-headline text-sm font-bold text-plains-void">{username ?? "Player"}</p>
            {email ? <p className="truncate text-[11px] text-plains-muted">{email}</p> : null}
          </div>
          <Link
            href={profileHref}
            className="block px-3 py-2 text-sm font-medium text-plains-void hover:bg-plains-mist"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <Link
            href="/portfolio"
            className="block px-3 py-2 text-sm font-medium text-plains-void hover:bg-plains-mist"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Portfolio
          </Link>
          <Link
            href="/settings"
            className="block px-3 py-2 text-sm font-medium text-plains-void hover:bg-plains-mist"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <form action="/api/auth/signout" method="post" className="border-t border-plains-border/15">
            <button
              type="submit"
              className="w-full px-3 py-2 text-left text-sm text-plains-danger hover:bg-plains-mist"
              role="menuitem"
            >
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
