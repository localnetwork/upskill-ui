"use client";
import { useState } from "react";
import CourseSection from "./CourseSection";

export default function CourseBuilder() {
  const [sections, setSections] = useState([
    {
      id: 1,
      title: "Introduction",
      items: [
        { id: 1, type: "quiz", title: "test" },
        { id: 2, type: "lecture", title: "test" },
        { id: 3, type: "lecture", title: "kjlkjlkjl" },
      ],
    },
    {
      id: 2,
      title: "Section 2",
      items: [{ id: 4, type: "lecture", title: "test" }],
    },
  ]);

  const addSection = () => {
    const nextId = sections.length + 1;
    setSections([
      ...sections,
      { id: nextId, title: `New Section ${nextId}`, items: [] },
    ]);
  };

  return (
    <div className="space-y-6">
      {sections.map((s) => (
        <CourseSection
          key={s.id}
          section={s}
          onAddItem={(item) => {
            setSections((prev) =>
              prev.map((sec) =>
                sec.id === s.id ? { ...sec, items: [...sec.items, item] } : sec
              )
            );
          }}
        />
      ))}
      <button
        onClick={addSection}
        className="px-4 py-2 bg-indigo-600 text-white rounded"
      >
        + Add Section
      </button>
    </div>
  );
}
