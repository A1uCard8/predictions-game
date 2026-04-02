import type { Metadata } from "next";
import localFont from "next/font/local";
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
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
    if (user?.id) {
      const { data: row } = await supabase.from("users").select("username").eq("id", user.id).maybeSingle();
      profileUsername = row?.username ?? null;
    }
  } catch {
    /* missing env during build */
  }

  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-plains-void text-foreground`}>
        <SiteNav user={user} profileUsername={profileUsername} />
        {children}
      </body>
    </html>
  );
}
