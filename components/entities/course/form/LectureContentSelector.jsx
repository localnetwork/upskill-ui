"use client";
import { useState } from "react";
import Video from "./Video";
import VideoSlide from "./VideoSlide";
import Article from "./Article";
import Presentation from "./Presentation";

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
      {activeSection === "content" && (
        <div className="grid grid-cols-2 gap-4 mt-2">
          <Video
            selected={selectedType === "video"}
            onClick={() => setSelectedType("video")}
          />
          <VideoSlide
            selected={selectedType === "video_slide"}
            onClick={() => setSelectedType("video_slide")}
          />
          <Article
            selected={selectedType === "article"}
            onClick={() => setSelectedType("article")}
          />
          <Presentation
            selected={selectedType === "presentation"}
            onClick={() => setSelectedType("presentation")}
          />
        </div>
      )}
    </div>
  );
}
