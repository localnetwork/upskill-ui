import { useState } from "react";
import { useRouter } from "next/router";
import { Binoculars, Rocket, Shuffle, TrendingUp } from "lucide-react";
import PreferencesWizard from "../PreferencesWizard";
import { savePendingPreferences } from "@/lib/services/pendingPreferences";

const GOALS = [
  { id: "start", label: "Start my career", Icon: Rocket },
  { id: "change", label: "Change my career", Icon: Shuffle },
  { id: "grow", label: "Grow in my current role", Icon: TrendingUp },
  { id: "explore", label: "Explore topics outside of work", Icon: Binoculars },
];

// Anonymous visitors only: pick a goal, answer the steps, then continue to signup.
export default function HomeGoalsBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleComplete = (preferences) => {
    savePendingPreferences(preferences);
    router.push("/register?mode=student");
  };

  return (
    <section className="container pt-6">
      <div className="flex flex-col gap-4 rounded-3xl bg-blue-50 px-6 py-5 lg:flex-row lg:items-center lg:px-8">
        <h2 className="text-xl font-bold text-slate-900 lg:max-w-[260px]">
          What brings you to Upskill today?
        </h2>
        <div className="flex flex-wrap gap-3">
          {GOALS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setOpen(true)}
              className="flex grow items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 pr-5 text-xs font-semibold text-slate-900 transition hover:border-primary hover:shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
                <Icon size={20} />
              </span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <PreferencesWizard
        open={open}
        anonymous
        role="learner"
        onClose={() => setOpen(false)}
        onSaved={handleComplete}
      />
    </section>
  );
}
