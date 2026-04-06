import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Plains",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-plains-void">Contact us</h1>
      <p className="mt-4 text-plains-muted leading-relaxed">
        For support, partnerships, or legal notices, email your operators at the address you configure for production.
      </p>
      <p className="mt-6 rounded-xl border border-plains-border bg-plains-panel p-4 font-mono text-sm text-plains-muted">
        Replace this page body with a real <span className="text-foreground">support@</span> inbox or form action before
        launch.
      </p>
    </div>
  );
}
