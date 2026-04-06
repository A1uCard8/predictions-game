import type { Metadata } from "next";
import localFont from "next/font/local";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Plains — Ranked predictions",
  description: "Predict real-world events. Climb the ELO ladder. No money — just reputation.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user: { email?: string; id?: string } | null = null;
  let profileUsername: string | null = null;
  let profileAvatarUrl: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
    if (user?.id) {
      const { data: row } = await supabase
        .from("users")
        .select("username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      profileUsername = row?.username ?? null;
      profileAvatarUrl = row?.avatar_url ?? null;
    }
  } catch {
    /* missing env during build */
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-plains-app text-foreground`}
      >
        <SiteNav user={user} profileUsername={profileUsername} profileAvatarUrl={profileAvatarUrl} />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
