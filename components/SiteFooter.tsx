import Link from "next/link";

const link = "text-xs text-plains-muted transition hover:text-plains-accent";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-plains-border bg-plains-sidebar/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-plains-muted">Plains</p>
          <p className="mt-2 max-w-xs text-sm text-plains-muted">
            Ranked predictions on real-world events. No real money — reputation only.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3">
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-plains-muted">Product</p>
            <Link href="/markets" className={link}>
              Markets
            </Link>
            <Link href="/leaderboard" className={link}>
              Leaderboard
            </Link>
            <Link href="/docs" className={link}>
              API docs
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-plains-muted">Trust</p>
            <Link href="/terms" className={link}>
              Terms of Service
            </Link>
            <Link href="/privacy" className={link}>
              Privacy Policy
            </Link>
            <Link href="/copyright" className={link}>
              Copyright
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-mono text-[10px] uppercase tracking-wider text-plains-muted">Support</p>
            <Link href="/help" className={link}>
              Help Center
            </Link>
            <Link href="/contact" className={link}>
              Contact
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-plains-border/70 py-4 text-center font-mono text-[10px] text-plains-muted">
        © {new Date().getFullYear()} Plains. All rights reserved.
      </div>
    </footer>
  );
}
