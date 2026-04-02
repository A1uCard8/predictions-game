"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    router.push(nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard");
    router.refresh();
  }

  async function google() {
    const supabase = createClient();
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath ?? "/dashboard")}` },
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div>
        <label className="text-xs font-mono uppercase text-plains-muted">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-plains-border bg-plains-panel px-3 py-2 outline-none focus:border-plains-accent"
        />
      </div>
      <div>
        <label className="text-xs font-mono uppercase text-plains-muted">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-plains-border bg-plains-panel px-3 py-2 outline-none focus:border-plains-accent"
        />
      </div>
      {err && <p className="text-sm text-plains-danger">{err}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-plains-accent py-3 font-mono font-semibold text-plains-void disabled:opacity-50"
      >
        {loading ? "…" : "Log in"}
      </button>
      <button
        type="button"
        onClick={google}
        className="w-full rounded-lg border border-plains-border py-3 font-medium hover:border-plains-accent/40"
      >
        Continue with Google
      </button>
    </form>
  );
}
