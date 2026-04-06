import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Plains",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-plains-muted">Legal</p>
      <h1 className="mt-2 text-3xl font-bold text-plains-void">Terms of Service</h1>
      <p className="mt-2 text-sm text-plains-muted">Last updated April 5, 2026</p>
      <div className="mt-8 max-w-none space-y-4 text-sm leading-relaxed text-plains-muted">
        <p>
          Plains is an entertainment and skill-ranking product. Predictions are <strong className="text-foreground">not
          financial instruments</strong>, contracts for difference, or wagering for money. There is{" "}
          <strong className="text-foreground">no real-money betting</strong> on this platform.
        </p>
        <p>
          You are responsible for your account activity. Do not abuse the service, attempt to manipulate outcomes, scrape
          data in violation of our technical policies, or harass other users. We may suspend accounts that violate these
          terms or threaten platform integrity.
        </p>
        <p>
          Markets resolve according to published criteria and administrator verification. We strive for fairness but do
          not guarantee error-free resolution. ELO and leaderboard placements are informational and may change as markets
          resolve.
        </p>
        <p>
          The service is provided <strong className="text-foreground">&quot;as is&quot;</strong> without warranties. To
          the maximum extent permitted by law, Plains and its operators are not liable for indirect or consequential
          damages arising from use of the product.
        </p>
        <p>
          We may update these terms. Continued use after changes constitutes acceptance. For questions, see{" "}
          <Link href="/contact" className="text-plains-accent hover:underline">
            Contact
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
