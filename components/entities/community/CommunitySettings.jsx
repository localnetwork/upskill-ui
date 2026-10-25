import { useState } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import COMMUNITYAPI from "@/lib/api/community/request";
import { errorMessage } from "./CommunityShared";

const PRESETS = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#dc2626",
  "#ea580c",
  "#16a34a",
  "#0891b2",
  "#334155",
];

const ImageUpload = dynamic(() => import("@/components/forms/ImageUpload"), {
  ssr: false,
});

export default function CommunitySettings({ slug, community, onSaved }) {
  const [form, setForm] = useState({
    name: community.name || "",
    description: community.description || "",
    photoUrl: community.photoUrl || "",
    coverUrl: community.coverUrl || "",
    themeColor: community.themeColor || "#2563eb",
  });
  const [saving, setSaving] = useState(false);
  const set = (key) => (value) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await COMMUNITYAPI.update(slug, form);
      toast.success("Community settings saved");
      onSaved(res?.data?.data);
    } catch (e) {
      toast.error(errorMessage(e, "Failed to save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={save}
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-5"
    >
      <div>
        <label className="text-sm font-semibold">Community name</label>
        <input
          value={form.name}
          onChange={(e) => set("name")(e.target.value)}
          maxLength={120}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </div>
      <div>
        <label className="text-sm font-semibold">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description")(e.target.value)}
          maxLength={1000}
          rows={3}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
        />
      </div>
      <ImageUpload
        name="photoUrl"
        label="Community photo"
        description="Upload a square photo that represents your community."
        value={form.photoUrl ? { path: form.photoUrl } : null}
        onChange={(e) => set("photoUrl")(e.target.value)}
        returnPath
      />
      <ImageUpload
        name="coverUrl"
        label="Cover photo"
        description="Upload a wide banner shown at the top of your community."
        value={form.coverUrl ? { path: form.coverUrl } : null}
        onChange={(e) => set("coverUrl")(e.target.value)}
        returnPath
      />
      <div>
        <p className="mb-2 text-sm font-semibold">Theme color</p>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => set("themeColor")(color)}
              aria-label={color}
              className={`h-8 w-8 rounded-full border-2 ${form.themeColor === color ? "border-slate-900" : "border-transparent"}`}
              style={{ background: color }}
            />
          ))}
          <input
            type="color"
            value={form.themeColor}
            onChange={(e) => set("themeColor")(e.target.value)}
            className="h-8 w-10 cursor-pointer"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="font-semibold text-white px-[20px] py-[10px] rounded-[5px] disabled:opacity-50"
        style={{ background: form.themeColor }}
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
