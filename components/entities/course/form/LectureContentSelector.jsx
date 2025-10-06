"use client";
import { useState, useEffect } from "react";
import { Film, FileText } from "lucide-react";

import VideoForm from "./lecture-types/VideoForm";
import ArticleForm from "./lecture-types/ArticleForm";
import BaseApi from "@/lib/api/_base.api";

export default function LectureContentSelector({
  lectureTitle,
  onClose,
  lecture,
  onUpdate,
}) {
  const [title, setTitle] = useState(lectureTitle || "");
  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription] = useState("");

  // ✅ preload if lecture already exists
  useEffect(() => {
    if (lecture) {
      setSelectedType(lecture.type || null);
      setTitle(lecture.title || "");
      setDescription(lecture.description || "");
    }
  }, [lecture]);

  const types = [
    { key: "video", label: "Video", icon: Film },
    { key: "article", label: "Article", icon: FileText },
  ];

  function handleSave(data) {
    const payload = {
      ...lecture,
      title,
      type: selectedType,
      description,
      ...data, // file/content from form
    };

    console.log("Saved Lecture:", payload);
    onUpdate?.(payload);
    onClose?.();
  }

  async function handleDelete() {
    const confirm = window.confirm(
      "Are you sure you want to delete this content?"
    );
    if (!confirm) return;
    try {
      let response;
      switch (lecture.curriculum_resource_type) {
        case "video":
          response = await BaseApi.delete(
            `${process.env.NEXT_PUBLIC_API_URL}/course-resources/videos/${lecture.id}`
          );
          break;
        case "article":
          response = await BaseApi.delete(
            `${process.env.NEXT_PUBLIC_API_URL}/course-resources/articles/${lecture.id}`
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
    switch (lecture.curriculum_resource_type) {
      case "video":
        return (
          <div className="space-y-2">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
            {lecture.asset?.path && (
              <video
                src={process.env.NEXT_PUBLIC_API_DOMAIN + lecture.asset.path}
                controls
                className="w-full h-auto rounded"
              />
            )}
          </div>
        );
      case "article":
        return (
          <>
            <ArticleForm
              onSave={handleSave}
              onCancel={onClose}
              lecture={lecture}
            />
          </>
        );
      default:
        return null;
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        {!lecture?.asset ? (
          <>
            {!selectedType ? (
              <>
                <p className="flex items-center font-semibold mb-2">
                  Choose Lecture Type
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {types.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg transition cursor-pointer shadow-box bg-white border ${
                        selectedType === key
                          ? "border-[#0056D2] bg-purple-50 text-[#0056D2]"
                          : "border-gray-300 text-gray-600 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedType(key)}
                    >
                      <Icon size={24} />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div
                className="space-y-4 cursor-pointer text-[18px] text-gray-500"
                onClick={() => setSelectedType(null)}
              >
                ← Back
              </div>
            )}

            {/* Type-specific Form */}
            <div className="mt-4">
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
          <div className="space-y-3">
            {contentRenderer()}
            <button
              className="text-sm text-red-600 underline"
              onClick={handleDelete}
            >
              Delete Content
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
