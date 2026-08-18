"use client";

import { FormEvent, ClipboardEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, KeyRound, Mail, RefreshCw } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useLanguage } from "@/components/language-provider";

const OTP_LENGTH = 6;
const OTP_LIFETIME_SECONDS = 20 * 60;
const RESEND_COOLDOWN_SECONDS = 30;

export function SignInForm({ destination }: { destination: string }) {
  const { t } = useLanguage();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(OTP_LIFETIME_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const code = digits.join("");

  useEffect(() => {
    if (step !== "otp" || secondsRemaining <= 0) return;
    const timer = window.setInterval(() => setSecondsRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [step, secondsRemaining]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => setResendCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const requestCode = async () => {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/portal-auth/request-otp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      if (!response.ok) throw new Error("Request failed");
      setDigits(Array(OTP_LENGTH).fill(""));
      setSecondsRemaining(OTP_LIFETIME_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setStep("otp");
      setMessage(t("signin.emailCopy"));
      window.setTimeout(() => inputRefs.current[0]?.focus(), 0);
    } catch {
      setMessage(t("signin.emailCopy"));
    } finally {
      setBusy(false);
    }
  };

  const handleRequest = (event: FormEvent) => { event.preventDefault(); void requestCode(); };

  const verify = async (event: FormEvent) => {
    event.preventDefault();
    if (secondsRemaining <= 0) {
      setMessage(t("signin.expired"));
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const result = await authClient.signIn.emailOtp({ email, otp: code });
      if (result.error) {
        setMessage(t("signin.expired"));
        setDigits(Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }
      window.location.assign(destination);
    } catch {
      setMessage(t("signin.expired"));
    } finally {
      setBusy(false);
    }
  };

  const setCodeFromText = (value: string, startIndex = 0) => {
    const cleaned = value.replace(/\D/g, "").slice(0, OTP_LENGTH - startIndex);
    if (!cleaned) return;
    setDigits((current) => {
      const next = [...current];
      cleaned.split("").forEach((digit, offset) => { next[startIndex + offset] = digit; });
      return next;
    });
    inputRefs.current[Math.min(startIndex + cleaned.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleInput = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length > 1) {
      setCodeFromText(cleaned, index);
      return;
    }
    setDigits((current) => { const next = [...current]; next[index] = cleaned; return next; });
    if (cleaned && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>, index: number) => {
    event.preventDefault();
    setCodeFromText(event.clipboardData.getData("text"), index);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const minutes = String(Math.floor(secondsRemaining / 60)).padStart(2, "0");
  const seconds = String(secondsRemaining % 60).padStart(2, "0");

  return (
    <div className="auth-card">
      <div className="auth-icon">{step === "email" ? <Mail size={22} /> : <KeyRound size={22} />}</div>
      <span className="kicker">{t("signin.kicker")}</span>
      <div className="otp-stepper" aria-label={t("signin.steps")}><span className={`otp-step${step === "email" ? " is-active" : ""}`}><b>1</b> {t("signin.emailStep")}</span><span className={`otp-step${step === "otp" ? " is-active" : ""}`}><b>2</b> {t("signin.codeStep")}</span></div>
      <h1>{step === "email" ? t("signin.emailTitle") : t("signin.otpTitle")}</h1>
      <p>{step === "email" ? t("signin.emailCopy") : `${t("signin.otpCopy")} ${email}.`}</p>
      {step === "email" ? (
        <form onSubmit={handleRequest} className="workspace-form">
          <label>{t("signin.emailLabel")}<input type="email" name="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <button className="button" disabled={busy}>{busy ? t("signin.requesting") : <>{t("signin.sendCode")} <ArrowRight size={16} /></>}</button>
        </form>
      ) : (
        <form onSubmit={verify} className="workspace-form">
          <label>{t("signin.codeLabel")}</label>
          <div className="otp-slots" role="group" aria-label={t("signin.codeAria")}>
            {digits.map((digit, index) => <input key={index} ref={(element) => { inputRefs.current[index] = element; }} aria-label={`Code digit ${index + 1} of ${OTP_LENGTH}`} autoComplete={index === 0 ? "one-time-code" : "off"} inputMode="numeric" pattern="[0-9]*" maxLength={OTP_LENGTH} value={digit} onChange={(event) => handleInput(index, event.target.value)} onPaste={(event) => handlePaste(event, index)} onKeyDown={(event) => handleKeyDown(event, index)} />)}
          </div>
          <div className="otp-expiry"><span>{secondsRemaining > 0 ? <>{t("signin.expires")} <strong>{minutes}:{seconds}</strong></> : <strong>{t("signin.expired")}</strong>}</span><span>{t("signin.oneUse")}</span></div>
          <button className="button" disabled={busy || code.length !== OTP_LENGTH || secondsRemaining <= 0}>{busy ? t("signin.checking") : <>{t("signin.signIn")} <ArrowRight size={16} /></>}</button>
          <div className="otp-actions"><button className="text-button" type="button" disabled={busy || resendCooldown > 0} onClick={() => void requestCode()}><RefreshCw size={14} /> {resendCooldown > 0 ? `${t("signin.resend")} ${resendCooldown}s` : t("signin.resend")}</button><button className="auth-back" type="button" onClick={() => { setStep("email"); setDigits(Array(OTP_LENGTH).fill("")); setMessage(""); }}><ArrowLeft size={15} /> {t("signin.useAnother")}</button></div>
        </form>
      )}
      {message && <p className="auth-message" role="status">{message}</p>}
      <small>{t("signin.accessNote")}</small>
    </div>
  );
}
