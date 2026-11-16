import ImageUpload from "@/components/forms/ImageUpload";
import ProfileManagementLayout from "@/components/partials/ProfileManagementLayout";
import BaseApi from "@/lib/api/_base.api";
import persistentStore from "@/lib/store/persistentStore";
import { ChevronDown, Plus, Trash2, X } from "lucide-react";
import { canonicalSkillIcon, getSkillIcon, SKILL_ICONS } from "@/lib/skillIcons";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const TextEditor = dynamic(() => import("@/components/forms/TextEditor"), {
  ssr: false,
});

const EMPTY_CTA = {
  title: "",
  description: "",
  image_url: "",
};
const MAX_FEATURED = 4;
const MAX_CTAS = 6;
const MAX_SKILLS = 6;
const inputClass = "border border-[#e3e3e3] rounded-[5px] p-[10px] w-full";

export default function StorefrontSettings() {
  const profile = persistentStore((state) => state.profile);
  const isEducator = (profile?.roles || []).includes("EDUCATOR");
  const [storefront, setStorefront] = useState({
    banner_url: "",
    skills: [],
    ctas: [],
    featured_course_ids: [],
    show_reviews: true,
  });
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [pickerIndex, setPickerIndex] = useState(null);
  const [openCta, setOpenCta] = useState(0);
  const pickerSkill =
    pickerIndex === null ? null : storefront.skills[pickerIndex];

  const chooseIcon = (name) => {
    update({
      skills: storefront.skills.map((item, i) =>
        i === pickerIndex ? { ...item, icon: name } : item,
      ),
    });
    setPickerIndex(null);
  };

  useEffect(() => {
    if (!profile?.id) return;
    BaseApi.get(`${process.env.NEXT_PUBLIC_API_URL}/profile/storefront`)
      .then((res) => res?.data?.data && setStorefront(res.data.data))
      .catch(() => {});
    if (!isEducator) return;
    BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/instructor/courses/${profile.id}`,
    )
      .then((res) => setCourses(res?.data?.data || []))
      .catch(() => {});
  }, [profile?.id, isEducator]);

  const update = (patch) => setStorefront((prev) => ({ ...prev, ...patch }));

  const updateCta = (index, patch) =>
    update({
      ctas: storefront.ctas.map((cta, i) =>
        i === index ? { ...cta, ...patch } : cta,
      ),
    });

  const toggleFeatured = (id) => {
    const selected = storefront.featured_course_ids;
    if (selected.includes(id)) {
      update({ featured_course_ids: selected.filter((item) => item !== id) });
    } else if (selected.length >= MAX_FEATURED) {
      toast.error(`You can feature up to ${MAX_FEATURED} courses.`);
    } else {
      update({ featured_course_ids: [...selected, id] });
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await BaseApi.put(
        `${process.env.NEXT_PUBLIC_API_URL}/profile/storefront`,
        storefront,
      );
      if (response?.data?.data) setStorefront(response.data.data);
      toast.success("Storefront saved successfully");
    } catch (error) {
      toast.error(error?.data?.message || "Error saving storefront.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProfileManagementLayout>
      <form onSubmit={onSubmit} className="space-y-10">
        <section>
          <h2 className="text-xl font-semibold mb-3">Banner</h2>
          <ImageUpload
            onChange={(e) => update({ banner_url: e.target.value })}
            value={storefront.banner_url ? { path: storefront.banner_url } : ""}
            preview={storefront.banner_url || null}
            name="banner_url"
            returnPath
            label="Profile banner"
            description="Shown at the top of your public profile. Recommended 1600x500 pixels (.jpg or .png)."
          />
          {storefront.banner_url && (
            <button
              type="button"
              onClick={() => update({ banner_url: "" })}
              className="mt-2 text-sm text-red-600 underline"
            >
              Remove banner
            </button>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-1">{isEducator ? "Skills I teach" : "Skills"}</h2>
          <p className="text-sm text-gray-600 mb-3">
            Up to {MAX_SKILLS} short labels shown under your banner.
          </p>
          <div className="space-y-3">
            {storefront.skills.map((skill, index) => {
              const SelectedIcon = getSkillIcon(skill.icon);
              const patchSkill = (patch) =>
                update({
                  skills: storefront.skills.map((item, i) =>
                    i === index ? { ...item, ...patch } : item,
                  ),
                });
              return (
                <div
                  key={index}
                  className="border border-[#e3e3e3] rounded-lg p-3"
                >
                  <div className="flex gap-2">
                    <button
                      type="button"
                      title="Choose icon"
                      aria-label="Choose icon"
                      onClick={() => setPickerIndex(index)}
                      className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[5px] border bg-[#F0F6FF] text-[#0056D2] hover:border-[#0056D2]"
                    >
                      {SelectedIcon ? (
                        <SelectedIcon size={20} />
                      ) : (
                        <Plus size={18} />
                      )}
                    </button>
                    <input
                      className={inputClass}
                      value={skill.label}
                      maxLength={40}
                      placeholder="e.g. AI Agents"
                      onChange={(e) => patchSkill({ label: e.target.value })}
                    />
                    <button
                      type="button"
                      aria-label="Remove skill"
                      onClick={() =>
                        update({
                          skills: storefront.skills.filter(
                            (_, i) => i !== index,
                          ),
                        })
                      }
                      className="px-3 border rounded-[5px] text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {storefront.skills.length < MAX_SKILLS && (
            <button
              type="button"
              onClick={() =>
                update({
                  skills: [...storefront.skills, { label: "", icon: "" }],
                })
              }
              className="mt-3 inline-flex items-center gap-1 text-[#0056D2] font-semibold"
            >
              <Plus size={16} /> Add skill
            </button>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-1">Featured Contents</h2>
          <p className="text-sm text-gray-600 mb-3">
            Highlight what you offer, e.g. live sessions or workshops (up to{" "}
            {MAX_CTAS}). Each block needs a title; image and description are
            optional.
          </p>
          <div className="space-y-4">
            {storefront.ctas.map((cta, index) => (
              <div key={index} className="border border-[#e3e3e3] rounded-lg">
                <button
                  type="button"
                  onClick={() => setOpenCta(openCta === index ? null : index)}
                  aria-expanded={openCta === index}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left font-semibold"
                >
                  <span className="truncate">
                    {cta.title || `Untitled block ${index + 1}`}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 transition-transform ${
                      openCta === index ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openCta === index && (
                  <div className="space-y-3 border-t border-[#e3e3e3] p-4">
                    <ImageUpload
                      onChange={(e) =>
                        updateCta(index, { image_url: e.target.value })
                      }
                      value={cta.image_url ? { path: cta.image_url } : ""}
                      preview={cta.image_url || null}
                      name={`cta_image_${index}`}
                      returnPath
                      label="Image"
                      description="Image shown on this block (optional). Recommended 800x450 pixels."
                    />
                    {cta.image_url && (
                      <button
                        type="button"
                        onClick={() => updateCta(index, { image_url: "" })}
                        className="text-sm text-red-600 underline"
                      >
                        Remove image
                      </button>
                    )}
                    <input
                      className={inputClass}
                      value={cta.title}
                      maxLength={100}
                      placeholder="Title"
                      onChange={(e) =>
                        updateCta(index, { title: e.target.value })
                      }
                    />
                    <TextEditor
                      name={`cta_description_${index}`}
                      height={250}
                      value={cta.description || ""}
                      onChange={(e) =>
                        updateCta(index, { description: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setOpenCta(null);
                        update({
                          ctas: storefront.ctas.filter((_, i) => i !== index),
                        });
                      }}
                      className="text-sm text-red-600 underline"
                    >
                      Remove promo
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {storefront.ctas.length < MAX_CTAS && (
            <button
              type="button"
              onClick={() => {
                setOpenCta(storefront.ctas.length);
                update({ ctas: [...storefront.ctas, EMPTY_CTA] });
              }}
              className="mt-3 inline-flex items-center gap-1 text-[#0056D2] font-semibold"
            >
              <Plus size={16} /> Add featured content
            </button>
          )}
        </section>

        {isEducator && (
        <section>
          <h2 className="text-xl font-semibold mb-1">Featured courses</h2>
          <p className="text-sm text-gray-600 mb-3">
            Pick up to {MAX_FEATURED} published courses to highlight (
            {storefront.featured_course_ids.length}/{MAX_FEATURED} selected).
          </p>
          {courses.length ? (
            <div className="space-y-2">
              {courses.map((course) => (
                <label
                  key={course.id}
                  className="flex items-center gap-3 border border-[#e3e3e3] rounded-md p-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={storefront.featured_course_ids.includes(course.id)}
                    onChange={() => toggleFeatured(course.id)}
                  />
                  <span>{course.title}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">
              You have no published courses to feature yet.
            </p>
          )}
        </section>
        )}

        {isEducator && (
        <section>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={storefront.show_reviews}
              onChange={(e) => update({ show_reviews: e.target.checked })}
            />
            <span className="font-semibold">
              Show learner reviews on my profile
            </span>
          </label>
        </section>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-[#0056D2] flex items-center justify-center min-w-[150px] font-semibold text-white px-[30px] py-[10px] rounded-[5px] hover:bg-[#1d6de0] disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </form>

      {pickerSkill && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPickerIndex(null)}
        >
          <div
            role="dialog"
            aria-label="Choose an icon"
            className="w-full max-w-[420px] rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Choose an icon</h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setPickerIndex(null)}
                className="text-gray-500 hover:text-black"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {Object.entries(SKILL_ICONS).map(([name, Icon]) => (
                <button
                  key={name}
                  type="button"
                  title={name}
                  aria-label={`Use ${name} icon`}
                  onClick={() => chooseIcon(name)}
                  className={`flex h-12 w-full items-center justify-center rounded-lg border ${
                    canonicalSkillIcon(pickerSkill.icon) === name
                      ? "border-[#0056D2] bg-[#F0F6FF] text-[#0056D2]"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={22} />
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => chooseIcon("")}
              className="mt-4 text-sm text-red-600 underline"
            >
              No icon
            </button>
          </div>
        </div>
      )}
    </ProfileManagementLayout>
  );
}
