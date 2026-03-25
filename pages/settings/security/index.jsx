"use client";
import { useState, useEffect } from "react";
import AUTHAPI from "@/lib/api/auth/request";

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ enabled }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${
        enabled
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-zinc-100 text-zinc-500 border border-zinc-200"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          enabled ? "bg-emerald-500" : "bg-zinc-400"
        }`}
      />
      {enabled ? "Enabled" : "Disabled"}
    </span>
  );
}

function SetupStep({ onConfirmed, onCancel }) {
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    setLoading(true);
    AUTHAPI.setup2FA()
      .then((res) => {
        if (res.data?.qr_code) {
          setQrCode(res.data.qr_code);
          setSecret(res.data.secret);
        } else {
          setError(res.data?.error || "Failed to initialize 2FA setup.");
        }
      })
      .catch((err) => {
        setError(err?.data?.error || "Failed to initialize 2FA setup.");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleConfirm = async () => {
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setConfirming(true);
    setError("");
    try {
      const res = await AUTHAPI.confirm2FA(code);
      onConfirmed(res.data.backup_codes);
    } catch (err) {
      setError(
        err?.data?.error || err?.data?.message || "Invalid code. Try again.",
      );
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-zinc-900">
          Set up authenticator app
        </h3>
        <p className="text-sm text-zinc-500 mt-1">
          Scan the QR code with Google Authenticator, then enter the 6-digit
          code to confirm.
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
        </div>
      )}

      {qrCode && !loading && (
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="shrink-0 p-3 border border-zinc-200 rounded-xl bg-white shadow-sm">
            <img
              src={`data:image/svg+xml;base64,${qrCode}`}
              alt="2FA QR Code"
              className="w-40 h-40"
            />
          </div>

          <div className="flex-1 space-y-4">
            <ol className="space-y-2 text-sm text-zinc-600">
              <li className="flex gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-zinc-900 text-white text-xs flex items-center justify-center font-bold">
                  1
                </span>
                Open <strong>Google Authenticator</strong> on your phone.
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-zinc-900 text-white text-xs flex items-center justify-center font-bold">
                  2
                </span>
                Tap <strong>+</strong> and choose <strong>Scan QR code</strong>.
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 w-5 h-5 rounded-full bg-zinc-900 text-white text-xs flex items-center justify-center font-bold">
                  3
                </span>
                Enter the 6-digit code shown in the app below.
              </li>
            </ol>

            <div>
              <button
                onClick={() => setShowSecret((s) => !s)}
                className="text-xs text-zinc-400 hover:text-zinc-600 underline underline-offset-2 transition-colors"
              >
                {showSecret ? "Hide" : "Can't scan? Enter manually"}
              </button>
              {showSecret && (
                <div className="mt-2 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg font-mono text-sm text-zinc-700 tracking-widest break-all select-all">
                  {secret}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {qrCode && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-zinc-700">
            Verification code
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-full max-w-xs px-4 py-2.5 border border-zinc-300 rounded-lg font-mono text-lg tracking-[0.4em] text-center focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleConfirm}
          disabled={confirming || !qrCode || code.length !== 6}
          className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {confirming ? "Verifying…" : "Confirm & Enable"}
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2.5 border border-zinc-300 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function BackupCodesStep({ codes, onDone }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="flex gap-3">
          <span className="text-amber-500 text-lg">⚠️</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Save your backup codes now
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              These codes are shown <strong>only once</strong>. Store them
              somewhere safe.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {codes.map((code, i) => (
          <div
            key={i}
            className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg font-mono text-sm text-zinc-800 text-center tracking-widest select-all"
          >
            {code}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          className="px-4 py-2 border border-zinc-300 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50 transition-colors"
        >
          {copied ? "✓ Copied" : "Copy all codes"}
        </button>
        <button
          onClick={onDone}
          className="px-5 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 transition-colors"
        >
          I've saved these — Done
        </button>
      </div>
    </div>
  );
}

function DisableStep({ onDisabled, onCancel }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDisable = async () => {
    if (code.length !== 6) {
      setError("Enter your current 6-digit authenticator code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await AUTHAPI.disable2FA(code);
      onDisabled();
    } catch (err) {
      setError(err?.data?.error || err?.data?.message || "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
        <p className="text-sm text-red-700">
          Disabling 2FA will remove the extra layer of protection from your
          account. Enter your current authenticator code to confirm.
        </p>
      </div>

      <div className="space-y-2">
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
          className="w-full max-w-xs px-4 py-2.5 border border-zinc-300 rounded-lg font-mono text-lg tracking-[0.4em] text-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleDisable}
          disabled={loading || code.length !== 6}
          className="px-5 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Disabling…" : "Disable 2FA"}
        </button>
        <button
          onClick={onCancel}
          className="px-5 py-2.5 border border-zinc-300 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/** ✅ NEW: Regenerate Backup Codes Step */
function RegenerateStep({ onRegenerated, onCancel }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegenerate = async () => {
    if (code.length !== 6) {
      setError("Enter your current 6-digit authenticator code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await AUTHAPI.regenerateBackupCodes(code);
      onRegenerated(res.data?.backup_codes || []);
    } catch (err) {
      setError(err?.data?.error || err?.data?.message || "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-sm text-amber-800">
          Regenerating will{" "}
          <strong>invalidate all existing backup codes</strong>. Enter your
          authenticator code to continue.
        </p>
      </div>

      <div className="space-y-2">
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
          className="w-full max-w-xs px-4 py-2.5 border border-zinc-300 rounded-lg font-mono text-lg tracking-[0.4em] text-center focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleRegenerate}
          disabled={loading || code.length !== 6}
          className="px-5 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Regenerating…" : "Regenerate codes"}
        </button>

        <button
          onClick={onCancel}
          className="px-5 py-2.5 border border-zinc-300 text-zinc-700 text-sm font-medium rounded-lg hover:bg-zinc-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SecuritySettings() {
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [view, setView] = useState("idle"); // idle | setup | backup-codes | disabling | regenerating
  const [backupCodes, setBackupCodes] = useState([]);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = () => {
    setLoadingStatus(true);
    AUTHAPI.get2FAStatus()
      .then((res) => setStatus(res.data))
      .catch(() => setStatus(null))
      .finally(() => setLoadingStatus(false));
  };

  const handleConfirmed = (codes) => {
    setBackupCodes(codes);
    setView("backup-codes");
    fetchStatus();
  };

  const handleRegenerated = (codes) => {
    setBackupCodes(codes);
    setView("backup-codes");
    fetchStatus();
  };

  const handleDone = () => {
    setView("idle");
    fetchStatus();
  };

  const handleDisabled = () => {
    setView("idle");
    fetchStatus();
  };

  return (
    <div className="container py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-1">Security Settings</h1>
      <p className="text-zinc-500 mb-10">
        Manage your account security, including two-factor authentication.
      </p>

      <div className="border border-zinc-200 rounded-2xl overflow-hidden">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-zinc-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 9.75a4.5 4.5 0 10-9 0v.75a4.5 4.5 0 009 0v-.75z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 10.5a9 9 0 1118 0v.75A9.75 9.75 0 013 11.25v-.75z"
                />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-900">
                  Two-Factor Authentication
                </h2>
                {!loadingStatus && status && (
                  <StatusBadge enabled={status.totp_enabled} />
                )}
              </div>

              <p className="text-sm text-zinc-500 mt-0.5">
                Add an extra layer of security using Google Authenticator.
              </p>

              {!loadingStatus && status?.totp_enabled && (
                <p className="text-xs text-zinc-400 mt-1">
                  {status.backup_codes_remaining} backup code
                  {status.backup_codes_remaining !== 1 ? "s" : ""} remaining
                </p>
              )}
            </div>
          </div>

          {view === "idle" && !loadingStatus && status && (
            <div className="shrink-0">
              {status.totp_enabled ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setView("regenerating")}
                    className="px-4 py-2 text-sm font-medium text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors"
                  >
                    Regenerate
                  </button>
                  <button
                    onClick={() => setView("disabling")}
                    className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Disable
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setView("setup")}
                  className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-700 transition-colors"
                >
                  Enable
                </button>
              )}
            </div>
          )}
        </div>

        {/* Card Body */}
        {view !== "idle" && (
          <div className="p-6">
            {view === "setup" && (
              <SetupStep
                onConfirmed={handleConfirmed}
                onCancel={() => setView("idle")}
              />
            )}

            {view === "backup-codes" && (
              <BackupCodesStep codes={backupCodes} onDone={handleDone} />
            )}

            {view === "disabling" && (
              <DisableStep
                onDisabled={handleDisabled}
                onCancel={() => setView("idle")}
              />
            )}

            {view === "regenerating" && (
              <RegenerateStep
                onRegenerated={handleRegenerated}
                onCancel={() => setView("idle")}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
