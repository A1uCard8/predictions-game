import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help Center — Plains",
};

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-plains-void">Help Center</h1>
      <p className="mt-2 text-plains-muted">Quick answers for ranked predictions on Plains.</p>
      <dl className="mt-10 space-y-8">
        <div>
          <dt className="font-semibold text-plains-void">How do predictions work?</dt>
          <dd className="mt-2 text-sm leading-relaxed text-plains-muted">
            Pick one option per open market before it closes. Your choice is locked — no edits. When the market resolves,
            correct picks move your ELO up; incorrect picks move it down.
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-plains-void">Where do markets come from?</dt>
          <dd className="mt-2 text-sm leading-relaxed text-plains-muted">
            Operators seed markets from Valorant, Dome (Polymarket + Kalshi mirrors), Yahoo finance/crypto, and manual
            admin tools. Other feeds (commodities, TCG) can augment listings — see{" "}
            <Link href="/docs" className="text-plains-accent hover:underline">
              API docs
            </Link>{" "}
            for engineering notes.
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-plains-void">Is this gambling?</dt>
          <dd className="mt-2 text-sm leading-relaxed text-plains-muted">
            No. Plains is a reputation and skill-ranking experience. There is no real-money payout tied to prediction
            outcomes.
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-plains-void">Need more help?</dt>
          <dd className="mt-2 text-sm text-plains-muted">
            <Link href="/contact" className="text-plains-accent hover:underline">
              Contact the team →
            </Link>
          </dd>
        </div>
      </dl>
    </div>
  );
}
