"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { KeyRound, ShieldAlert, Smartphone, X } from "lucide-react";
import AUTHAPI from "@/lib/api/auth/request";
import BaseApi from "@/lib/api/_base.api";
import persistentStore from "@/lib/store/persistentStore";

const SKIP_DAYS = 7;
const HIDDEN_ROUTES = [
  "/login",
  "/register",
  "/verify-2fa",
  "/settings/security",
  "/messages/call",
];

const hasPreferences = (prefs) =>
  Boolean(
    prefs?.occupation ||
      prefs?.occupation_custom ||
      (prefs?.topic_ids || []).length > 0,
  );

const skipKey = (userId) => `secure-2fa-skip:${userId}`;

function recentlySkipped(userId) {
  try {
    const at = Number(localStorage.getItem(skipKey(userId)));
    return Boolean(at) && Date.now() - at < SKIP_DAYS * 86400000;
  } catch (_error) {
    return false;
  }
}

export default function SecureAccountReminder() {
  const router = useRouter();
  const token = persistentStore((state) => state.token);
  const profile = persistentStore((state) => state.profile);
  const [open, setOpen] = useState(false);
  const [checkedUser, setCheckedUser] = useState(null);

  const userId = profile?.id;
  const roles = profile?.roles || [];
  const needsPreferences = roles.some(
    (role) => role === "LEARNER" || role === "EDUCATOR",
  );
  const hidden = HIDDEN_ROUTES.some((route) =>
    String(router.pathname || "").startsWith(route),
  );

  useEffect(() => {
    if (!token || !userId || checkedUser === userId) return;
    if (recentlySkipped(userId)) {
      setCheckedUser(userId);
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        const statusRes = await AUTHAPI.get2FAStatus();
        const enabled = Boolean(
          statusRes?.data?.totp_enabled ?? statusRes?.data?.enabled,
        );
        if (enabled) return;
        if (needsPreferences) {
          const prefsRes = await BaseApi.get(
            `${process.env.NEXT_PUBLIC_API_URL}/users/me/preferences`,
          );
          if (!hasPreferences(prefsRes?.data?.data)) return;
        }
        if (!cancelled) setOpen(true);
      } catch (_error) {
        // Reminder is best-effort; never block the app.
      } finally {
        if (!cancelled) setCheckedUser(userId);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [token, userId, needsPreferences, checkedUser]);

  useEffect(() => {
    const recheck = () => setCheckedUser(null);
    window.addEventListener("preferences-saved", recheck);
    return () => window.removeEventListener("preferences-saved", recheck);
  }, []);

  useEffect(() => {
    if (!token) {
      setOpen(false);
      setCheckedUser(null);
    }
  }, [token]);

  if (!open || hidden) return null;

  const skip = () => {
    try {
      localStorage.setItem(skipKey(userId), String(Date.now()));
    } catch (_error) {
      // ignore storage errors
    }
    setOpen(false);
  };

  const setup = () => {
    setOpen(false);
    router.push("/settings/security?tour=2fa");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 cursor-pointer backdrop-blur-[0.8rem]"
        style={{
          background:
            "linear-gradient(145deg, rgba(248,250,252,0.92) 0%, rgba(241,245,249,0.92) 100%)",
        }}
        onClick={skip}
      />
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, #cbd5e1 1px, transparent 0)",
          backgroundSize: "28px 28px",
          opacity: 0.35,
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="secure-2fa-title"
        className="relative z-10 max-h-[calc(100vh-32px)] w-full max-w-md overflow-y-auto rounded-2xl bg-white"
        style={{
          boxShadow:
            "0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 60px -10px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)",
        }}
      >
        <button
          type="button"
          onClick={skip}
          aria-label="Close"
          className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-700"
        >
          <X size={18} />
        </button>
        <div
          className="px-8 pb-6 pt-8 text-center"
          style={{ borderBottom: "1px solid #f1f5f9" }}
        >
          <div
            className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white"
            style={{
              background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
            }}
          >
            <ShieldAlert size={20} />
          </div>
          <h2
            id="secure-2fa-title"
            className="text-xl font-bold tracking-tight text-slate-900"
            style={{ fontFamily: "'Sora', 'DM Sans', system-ui, sans-serif" }}
          >
            Secure your account
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Add two-factor authentication in under a minute
          </p>
        </div>

        <div className="space-y-3 px-6 pb-8 pt-6">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <KeyRound size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Your account stays safe even if your login is stolen
              </p>
              <p className="text-xs text-slate-500">
                Logging in requires a one-time code from your authenticator app
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Smartphone size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Protects your courses, earnings and settings
              </p>
              <p className="text-xs text-slate-500">
                Keep your learning, payouts and account details behind a second
                check
              </p>
            </div>
          </div>

          <button
            type="button"
            autoFocus
            onClick={setup}
            className="!mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90"
            style={{ background: "#0f172a" }}
          >
            Set up authenticator app
          </button>
          <button
            type="button"
            onClick={skip}
            className="w-full text-center text-xs font-medium text-slate-400 transition-colors hover:text-slate-700"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
