import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import BaseApi from "@/lib/api/_base.api";
import persistentStore from "@/lib/store/persistentStore";
import PreferencesWizard from "../PreferencesWizard";

const hasPreferences = (prefs) =>
  Boolean(
    prefs?.occupation ||
      prefs?.occupation_custom ||
      (prefs?.topic_ids || []).length > 0,
  );

function initials(profile) {
  const first = profile?.firstName || profile?.firstname || "";
  const last = profile?.lastName || profile?.lastname || "";
  return `${first[0] || ""}${last[0] || ""}`.toUpperCase() || "U";
}

export default function HomeWelcomeBanner({ profile }) {
  const [preferences, setPreferences] = useState(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const token = persistentStore((state) => state.token);

  const isInstructor = (profile?.roles || []).includes("EDUCATOR");
  const firstName = profile?.firstName || profile?.firstname || profile?.username;
  const fullName =
    `${profile?.firstName || profile?.firstname || ""} ${profile?.lastName || profile?.lastname || ""}`.trim() ||
    profile?.username;
  const occupationLabel =
    preferences?.occupation?.name || preferences?.occupation_custom || "";

  useEffect(() => {
    if (!token) return;
    BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/users/me/preferences`)
      .then((response) => setPreferences(response?.data?.data || null))
      .catch(() => setPreferences(null))
      .finally(() => setPrefsLoaded(true));
  }, [token]);

  const handleSaved = useCallback((saved) => setPreferences(saved), []);
  // Learners and instructors must complete their preferences before continuing
  const mustComplete =
    prefsLoaded &&
    Boolean(preferences) &&
    !hasPreferences(preferences) &&
    (profile?.roles || []).some((r) => r === "LEARNER" || r === "EDUCATOR");

  const actions = isInstructor
    ? [
        { href: "/instructor/courses/create", label: "Create a course", primary: true },
        { href: "/instructor", label: "Instructor dashboard" },
      ]
    : [
        { href: "/my-courses/learning", label: "Continue learning", primary: true },
        { href: "/courses", label: "Browse courses" },
      ];

  return (
    <>
    <section className="container pt-8">
      <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-5">
          {profile?.user_picture?.path ? (
            <Image
              src={profile.user_picture.path}
              alt={fullName}
              width={72}
              height={72}
              className="h-[72px] w-[72px] shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-slate-900 text-xl font-bold text-white">
              {initials(profile)}
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
              {occupationLabel && <span>{occupationLabel}</span>}
              <button
                type="button"
                onClick={() => setWizardOpen(true)}
                className="font-bold text-primary underline underline-offset-4 hover:brightness-90"
              >
                {occupationLabel
                  ? "Edit occupation and interests"
                  : "Add your occupation and interests"}
              </button>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={
                action.primary
                  ? "rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:brightness-110"
                  : "rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              }
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </section>

      <PreferencesWizard
        open={wizardOpen || mustComplete}
        required={mustComplete}
        role={isInstructor ? "instructor" : "learner"}
        onClose={() => setWizardOpen(false)}
        onSaved={handleSaved}
      />
    </>
  );
}
