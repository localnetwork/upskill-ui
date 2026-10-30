import { useCallback, useEffect, useLayoutEffect, useState } from "react";

export const PAYOUT_TOUR_STEPS = [
  {
    target: "payout-tour-channel",
    title: "1. Choose your channel",
    body: "Pick where you want to receive payouts: GCash, Maya, or your bank.",
  },
  {
    target: "payout-tour-name",
    title: "2. Account holder name",
    body: "Enter the name registered on that account. It must match exactly.",
  },
  {
    target: "payout-tour-number",
    title: "3. Account or mobile number",
    body: "Enter your mobile number (e-wallets) or bank account number.",
  },
  {
    target: "payout-tour-save",
    title: "4. Save your payout account",
    body: "Click save. Once connected, this item in Approval readiness turns Done.",
  },
];

const PADDING = 6;

export default function PayoutAccountTour({
  onClose,
  onSkip,
  steps = PAYOUT_TOUR_STEPS,
  onStepChange,
}) {
  const STEPS = steps;
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const step = STEPS[index];

  useEffect(() => {
    onStepChange?.(index);
  }, [index, onStepChange]);

  const measure = useCallback(() => {
    const el = document.getElementById(step.target);
    if (!el) return setRect(null);
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step.target]);

  useLayoutEffect(() => {
    const el = document.getElementById(step.target);
    if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    measure();
    const timer = setTimeout(measure, 350);
    return () => clearTimeout(timer);
  }, [step.target, measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  // Targets that render later (e.g. after an API call) are picked up by polling.
  useEffect(() => {
    if (rect) return undefined;
    const timer = setInterval(measure, 300);
    return () => clearInterval(timer);
  }, [rect, measure]);

  if (!rect) return null;

  const isLast = index === STEPS.length - 1;
  const popoverWidth = 288;
  const left = Math.max(
    12,
    Math.min(rect.left, window.innerWidth - popoverWidth - 12),
  );
  const placeBelow = rect.top + rect.height + 180 < window.innerHeight;
  const top = placeBelow
    ? rect.top + rect.height + PADDING + 10
    : Math.max(12, rect.top - PADDING - 170);

  return (
    <div className="pointer-events-none fixed inset-0 z-[1000]" aria-live="polite">
      <div
        className="pointer-events-none absolute rounded-md ring-2 ring-primary transition-all duration-200"
        style={{
          top: rect.top - PADDING,
          left: rect.left - PADDING,
          width: rect.width + PADDING * 2,
          height: rect.height + PADDING * 2,
          boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.55)",
        }}
      />
      <div
        className="pointer-events-auto absolute rounded-lg bg-white p-4 shadow-xl"
        style={{ top, left, width: popoverWidth }}
      >
        <p className="text-sm font-bold text-on-surface">{step.title}</p>
        <p className="mt-1 text-sm text-slate-600">{step.body}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {index + 1} of {STEPS.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSkip || onClose}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => (isLast ? onClose() : setIndex(index + 1))}
              className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-white"
            >
              {isLast ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
