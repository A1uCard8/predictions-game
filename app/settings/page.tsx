import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./ui";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <p className="mt-2 text-sm text-plains-muted">Username and profile picture (Supabase Storage bucket &quot;avatars&quot;).</p>
      <SettingsForm
        userId={user.id}
        initialUsername={profile?.username ?? ""}
        initialAvatarUrl={profile?.avatar_url}
      />
      <form action="/api/auth/signout" method="post" className="mt-10 border-t border-plains-border pt-8">
        <button
          type="submit"
          className="rounded-lg border border-plains-border px-4 py-2 text-sm text-plains-muted hover:border-plains-danger/50 hover:text-plains-danger"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
