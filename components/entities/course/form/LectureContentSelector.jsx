"use client";
import { useState } from "react";

export default function LectureContentSelector({ lectureTitle, onClose }) {
  const [title, setTitle] = useState(lectureTitle || "");
  const [activeSection, setActiveSection] = useState(null); // "content" | "description" | null
  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription] = useState("");

  const types = [
    { key: "video", label: "Video" },
    { key: "video_slide", label: "Video & Slide\nMashup" },
    { key: "article", label: "Article" },
    { key: "presentation", label: "Presentation" },
  ];

  function handleSave() {
    console.log("Saved:", {
      title,
      type: selectedType,
      description,
    });
    onClose?.();
  }

  return (
    <div className="border p-4 rounded bg-white shadow space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-orange-600 flex items-center gap-2">
          <span>⚠️</span>
          <span>Unpublished lecture:</span>
          <strong>{lectureTitle || "New Lecture"}</strong>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-black">
          ✕
        </button>
      </div>

      {/* Title Input */}
      <div>
        <label className="block text-sm font-medium mb-1">Lecture Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter lecture title"
          className="w-full border rounded p-2 text-sm"
        />
      </div>

      {/* Action Buttons: show only if title is entered */}
      {title.trim() && (
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() =>
              setActiveSection(activeSection === "content" ? null : "content")
            }
            className="px-4 py-1 border rounded text-purple-600 hover:bg-purple-50 text-sm"
          >
            {activeSection === "content" ? "Hide" : "Add"} Content
          </button>
          <button
            type="button"
            onClick={() =>
              setActiveSection(
                activeSection === "description" ? null : "description"
              )
            }
            className="px-4 py-1 border rounded text-purple-600 hover:bg-purple-50 text-sm"
          >
            {activeSection === "description" ? "Hide" : "Add"} Description
          </button>
        </div>
      )}

      {/* Content Types */}
      {activeSection === "content" && (
        <div className="grid grid-cols-2 gap-4 mt-2">
          {types.map((t) => (
            <button
              key={t.key}
              onClick={() => setSelectedType(t.key)}
              className={`border rounded p-4 text-center hover:border-purple-600 transition ${
                selectedType === t.key ? "border-purple-600 bg-purple-50" : ""
              }`}
            >
              <div className="text-2xl mb-2">🎬</div>
              <div className="font-medium whitespace-pre-line">{t.label}</div>
            </button>
          ))}
        </div>
      )}

      {/* Description */}
      {activeSection === "description" && (
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter a description for this lecture..."
          className="mt-2 w-full border rounded p-2 text-sm"
        />
      )}

      {/* Footer */}
      <div className="flex justify-end gap-3 border-t pt-3">
        <button
          onClick={onClose}
          className="px-4 py-1 border rounded text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!title.trim()}
          className={`px-4 py-1 rounded text-white ${
            title.trim()
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Save
        </button>
      </div>
    </div>
  );
}
