import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Plains",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-plains-muted">Legal</p>
      <h1 className="mt-2 text-3xl font-bold text-plains-void">Privacy Policy</h1>
      <p className="mt-2 text-sm text-plains-muted">Last updated April 5, 2026</p>
      <div className="mt-8 max-w-none space-y-4 text-sm leading-relaxed text-plains-muted">
        <p>
          We collect account data you provide (such as email and username) and technical data required to run the product
          (logs, device/browser metadata). Authentication and core storage are handled by our infrastructure providers
          (e.g. Supabase) under their respective terms.
        </p>
        <p>
          <strong className="text-foreground">Public by design:</strong> usernames, ELO, prediction history shown on your
          profile, and leaderboard placement are visible to other users. Do not share sensitive personal information in
          usernames or public fields.
        </p>
        <p>
          We use data to operate the service, prevent abuse, and improve reliability. We do not sell your personal
          information. We may share limited data with processors strictly necessary to host and secure the platform.
        </p>
        <p>
          Depending on jurisdiction, you may request access or deletion of personal data. Contact us at{" "}
          <Link href="/contact" className="text-plains-accent hover:underline">
            the contact page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
