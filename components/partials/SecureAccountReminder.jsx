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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-[50px]">
      <div
        className="fixed inset-0 cursor-pointer backdrop-blur-[0.8rem] [background:color-mix(in_oklch,oklch(93.86%_0.0108_280.47deg)_80%,transparent)]"
        onClick={skip}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="secure-2fa-title"
        className="relative z-10 max-h-[calc(100vh-50px)] w-full max-w-[600px] overflow-y-auto rounded-[20px] bg-white p-[24px] shadow-lg"
      >
        <X
          className="absolute right-[12px] top-[12px] cursor-pointer"
          onClick={skip}
        />
        <div className="flex justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0056D2]/10 text-[#0056D2]">
            <ShieldAlert size={30} />
          </span>
        </div>
        <h2
          id="secure-2fa-title"
          className="mt-4 text-center text-[20px] font-semibold"
        >
          Secure your account with 2FA
        </h2>

        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3 rounded-md border border-[#e2e8f0] p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
              <KeyRound size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold">
                Your account stays safe even if your login is stolen
              </p>
              <p className="text-sm text-slate-600">
                Logging in requires a one-time code from your authenticator app
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-[#e2e8f0] p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-700">
              <Smartphone size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold">
                Protects your courses, earnings and settings
              </p>
              <p className="text-sm text-slate-600">
                Keep your learning, payouts and account details behind a second
                check
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          We recommend setting up an authenticator app.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={skip}
            className="rounded-md border border-[#e2e8f0] px-4 py-2 text-sm font-semibold"
          >
            Skip for now
          </button>
          <button
            type="button"
            autoFocus
            onClick={setup}
            className="rounded-md bg-[#0056D2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d6de0]"
          >
            Set up authenticator app
          </button>
        </div>
      </div>
    </div>
  );
}
