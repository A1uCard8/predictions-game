import Link from "next/link";
import { SignupForm } from "./ui";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="font-mono text-2xl font-bold text-plains-accent">Sign up</h1>
      <p className="mt-2 text-sm text-plains-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-plains-accent hover:underline">
          Log in
        </Link>
      </p>
      <SignupForm />
    </div>
  );
}
