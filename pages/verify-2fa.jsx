"use client";
import { useState } from "react";
import { useRouter } from "next/router";
import persistentStore from "@/lib/store/persistentStore";
import AUTHAPI from "@/lib/api/auth/request";
import toast from "react-hot-toast";
import Link from "next/link";
import { setCookie } from "nookies";

// ─── Icons ────────────────────────────────────────────────────────────────────

function ShieldIcon() {
  return (
    <svg
      className="w-6 h-6 text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── TOTP tab → POST /verify-2fa ─────────────────────────────────────────────

function TOTPForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return;

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
        toast.error(err?.data?.message || "Invalid code. Please try again.");
      }

      if (next >= MAX_ATTEMPTS) {
        toast.error("Too many failed attempts. Redirecting to login…");
        setTimeout(() => router.push("/login"), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700">
          Authenticator code
        </label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          autoFocus
          disabled={loading}
          className="w-full px-4 py-3 border border-zinc-300 rounded-lg font-mono text-2xl tracking-[0.5em] text-center focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent disabled:opacity-50"
        />
        <p className="text-xs text-zinc-400 text-center">
          {code.length}/6 digits entered
        </p>
      </div>

      {attempts > 0 && (
        <p className="text-sm text-amber-600 font-medium text-center">
          {attempts}/{MAX_ATTEMPTS} failed attempts
        </p>
      )}

      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <Spinner /> Verifying…
          </>
        ) : (
          "Verify Code"
        )}
      </button>
    </form>
  );
}

// ─── Backup code tab → POST /verify-backup-code ───────────────────────────────

function BackupCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 6) return;

    setLoading(true);
    try {
      const preAuthToken = persistentStore.getState().preAuthToken;
      if (!preAuthToken) {
        toast.error("Session expired. Please log in again.");
        router.push("/login");
        return;
      }

      // Dedicated endpoint — does not issue a JWT, only marks the code used.
      const res = await AUTHAPI.redeemBackupCode(preAuthToken, trimmed);

      if (res?.data?.status === "success" && res?.data?.token) {
        persistentStore.setState({
          token: res.data.token,
          profile: res.data.user,
          preAuthToken: null,
        });
        setCookie(null, process.env.NEXT_PUBLIC_TOKEN, res.data.token, {
          path: "/",
        });
        toast.success("Backup code accepted. You are now logged in.");
        router.push("/");
      } else {
        toast.error("Unexpected response. Please try again.");
      }
    } catch (err) {
      setCode("");
      toast.error(err?.data?.message || "Invalid or already used backup code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700">
          Backup code
        </label>
        <input
          type="text"
          placeholder="e.g. A1B2C3D4"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())
          }
          autoFocus
          disabled={loading}
          maxLength={12}
          className="w-full px-4 py-3 border border-zinc-300 rounded-lg font-mono text-xl tracking-widest text-center uppercase focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent disabled:opacity-50"
        />
        <p className="text-xs text-zinc-400 text-center">
          Each backup code can only be used once
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || code.trim().length < 6}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <Spinner /> Verifying…
          </>
        ) : (
          "Use Backup Code"
        )}
      </button>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "totp", label: "Authenticator app" },
  { id: "backup", label: "Backup code" },
];

export default function Verify2FA() {
  const [tab, setTab] = useState("totp");

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 py-12 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 mx-auto">
            <ShieldIcon />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              Two-Factor Authentication
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Verify your identity to continue
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-zinc-100">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === t.id
                    ? "text-zinc-900 border-b-2 border-zinc-900 -mb-px bg-white"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Form area */}
          <div className="p-6">
            {tab === "totp" ? <TOTPForm /> : <BackupCodeForm />}
          </div>
        </div>

        {/* Tip */}
        <div className="px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
          <span className="font-semibold">💡 Tip:</span> Make sure your device
          time is synced. Time drift causes TOTP codes to fail.
        </div>

        {/* Back to login */}
        <p className="text-center text-sm text-zinc-500">
          <Link
            href="/login"
            className="text-zinc-700 font-medium hover:underline underline-offset-2"
          >
            ← Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
