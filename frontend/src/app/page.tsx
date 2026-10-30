"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import Image from "next/image";

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8" />
      <path d="M9.9 5.2A10.8 10.8 0 0112 5c5.2 0 8.8 4.7 9.8 6.3a1.2 1.2 0 010 1.4 16 16 0 01-3.2 3.4M6.2 6.2a17 17 0 00-4 5.1 1.2 1.2 0 000 1.4C3.2 14.3 6.8 19 12 19a10 10 0 004-.8" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.2 12s3.5-7 9.8-7 9.8 7 9.8 7-3.5 7-9.8 7-9.8-7-9.8-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function Home() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    setNotice("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setNotice(payload?.message || "We couldn't sign you in. Check your details and try again.");
        return;
      }

      const requestedPath = new URLSearchParams(window.location.search).get("next");
      const destination = requestedPath && requestedPath.startsWith("/") && !requestedPath.startsWith("//")
        ? requestedPath
        : "/dashboard";
      router.replace(destination);
      router.refresh();
    } catch {
      setNotice("Unable to reach MyAayaam. Please check that the application is running and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="welcome-panel" aria-label="Welcome to MyAayaam">
        <div className="welcome-topline">
          <div className="brand-lockup">
            <span className="brand-mark">
              <Image src="/myaayaam-mark.svg" alt="" width={34} height={34} priority />
            </span>
            <span className="brand-name">myaayaam<span>.</span></span>
          </div>
          <span className="workspace-label"><span className="live-dot" /> INVENTORY WORKSPACE</span>
        </div>

        <div className="welcome-content">
          <span className="eyebrow"><span className="eyebrow-line" /> CLARITY IN EVERY COUNT</span>
          <h1>Everything in its place.<br /><em>Every move,</em> in view.</h1>
          <p className="welcome-copy">
            A calmer way to keep your inventory moving. Bring your people,
            products and operations together in one considered workspace.
          </p>

          <div className="insight-card" aria-label="Inventory overview illustration">
            <div className="insight-heading">
              <div>
                <span className="insight-kicker">YOUR OPERATIONS</span>
                <p>One clear picture</p>
              </div>
              <span className="insight-period">OVERVIEW <span>↗</span></span>
            </div>
            <div className="insight-visual">
              <div className="visual-bars" aria-hidden="true">
                <span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span />
              </div>
              <div className="visual-caption"><span>Stock flow</span><span>Always in sync</span></div>
            </div>
            <div className="insight-footer">
              <div className="footer-orbit"><span /><span /><span /></div>
              <span>Thoughtful tools for better control.</span>
              <span className="footer-spark">✳</span>
            </div>
          </div>
        </div>

        <div className="welcome-footer">
          <span>BUILT FOR THE WAY YOUR BUSINESS MOVES</span>
          <span>01 — 03</span>
        </div>
        <div className="decor decor-one" />
        <div className="decor decor-two" />
      </section>

      <section className="login-panel">
        <div className="mobile-brand brand-lockup">
          <span className="brand-mark"><Image src="/myaayaam-mark.svg" alt="" width={34} height={34} priority /></span>
          <span className="brand-name">myaayaam<span>.</span></span>
        </div>

        <div className="login-content">
          <div className="login-heading">
            <span className="eyebrow login-eyebrow">WELCOME BACK</span>
            <h2>Good to see you<span>.</span></h2>
            <p>Sign in to pick up right where your business left off.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="email">Work email</label>
            <div className="input-wrap">
              <svg className="field-icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="3" />
                <path d="m4 7 8 6 8-6" />
              </svg>
              <input id="email" name="email" type="email" placeholder="you@company.com" autoComplete="username" required />
            </div>

            <div className="password-label-row">
              <label className="field-label" htmlFor="password">Password</label>
              <button className="text-action" type="button" onClick={() => setNotice("Please contact your system administrator to reset your password.")}>Forgot password?</button>
            </div>
            <div className="input-wrap">
              <svg className="field-icon" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="10" width="16" height="11" rx="3" />
                <path d="M8 10V7a4 4 0 018 0v3M12 14v3" />
              </svg>
              <input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" required minLength={1} />
              <button className="password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>
                <EyeIcon visible={showPassword} />
              </button>
            </div>

            <label className="remember-row">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              <span className="custom-check" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="m3 8 3 3 7-7" /></svg></span>
              <span>Keep me signed in</span>
            </label>

            <button className="sign-in-button" type="submit">
              <span>Sign in to workspace</span>
              <span className="button-icon"><ArrowIcon /></span>
            </button>
            {notice && <p className="form-notice" role="status">{notice}</p>}
          </form>

          <div className="security-note">
            <span className="security-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6l-7-3z" /><path d="m9 12 2 2 4-4" /></svg>
            </span>
            <span>Your workspace is private and protected.</span>
          </div>
        </div>

        <footer className="login-footer">
          <span>© 2026 MyAayaam</span>
          <span className="footer-links"><a href="mailto:support@myaayaam.com">Need help?</a><span className="footer-separator">·</span><span>Made for better operations</span></span>
        </footer>
      </section>
    </main>
  );
}
