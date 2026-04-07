import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
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
  let profileCredits: number | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
    if (user?.id) {
      const { data: row } = await supabase
        .from("users")
        .select("username, avatar_url, credits, current_streak")
        .eq("id", user.id)
        .maybeSingle();
      profileUsername = row?.username ?? null;
      profileAvatarUrl = row?.avatar_url ?? null;
      profileCredits = typeof row?.credits === "number" ? row.credits : null;
    }
  } catch {
    /* missing env during build */
  }

  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} min-h-screen bg-plains-canvas font-sans text-foreground antialiased`}
      >
        <SiteNav
          user={user}
          profileUsername={profileUsername}
          profileAvatarUrl={profileAvatarUrl}
          profileCredits={profileCredits}
        />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
