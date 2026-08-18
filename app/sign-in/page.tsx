import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/sign-in-form";
import { WorkspaceTheme } from "@/components/workspace-controls";
import { LanguageToggle } from "@/components/language-toggle";
import { currentPrincipal } from "@/lib/auth-guards";
import { getServerLocale } from "@/lib/server-locale";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Client sign in | MACM", robots: { index: false, follow: false } };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const principal = await currentPrincipal();
  if (principal) redirect(principal.user.role === "ADMIN" ? "/admin" : "/portal");
  const query = await searchParams;
  const destination = query.next === "/admin" ? "/admin" : "/portal";
  const locale = await getServerLocale();
  return (
    <main className="auth-page">
      <header className="auth-header"><Link href="/" className="brand">MACM<i /></Link><div className="auth-header-actions"><LanguageToggle compact /><WorkspaceTheme /></div></header>
      <SignInForm destination={destination} />
      <p className="auth-help">{locale === "si" ? "Access එක බලාපොරොත්තුවෙන්ද? " : "Waiting for access? "}<Link href="/#contact">{locale === "si" ? "Project enquiry එකක් යවන්න" : "Send a project enquiry"}</Link>.</p>
    </main>
  );
}
