"use client";

import { useState, useEffect } from "react";
import { Film, FileText, ArrowLeft, Trash2 } from "lucide-react";

import VideoForm from "./lecture-types/VideoForm";
import ArticleForm from "./lecture-types/ArticleForm";
import BaseApi from "@/lib/api/_base.api";
import SecureVideo from "@/components/video-players/SecureVideo";

export default function LectureContentSelector({
  lectureTitle,
  onClose,
  lecture,
  onUpdate,
}) {
  const [title, setTitle] = useState(lectureTitle || "");
  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription] = useState("");

  const normalizeLectureType = (value) => {
    const normalized = String(value || "")
      .trim()
      .toLowerCase();

    if (normalized === "video") return "video";
    if (normalized === "article" || normalized === "resource") {
      return "article";
    }

    return null;
  };

  const lockedTypeFromCurriculum = normalizeLectureType(
    lecture?.curriculum_resource_type,
  );

  useEffect(() => {
    if (lecture) {
      setSelectedType(
        normalizeLectureType(lecture.type) || lockedTypeFromCurriculum || null,
      );
      setTitle(lecture.title || "");
      setDescription(lecture.description || "");
    }
  }, [lecture, lockedTypeFromCurriculum]);

  const types = [
    { key: "video", label: "Video", icon: Film },
    { key: "article", label: "Article", icon: FileText },
  ];

  const availableTypes = lockedTypeFromCurriculum
    ? types.filter((type) => type.key === lockedTypeFromCurriculum)
    : types;

  function handleSave(data) {
    const payload = {
      ...lecture,
      title,
      type: selectedType,
      description,
      ...data,
    };

    onUpdate?.(payload);
    onClose?.();
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this content?",
    );

    if (!confirmed) return;

    try {
      let response;

      switch (lecture?.curriculum_resource_type) {
        case "video":
          response = await BaseApi.delete(
            `${process.env.NEXT_PUBLIC_API_URL}/course-resources/videos/${lecture.id}`,
          );
          break;

        case "article":
          response = await BaseApi.delete(
            `${process.env.NEXT_PUBLIC_API_URL}/course-resources/articles/${lecture.id}`,
          );
          break;

        default:
          throw new Error("Unknown lecture type");
      }

      onUpdate?.(response.data.data.curriculum);
      onClose?.();
    } catch (error) {
      console.error("Error deleting lecture:", error);
    }
  }

  function contentRenderer() {
    switch (lecture?.curriculum_resource_type) {
      case "video":
        return (
          <div className="min-w-0 space-y-3">
            <h3 className="break-words text-lg font-semibold sm:text-xl">
              {title}
            </h3>

            {description && (
              <p className="break-words text-sm leading-relaxed text-gray-600 sm:text-base">
                {description}
              </p>
            )}

            <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
              <SecureVideo
                lessonId={lecture.id}
                src={lecture?.asset?.path || lecture?.videoUrl || ""}
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        );

      case "article":
        return (
          <ArticleForm
            onSave={handleSave}
            onCancel={onClose}
            lecture={lecture}
          />
        );

      default:
        return null;
    }
  }

  return (
    <div className="w-full min-w-0 p-3 sm:p-5 lg:p-6">
      <div className="min-w-0 space-y-5 sm:space-y-6">
        {!lecture?.asset ? (
          <>
            {!selectedType ? (
              <section className="space-y-3">
                <h2 className="text-base font-semibold sm:text-lg">
                  Choose Lecture Type
                </h2>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  {availableTypes.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedType(key)}
                      className={`flex min-h-28 w-full flex-col items-center justify-center gap-3 rounded-lg border p-4 text-center shadow-box transition-colors sm:min-h-32 sm:p-6 ${
                        selectedType === key
                          ? "border-[#0056D2] bg-purple-50 text-[#0056D2]"
                          : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon size={26} className="shrink-0 sm:h-7 sm:w-7" />

                      <span className="text-sm font-medium sm:text-base">
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ) : (
              !lockedTypeFromCurriculum && (
                <button
                  type="button"
                  onClick={() => setSelectedType(null)}
                  className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-[#0056D2] sm:text-base"
                >
                  <ArrowLeft size={18} />
                  Back to lecture types
                </button>
              )
            )}

            {/* Type-specific form */}
            <div className="min-w-0">
              {selectedType === "video" && (
                <VideoForm
                  onSave={handleSave}
                  onCancel={onClose}
                  lecture={lecture}
                />
              )}

              {selectedType === "article" && (
                <ArticleForm
                  onSave={handleSave}
                  onCancel={onClose}
                  lecture={lecture}
                />
              )}
            </div>
          </>
        ) : (
          <section className="min-w-0 space-y-5">
            {contentRenderer()}

            <div className="border-t pt-4">
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 sm:w-auto"
              >
                <Trash2 size={16} />
                Delete Content
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
