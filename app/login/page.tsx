import Link from "next/link";
import { LoginForm } from "./ui";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="font-mono text-2xl font-bold text-plains-accent">Log in</h1>
      <p className="mt-2 text-sm text-plains-muted">
        No wallet. Just skill.{" "}
        <Link href="/signup" className="text-plains-accent hover:underline">
          Create account
        </Link>
      </p>
      {searchParams.error && (
        <p className="mt-4 rounded border border-plains-danger/40 bg-plains-danger/10 px-3 py-2 text-sm text-plains-danger">
          Something went wrong. Try again.
        </p>
      )}
      <LoginForm nextPath={searchParams.next} />
    </div>
  );
}
