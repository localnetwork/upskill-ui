import { useState } from "react";

const OPTIONS = [
  { value: 3, label: "3 days" },
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: null, label: "Permanently" },
];

export default function BanDialog({ name, onCancel, onConfirm }) {
  const [days, setDays] = useState(3);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await onConfirm(days);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5">
        <h3 className="text-lg font-semibold">Ban {name}?</h3>
        <p className="mt-1 text-sm text-slate-600">
          They will lose access to the community for the selected period.
        </p>
        <div className="mt-3 space-y-2">
          {OPTIONS.map((opt) => (
            <label
              key={opt.label}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${days === opt.value ? "border-red-400 bg-red-50" : "border-slate-200"}`}
            >
              <input
                type="radio"
                name="ban-duration"
                checked={days === opt.value}
                onChange={() => setDays(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Ban
          </button>
        </div>
      </div>
    </div>
  );
}
