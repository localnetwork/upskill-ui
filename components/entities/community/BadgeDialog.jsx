import { useState } from "react";
import { COMMUNITY_BADGES } from "./CommunityShared";

export default function BadgeDialog({ name, current, onCancel, onConfirm }) {
  const [selected, setSelected] = useState(current || null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await onConfirm(selected);
    } finally {
      setBusy(false);
    }
  };

  const options = [{ label: "No badge", description: "Remove the assigned badge.", value: null }].concat(
    COMMUNITY_BADGES.map((b) => ({ ...b, value: b.label })),
  );

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5">
        <h3 className="text-lg font-semibold">Badge for {name}</h3>
        <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto">
          {options.map((opt) => (
            <label
              key={opt.label}
              className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm ${selected === opt.value ? "border-violet-400 bg-violet-50" : "border-slate-200"}`}
            >
              <input
                type="radio"
                name="community-badge"
                className="mt-1"
                checked={selected === opt.value}
                onChange={() => setSelected(opt.value)}
              />
              <span>
                <span className="block font-semibold">{opt.label}</span>
                <span className="block text-xs text-slate-500">{opt.description}</span>
              </span>
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
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: "var(--cm)" }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
