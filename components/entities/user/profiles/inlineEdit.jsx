import BaseApi from "@/lib/api/_base.api";
import persistentStore from "@/lib/store/persistentStore";
import modalState from "@/lib/store/modalState";
import { Camera, Pencil } from "lucide-react";
import dynamic from "next/dynamic";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

const TextEditor = dynamic(() => import("@/components/forms/TextEditor"), {
  ssr: false,
});

const ProfileEditContext = createContext({
  profile: null,
  canEdit: false,
  saveBasic: async () => {},
  saveStorefront: async () => {},
  saveProfilePicture: async () => {},
  saveBanner: async () => {},
});

export function useProfileEdit() {
  return useContext(ProfileEditContext);
}

export function ProfileEditProvider({ initialProfile, children }) {
  const currentProfile = persistentStore((state) => state.profile);
  const [profile, setProfile] = useState(initialProfile);

  useEffect(() => {
    setProfile(initialProfile);
  }, [initialProfile]);

  const canEdit = Boolean(
    currentProfile?.id && profile?.id && currentProfile.id === profile.id,
  );

  const saveBasic = async (patch) => {
    try {
      await BaseApi.put(`${process.env.NEXT_PUBLIC_API_URL}/profile`, patch);
      setProfile((prev) => ({ ...prev, ...patch }));
      persistentStore.setState((state) => ({
        profile: { ...state.profile, ...patch },
      }));
      toast.success("Saved");
    } catch (error) {
      toast.error(error?.data?.message || "Error saving your profile.");
    }
  };

  const saveStorefront = async (patch) => {
    try {
      const next = { ...(profile?.storefront || {}), ...patch };
      const response = await BaseApi.put(
        `${process.env.NEXT_PUBLIC_API_URL}/profile/storefront`,
        next,
      );
      setProfile((prev) => ({
        ...prev,
        storefront: response?.data?.data || next,
      }));
      toast.success("Saved");
    } catch (error) {
      toast.error(error?.data?.message || "Error saving your storefront.");
    }
  };

  const saveProfilePicture = async (file) => {
    try {
      const media = await uploadMedia(file);
      if (!media.id) throw new Error("Upload failed");
      const response = await BaseApi.put(
        `${process.env.NEXT_PUBLIC_API_URL}/profile/user-picture`,
        { profile_picture: media.id },
      );
      const picture = response?.data?.data || media;
      setProfile((prev) => ({ ...prev, profile_picture: picture }));
      persistentStore.setState((state) => ({
        profile: { ...state.profile, profile_picture: picture },
      }));
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error(error?.data?.message || "Error updating profile photo.");
    }
  };

  const saveBanner = async (file) => {
    try {
      const { path } = await uploadMedia(file);
      if (!path) throw new Error("Upload failed");
      await saveStorefront({ banner_url: path });
    } catch (error) {
      toast.error(error?.data?.message || "Error updating cover photo.");
    }
  };

  return (
    <ProfileEditContext.Provider
      value={{
        profile,
        canEdit,
        saveBasic,
        saveStorefront,
        saveProfilePicture,
        saveBanner,
      }}
    >
      {children}
    </ProfileEditContext.Provider>
  );
}

const hoverClass =
  "cursor-text rounded outline-dashed outline-2 outline-offset-2 outline-transparent transition-[outline-color] hover:outline-blue-400";

export function EditableText({
  value,
  onSave,
  canEdit,
  as: Tag = "span",
  className = "",
  placeholder = "Click to add",
  maxLength,
  children,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const cancelled = useRef(false);

  if (!canEdit) return <Tag className={className}>{children ?? value}</Tag>;

  if (editing) {
    const commit = async () => {
      setEditing(false);
      const next = draft.trim();
      if (cancelled.current || !next || next === (value || "")) return;
      await onSave(next);
    };
    return (
      <input
        autoFocus
        value={draft}
        maxLength={maxLength}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            cancelled.current = true;
            e.currentTarget.blur();
          }
        }}
        className={`${className} w-full rounded bg-white px-2 !text-gray-900 outline outline-2 outline-blue-500`}
      />
    );
  }

  return (
    <Tag
      title="Click to edit"
      onClick={() => {
        cancelled.current = false;
        setDraft(value || "");
        setEditing(true);
      }}
      className={`${className} ${hoverClass}`}
    >
      {children ??
        (value || <span className="italic opacity-60">{placeholder}</span>)}
    </Tag>
  );
}

export function EditableRichText({
  value,
  onSave,
  canEdit,
  className = "",
  placeholder = "Click to add",
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [saving, setSaving] = useState(false);

  if (!canEdit) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: value || "" }}
      />
    );
  }

  if (editing) {
    return (
      <div className="text-gray-900">
        <TextEditor
          name="inline-rich-text"
          height={260}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onSave(draft);
              setSaving(false);
              setEditing(false);
            }}
            className="rounded-[5px] bg-[#0056D2] px-4 py-1.5 font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-[5px] border bg-white px-4 py-1.5 font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      title="Click to edit"
      onClick={() => {
        setDraft(value || "");
        setEditing(true);
      }}
      className={`group relative ${hoverClass}`}
    >
      {value ? (
        <div className={className} dangerouslySetInnerHTML={{ __html: value }} />
      ) : (
        <p className={`${className} italic opacity-60`}>{placeholder}</p>
      )}
      <Pencil
        size={16}
        className="absolute right-1 top-1 text-blue-500 opacity-0 group-hover:opacity-100"
      />
    </div>
  );
}

export const MAX_SKILLS = 6;
export const MAX_CTAS = 6;

function asSkills(profile) {
  return (profile?.storefront?.skills || []).map((item) =>
    typeof item === "string" ? { label: item, icon: "" } : item,
  );
}

export function useSkillActions() {
  const { profile, saveStorefront } = useProfileEdit();
  const skills = asSkills(profile);

  const openEditor = (index) => {
    const editing = index !== undefined;
    modalState.setState({
      modalInfo: {
        type: "SKILL_EDITOR",
        size: "sm",
        title: editing ? "Edit skill" : "Add skill",
        data: {
          skill: editing ? skills[index] : null,
          onSave: (skill) =>
            saveStorefront({
              skills: editing
                ? skills.map((s, i) => (i === index ? skill : s))
                : [...skills, skill],
            }),
        },
      },
    });
  };

  return {
    canAdd: skills.length < MAX_SKILLS,
    rename: (index, label) =>
      saveStorefront({
        skills: skills.map((s, i) => (i === index ? { ...s, label } : s)),
      }),
    remove: (index) =>
      saveStorefront({ skills: skills.filter((_, i) => i !== index) }),
    add: () => openEditor(),
    edit: openEditor,
  };
}

export function useCtaActions() {
  const { profile, saveStorefront } = useProfileEdit();
  const ctas = profile?.storefront?.ctas || [];
  return {
    canAdd: ctas.length < MAX_CTAS,
    update: (index, patch) =>
      saveStorefront({
        ctas: ctas.map((c, i) => (i === index ? { ...c, ...patch } : c)),
      }),
    remove: (index) =>
      saveStorefront({ ctas: ctas.filter((_, i) => i !== index) }),
    add: () =>
      saveStorefront({
        ctas: [
          ...ctas,
          { title: "New feature", description: "", image_url: "" },
        ],
      }),
  };
}

export async function uploadMedia(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", file.name);
  const res = await BaseApi.post(
    `${process.env.NEXT_PUBLIC_API_URL}/media`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return { id: res?.data?.id || "", path: res?.data?.path || "" };
}

export async function uploadImagePath(file) {
  return (await uploadMedia(file)).path;
}

export function ImagePickButton({
  label,
  onPick,
  className = "",
  iconSize = 16,
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const onChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setBusy(true);
    try {
      await onPick(file);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={`inline-flex items-center gap-1.5 rounded-md bg-black/60 px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-black/80 disabled:opacity-60 ${className}`}
      >
        <Camera size={iconSize} />
        {busy ? "Uploading..." : label}
      </button>
    </>
  );
}
