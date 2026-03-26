"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import persistentStore from "@/lib/store/persistentStore";
import AUTHAPI from "@/lib/api/auth/request";
import toast from "react-hot-toast";
import Link from "next/link";
import { setCookie } from "nookies";
import { Lock, Loader2, ArrowLeft, AlertTriangle, Info } from "lucide-react";

// ─── OTP Input: 6 individual digit boxes ─────────────────────────────────────

function OTPInput({ value, onChange, disabled }) {
  const inputsRef = useRef([]);
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);

  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) return;
    const char = val.slice(-1);
    const next = digits.map((d, idx) => (idx === i ? char : d)).join("");
    onChange(next);
    if (i < 5) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        const next = digits.map((d, idx) => (idx === i ? "" : d)).join("");
        onChange(next);
      } else if (i > 0) {
        inputsRef.current[i - 1]?.focus();
        const next = digits.map((d, idx) => (idx === i - 1 ? "" : d)).join("");
        onChange(next);
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputsRef.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < 5) {
      inputsRef.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    onChange(pasted);
    const nextIdx = Math.min(pasted.length, 5);
    inputsRef.current[nextIdx]?.focus();
  };

  useEffect(() => {
    if (value === "") inputsRef.current[0]?.focus();
  }, [value]);

  return (
    <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          autoFocus={i === 0}
          style={{
            fontFamily: "'DM Mono', 'Fira Mono', 'Courier New', monospace",
            letterSpacing: "0.05em",
          }}
          className={`
            w-11 h-14 text-center text-xl font-semibold rounded-xl border-2 transition-all duration-150 outline-none
            ${digit ? "border-slate-800 bg-slate-50 text-slate-900" : "border-slate-200 bg-white text-slate-900"}
            focus:border-slate-800 focus:bg-white focus:shadow-[0_0_0_3px_rgba(15,23,42,0.08)]
            disabled:opacity-40 disabled:cursor-not-allowed
            caret-transparent select-none
          `}
        />
      ))}
    </div>
  );
}

// ─── Attempt bar ──────────────────────────────────────────────────────────────

function AttemptBar({ attempts, max }) {
  if (!attempts) return null;
  const remaining = max - attempts;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
      <AlertTriangle size={14} stroke="#d97706" />
      <span className="text-xs font-medium text-amber-700">
        {remaining === 1
          ? "Last attempt — you'll be redirected after this"
          : `${remaining} attempts remaining`}
      </span>
    </div>
  );
}

// ─── TOTP Form ────────────────────────────────────────────────────────────────

function TOTPForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (code.length !== 6 || loading) return;

    setLoading(true);
    try {
      const preAuthToken = persistentStore.getState().preAuthToken;
      if (!preAuthToken) {
        toast.error("Session expired. Please log in again.");
        router.push("/login");
        return;
      }

      const res = await AUTHAPI.verify2FA({
        pre_auth_token: preAuthToken,
        code,
      });

      if (res?.data?.status === "success" && res?.data?.token) {
        persistentStore.setState({
          token: res.data.token,
          profile: res.data.user,
          preAuthToken: null,
        });
        setCookie(null, process.env.NEXT_PUBLIC_TOKEN, res.data.token, {
          path: "/",
        });
        toast.success("Verified successfully!");
        router.push("/");
      } else {
        toast.error("Unexpected response. Please try again.");
      }
    } catch (err) {
      const next = attempts + 1;
      setAttempts(next);
      setCode("");

      if (err?.data?.errors) {
        Object.values(err.data.errors).forEach((msg) =>
          toast.error(Array.isArray(msg) ? msg[0] : msg),
        );
      } else {
        toast.error(
          err?.data?.message || "That code didn't match. Please try again.",
        );
      }

      if (next >= MAX_ATTEMPTS) {
        toast.error("Too many failed attempts. Redirecting to login…");
        setTimeout(() => router.push("/login"), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (code.length === 6) handleSubmit();
  }, [code]);

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-sm text-slate-500">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>

      <OTPInput value={code} onChange={setCode} disabled={loading} />

      <AttemptBar attempts={attempts} max={MAX_ATTEMPTS} />

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || code.length !== 6}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200"
        style={{
          background: code.length === 6 && !loading ? "#0f172a" : "#e2e8f0",
          color: code.length === 6 && !loading ? "#fff" : "#94a3b8",
          cursor: code.length === 6 && !loading ? "pointer" : "not-allowed",
        }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Verifying…
          </>
        ) : (
          "Verify & Sign In"
        )}
      </button>

      <p className="text-xs text-center text-slate-400">
        Codes refresh every 30 seconds. Make sure your device clock is synced.
      </p>
    </div>
  );
}

// ─── Backup Code Form ─────────────────────────────────────────────────────────

function BackupCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 6 || loading) return;

    setLoading(true);
    try {
      const preAuthToken = persistentStore.getState().preAuthToken;
      if (!preAuthToken) {
        toast.error("Session expired. Please log in again.");
        router.push("/login");
        return;
      }

      const res = await AUTHAPI.redeemBackupCode(preAuthToken, trimmed);
      persistentStore.setState({
        token: res.data.token,
        profile: res.data.user,
        preAuthToken: null,
      });
      setCookie(null, process.env.NEXT_PUBLIC_TOKEN, res.data.token, {
        path: "/",
      });
      toast.success("Backup code accepted. You're now signed in.");
      router.push("/");
    } catch (err) {
      toast.error(err?.data?.message || "Invalid or already-used backup code.");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="text-sm text-slate-500">
          Enter one of the backup codes you saved when you set up 2FA
        </p>
      </div>

      <div className="space-y-2">
        <input
          type="text"
          placeholder="********"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())
          }
          autoFocus
          disabled={loading}
          maxLength={12}
          style={{
            fontFamily: "'DM Mono', 'Fira Mono', monospace",
            letterSpacing: "0.12em",
          }}
          className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-lg text-center uppercase tracking-widest focus:outline-none focus:border-slate-800 focus:shadow-[0_0_0_3px_rgba(15,23,42,0.08)] transition-all disabled:opacity-40 bg-white text-slate-900"
        />
        <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1.5">
          <Info size={11} />
          Each backup code can only be used once
        </p>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || code.trim().length < 6}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200"
        style={{
          background:
            code.trim().length >= 6 && !loading ? "#0f172a" : "#e2e8f0",
          color: code.trim().length >= 6 && !loading ? "#fff" : "#94a3b8",
          cursor:
            code.trim().length >= 6 && !loading ? "pointer" : "not-allowed",
        }}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Verifying…
          </>
        ) : (
          "Use Backup Code"
        )}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Verify2FA() {
  const [mode, setMode] = useState("totp");

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background: "linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)",
      }}
    >
      {/* Subtle background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)",
          backgroundSize: "28px 28px",
          opacity: 0.35,
        }}
      />

      <div className="relative w-full max-w-sm space-y-5">
        {/* Back link */}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft size={13} /> Back to login
        </Link>

        {/* Card */}
        <div
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
          style={{
            boxShadow:
              "0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 60px -10px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)",
          }}
        >
          {/* Header stripe */}
          <div
            className="px-8 pt-8 pb-6 text-center"
            style={{ borderBottom: "1px solid #f1f5f9" }}
          >
            <div
              className="inline-flex items-center justify-center w-11 h-11 rounded-2xl mb-4 text-white"
              style={{
                background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
              }}
            >
              <Lock size={20} />
            </div>
            <h1
              className="text-xl font-bold text-slate-900 tracking-tight"
              style={{ fontFamily: "'Sora', 'DM Sans', system-ui, sans-serif" }}
            >
              Verify your identity
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Two-factor authentication required
            </p>
          </div>

          {/* Mode toggle */}
          <div className="px-6 pt-5">
            <div
              className="flex rounded-xl p-1 gap-1"
              style={{ background: "#f1f5f9" }}
            >
              {[
                { id: "totp", label: "Authenticator app" },
                { id: "backup", label: "Backup code" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setMode(t.id)}
                  className="flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200"
                  style={{
                    background: mode === t.id ? "#fff" : "transparent",
                    color: mode === t.id ? "#0f172a" : "#94a3b8",
                    boxShadow:
                      mode === t.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="px-6 pb-8 pt-6">
            {mode === "totp" ? <TOTPForm /> : <BackupCodeForm />}
          </div>
        </div>

        {/* Help text */}
        <p className="text-center text-xs text-slate-400">
          Lost access to your authenticator?{" "}
          <Link
            href="/support"
            className="text-slate-600 font-medium hover:underline underline-offset-2"
          >
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
