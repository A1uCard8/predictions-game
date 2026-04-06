import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Copyright — Plains",
};

export default function CopyrightPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-plains-muted">Legal</p>
      <h1 className="mt-2 text-3xl font-bold text-plains-void">Copyright</h1>
      <p className="mt-2 text-sm text-plains-muted">Last updated April 5, 2026</p>
      <div className="prose prose-sm mt-8 max-w-none space-y-4 text-plains-muted">
        <p>
          The Plains name, logo, UI, and original content on this site are owned by Plains or its licensors and protected
          by copyright and trademark laws. Third-party logos or imagery used in market thumbnails may belong to their
          respective owners and are used for informational context only.
        </p>
        <p>
          If you believe material on Plains infringes your copyright, send a notice including identification of the work,
          the URL on our service, and your contact information. We will review and respond as appropriate.
        </p>
      </div>
    </div>
  );
}
