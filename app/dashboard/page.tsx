import { redirect } from "next/navigation";

/** @deprecated Use /portfolio */
export default function DashboardRedirectPage() {
  redirect("/portfolio");
}
