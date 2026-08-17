"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, ArrowRight, KeyRound, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function SignInForm({ destination }: { destination: string }) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const requestCode = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await fetch("/api/portal-auth/request-otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      setStep("otp");
      setMessage("If this email has access, a six-digit code is on its way.");
    } catch {
      setMessage("We could not request a code. Please try again shortly.");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result = await authClient.signIn.emailOtp({ email, otp });
    if (result.error) {
      setBusy(false);
      setMessage("That code is invalid or expired. Check it, or request a new one.");
      return;
    }
    window.location.assign(destination);
  };

  return (
    <div className="auth-card">
      <div className="auth-icon">{step === "email" ? <Mail size={22} /> : <KeyRound size={22} />}</div>
      <span className="kicker">SECURE CLIENT ACCESS</span>
      <h1>{step === "email" ? "Open your project workspace." : "Enter your sign-in code."}</h1>
      <p>{step === "email" ? "Use the email address approved for your MACM project. No password is needed." : `We sent a short-lived code to ${email}.`}</p>
      {step === "email" ? (
        <form onSubmit={requestCode} className="workspace-form">
          <label>Email address<input type="email" name="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <button className="button" disabled={busy}>{busy ? "Requesting…" : <>Send secure code <ArrowRight size={16} /></>}</button>
        </form>
      ) : (
        <form onSubmit={verify} className="workspace-form">
          <label>Six-digit code<input className="otp-input" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} /></label>
          <button className="button" disabled={busy || otp.length !== 6}>{busy ? "Checking…" : <>Sign in <ArrowRight size={16} /></>}</button>
          <button className="auth-back" type="button" onClick={() => { setStep("email"); setOtp(""); setMessage(""); }}><ArrowLeft size={15} /> Use another email</button>
        </form>
      )}
      {message && <p className="auth-message" role="status">{message}</p>}
      <small>Access is available only after a project enquiry has been approved. Codes expire after five minutes.</small>
    </div>
  );
}
