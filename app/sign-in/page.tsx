import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/sign-in-form";
import { WorkspaceTheme } from "@/components/workspace-controls";
import { currentPrincipal } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Client sign in | MACM", robots: { index: false, follow: false } };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const principal = await currentPrincipal();
  if (principal) redirect(principal.user.role === "ADMIN" ? "/admin" : "/portal");
  const query = await searchParams;
  const destination = query.next === "/admin" ? "/admin" : "/portal";
  return (
    <main className="auth-page">
      <header className="auth-header"><Link href="/" className="brand">MACM<i /></Link><WorkspaceTheme /></header>
      <SignInForm destination={destination} />
      <p className="auth-help">Waiting for access? <Link href="/#contact">Send a project enquiry</Link>.</p>
    </main>
  );
}
