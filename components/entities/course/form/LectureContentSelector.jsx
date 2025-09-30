"use client";
import { useState } from "react";
import { Film, FileText, Presentation, Layout } from "lucide-react";

import VideoForm from "./lecture-types/VideoForm";
import VideoSlideForm from "./lecture-types/VideoSlideForm";
import ArticleForm from "./lecture-types/ArticleForm";
import PresentationForm from "./lecture-types/PresentationForm";

export default function LectureContentSelector({ lectureTitle, onClose }) {
  const [title, setTitle] = useState(lectureTitle || "");
  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription] = useState("");

  const types = [
    { key: "video", label: "Video", icon: Film },
    { key: "article", label: "Article", icon: FileText },
  ];

  function handleSave(data) {
    console.log("Saved Lecture:", {
      title,
      type: selectedType,
      description,
      ...data, // contains file or content from child
    });
    onClose?.();
  }

  return (
    <div className="border p-4 rounded bg-white shadow space-y-4">
      {/* Lecture Type Selection */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          Choose Lecture Type
        </p>
        <div className="grid grid-cols-2 gap-4">
          {types.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={`flex flex-col items-center justify-center gap-2 p-4 border rounded-lg transition 
                ${
                  selectedType === key
                    ? "border-purple-600 bg-purple-50 text-purple-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              onClick={() => setSelectedType(key)}
            >
              <Icon size={24} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Render Type-specific Component */}
      <div className="mt-4">
        {selectedType === "video" && (
          <VideoForm onSave={handleSave} onCancel={onClose} />
        )}

        {selectedType === "article" && (
          <ArticleForm onSave={handleSave} onCancel={onClose} />
        )}
      </div>
    </div>
  );
}
