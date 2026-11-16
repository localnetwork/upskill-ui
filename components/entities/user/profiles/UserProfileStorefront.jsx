import Link from "next/link";
import { Plus, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { getSkillIcon, normalizeSkill } from "@/lib/skillIcons";
import {
  EditableRichText,
  EditableText,
  ImagePickButton,
  uploadImagePath,
  useCtaActions,
  useProfileEdit,
  useSkillActions,
} from "./inlineEdit";

export function StorefrontBanner({ storefront }) {
  const { canEdit, saveBanner } = useProfileEdit();
  if (!storefront?.banner_url && !canEdit) return null;
  return (
    <div className="group/cover relative">
      {storefront?.banner_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={storefront.banner_url}
          alt=""
          className="w-full h-[160px] sm:h-[220px] lg:h-[280px] object-cover"
        />
      ) : (
        <div className="h-[120px] w-full bg-gradient-to-br from-[#0b2a8a] via-[#1d4ed8] to-[#3b82f6]" />
      )}
      {canEdit && (
        <div className="absolute right-4 top-4">
          <ImagePickButton label="Change cover" onPick={saveBanner} />
        </div>
      )}
    </div>
  );
}

export function StorefrontSkills({ storefront }) {
  const { canEdit } = useProfileEdit();
  const actions = useSkillActions();
  const skills = (storefront?.skills || []).map(normalizeSkill);
  if (!skills.length && !canEdit) return null;
  return (
    <div className="mb-10">
      <h2 className="font-semibold text-[24px] lg:text-[30px] mb-4">
        Skills I teach
      </h2>
      <div className="flex flex-wrap gap-3">
        {skills.map((skill, index) => {
          const Icon = getSkillIcon(skill.icon);
          return (
            <span
              key={`${skill.label}-${index}`}
              className="group relative inline-flex items-center gap-2 rounded-full border border-blue-100 bg-[#F0F6FF] px-4 py-2 text-[15px] font-medium text-[#0056D2]"
            >
              {canEdit ? (
                <button
                  type="button"
                  title="Change icon"
                  aria-label="Change icon"
                  onClick={() => actions.edit(index)}
                  className="rounded hover:bg-blue-100"
                >
                  {Icon ? <Icon size={16} /> : <Plus size={16} />}
                </button>
              ) : (
                Icon && <Icon size={16} />
              )}
              <EditableText
                canEdit={canEdit}
                value={skill.label}
                maxLength={40}
                onSave={(label) => actions.rename(index, label)}
              />
              {canEdit && (
                <button
                  type="button"
                  aria-label="Remove skill"
                  onClick={() => actions.remove(index)}
                  className="absolute -right-1 -top-1 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              )}
            </span>
          );
        })}
        {canEdit && actions.canAdd && (
          <button
            type="button"
            onClick={actions.add}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#0056D2] px-4 py-2 text-[15px] font-semibold text-[#0056D2]"
          >
            <Plus size={14} /> Add skill
          </button>
        )}
      </div>
    </div>
  );
}

function CtaImageControls({ cta, onChange }) {
  const [uploading, setUploading] = useState(false);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadImagePath(file);
      if (path) await onChange({ image_url: path });
    } catch (error) {
      toast.error(error?.data?.message || "Error uploading the image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="absolute left-3 top-3 z-10 flex gap-2 opacity-0 transition-opacity group-hover/cta:opacity-100">
      <label className="cursor-pointer rounded-md bg-white px-3 py-1.5 text-sm font-semibold shadow">
        {uploading ? "Uploading..." : cta.image_url ? "Change image" : "Add image"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={onFile}
        />
      </label>
      {cta.image_url && (
        <button
          type="button"
          onClick={() => onChange({ image_url: "" })}
          className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-red-600 shadow"
        >
          Remove image
        </button>
      )}
    </div>
  );
}

export function StorefrontCtas({ storefront }) {
  const { canEdit } = useProfileEdit();
  const actions = useCtaActions();
  const ctas = storefront?.ctas || [];
  if (!ctas.length && !canEdit) return null;
  const tints = ["bg-[#e6f6f4]", "bg-[#fdf3e3]", "bg-[#f1ecfb]"];
  return (
    <div className="mb-12 space-y-6">
      {ctas.map((cta, index) => (
        <div
          key={index}
          className={`group/cta relative grid grid-cols-1 overflow-hidden rounded-3xl ${tints[index % tints.length]} ${
            cta.image_url ? "md:grid-cols-2" : ""
          }`}
        >
          {cta.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cta.image_url}
              alt={cta.title}
              className={`h-full w-full object-cover aspect-[16/9] md:aspect-auto ${
                index % 2 ? "md:order-2" : ""
              }`}
            />
          )}
          {canEdit && (
            <>
              <CtaImageControls
                cta={cta}
                onChange={(patch) => actions.update(index, patch)}
              />
              <button
                type="button"
                aria-label="Remove block"
                onClick={() => actions.remove(index)}
                className="absolute right-3 top-3 z-10 rounded-full bg-red-500 p-2 text-white opacity-0 shadow transition-opacity group-hover/cta:opacity-100"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
          <div className="flex flex-col justify-center p-8 lg:p-12">
            <EditableText
              as="h3"
              canEdit={canEdit}
              value={cta.title}
              maxLength={100}
              className="text-[26px] font-bold leading-tight text-[#2a2b3f] lg:text-[34px]"
              onSave={(title) => actions.update(index, { title })}
            />
            {(cta.description || canEdit) && (
              <div className="mt-3">
                <EditableRichText
                  canEdit={canEdit}
                  value={cta.description}
                  placeholder="Click to add a description"
                  onSave={(description) => actions.update(index, { description })}
                  className="break-words text-[16px] text-gray-700 lg:text-[20px] [&_a]:text-[#0056D2] [&_a]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
                />
              </div>
            )}
          </div>
        </div>
      ))}
      {canEdit && actions.canAdd && (
        <button
          type="button"
          onClick={actions.add}
          className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-[#0056D2] py-6 text-[16px] font-semibold text-[#0056D2] hover:bg-[#F0F6FF]"
        >
          <Plus size={18} /> Add feature content
        </button>
      )}
    </div>
  );
}

export function StorefrontReviews({ storefront, reviews }) {
  if (storefront?.show_reviews === false || !reviews?.length) return null;
  return (
    <div className="mt-[50px]">
      <h2 className="font-semibold text-[24px] lg:text-[30px] mb-4">
        What people say
      </h2>
      <div className="flex snap-x gap-4 overflow-x-auto pb-3">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="w-[290px] shrink-0 snap-start rounded-xl border bg-white p-5"
          >
            <div className="flex items-center gap-1 text-amber-500">
              <Star size={16} fill="currentColor" />
              <span className="font-bold text-gray-900">
                {Number(review.rating).toFixed(1)}
              </span>
              <span className="ml-2 text-xs text-gray-500">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-3 line-clamp-6 text-[15px] text-gray-700">
              {review.comment}
            </p>
            <div className="mt-4 text-sm font-semibold text-gray-900">
              {review.reviewer}
            </div>
            {review.course_title && (
              <Link
                href={`/courses/${review.course_slug}`}
                className="text-xs text-gray-500 hover:underline line-clamp-1"
              >
                {review.course_title}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
