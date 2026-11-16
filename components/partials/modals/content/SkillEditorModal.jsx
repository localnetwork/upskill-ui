import modalState from "@/lib/store/modalState";
import { SKILL_ICONS, canonicalSkillIcon } from "@/lib/skillIcons";
import { useState } from "react";

export default function SkillEditorModal() {
  const data = modalState((state) => state.modalInfo?.data) || {};
  const [label, setLabel] = useState(data.skill?.label || "");
  const [icon, setIcon] = useState(canonicalSkillIcon(data.skill?.icon));
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const close = () => {
    modalState.setState({ modalInfo: null });
    document.body.style.overflow = "auto";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await data.onSave?.({ label: trimmed, icon });
      close();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="skill-label" className="mb-1 block font-medium">
          Skill
        </label>
        <input
          id="skill-label"
          autoFocus
          value={label}
          maxLength={40}
          placeholder="e.g. AI Agents"
          onChange={(e) => setLabel(e.target.value)}
          className="w-full rounded-[5px] border border-[oklch(67.22%_0.0355_279.77deg)] p-[10px]"
        />
      </div>

      <div>
        <div className="mb-2 font-medium">Icon</div>
        <input
          value={search}
          placeholder="Search icons..."
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 w-full rounded-[5px] border border-[oklch(67.22%_0.0355_279.77deg)] p-2 text-sm"
        />
        <div className="grid max-h-[260px] grid-cols-6 gap-2 overflow-y-auto pr-1">
          {Object.entries(SKILL_ICONS)
            .filter(([name]) => name.includes(search.trim().toLowerCase()))
            .map(([name, Icon]) => (
            <button
              key={name}
              type="button"
              title={name}
              aria-label={`Use ${name} icon`}
              onClick={() => setIcon(icon === name ? "" : name)}
              className={`flex h-12 w-full items-center justify-center rounded-lg border ${
                icon === name
                  ? "border-[#0056D2] bg-[#F0F6FF] text-[#0056D2]"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon size={22} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={close}
          className="rounded-md border border-[#e2e8f0] px-4 py-2 text-sm font-semibold"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !label.trim()}
          className="rounded-md bg-[#0056D2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d6de0] disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save skill"}
        </button>
      </div>
    </form>
  );
}
