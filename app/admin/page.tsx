import { AdminPanel } from "./ui";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-mono text-2xl font-bold text-plains-accent">Admin</h1>
      <p className="mt-2 text-sm text-plains-muted">
        Create markets and resolve them. Uses <code className="text-plains-accent">ADMIN_PASSWORD</code> from env
        (sent as <code className="text-plains-accent">X-Admin-Password</code> header — use HTTPS in production).
      </p>
      <AdminPanel />
    </div>
  );
}
