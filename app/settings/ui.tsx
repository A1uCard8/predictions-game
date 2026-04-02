"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

export function SettingsForm({
  userId,
  initialUsername,
  initialAvatarUrl,
}: {
  userId: string;
  initialUsername: string;
  initialAvatarUrl: string | null | undefined;
}) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUsername);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function saveUsername(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);
    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setErr(data.error ?? "Update failed");
      return;
    }
    setMsg("Saved");
    router.refresh();
  }

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setMsg(null);
    setLoading(true);
    const supabase = createClient();
    const path = `${userId}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
      upsert: true,
      contentType: file.type,
    });
    if (upErr) {
      setLoading(false);
      setErr(upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub.publicUrl;
    const res = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar_url: url }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setErr(data.error ?? "Could not save avatar URL");
      return;
    }
    setAvatarUrl(url);
    setMsg("Avatar updated");
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-8">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-plains-border bg-plains-panel">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="" fill className="object-cover" sizes="64px" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-plains-muted">—</div>
          )}
        </div>
        <div>
          <label className="text-xs font-mono uppercase text-plains-muted">Profile picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={onAvatar}
            disabled={loading}
            className="mt-1 block w-full text-sm text-plains-muted file:mr-3 file:rounded file:border-0 file:bg-plains-panel file:px-3 file:py-1.5 file:text-foreground"
          />
        </div>
      </div>

      <form onSubmit={saveUsername} className="space-y-4">
        <div>
          <label className="text-xs font-mono uppercase text-plains-muted">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-lg border border-plains-border bg-plains-panel px-3 py-2 outline-none focus:border-plains-accent"
            minLength={3}
            maxLength={24}
            pattern="[a-zA-Z0-9_]+"
            title="Letters, numbers, underscore"
          />
        </div>
        {err && <p className="text-sm text-plains-danger">{err}</p>}
        {msg && <p className="text-sm text-plains-accent">{msg}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-plains-accent px-4 py-2 font-mono font-semibold text-plains-void disabled:opacity-50"
        >
          Save username
        </button>
      </form>
    </div>
  );
}
