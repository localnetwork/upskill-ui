"use client";
import { useState } from "react";
import CourseItem from "./CourseItem";

export default function CourseSection({ section, onAddItem }) {
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState(section.items || []);

  const addItem = (type) => {
    const nextId = Date.now();
    const newItem = { id: nextId, type, title: `${type} sample` };

    // update local state
    setItems((prev) => [...prev, newItem]);

    // also notify parent if needed
    onAddItem?.(newItem);
  };

  return (
    <div className="border rounded">
      <div
        className="flex justify-between items-center bg-gray-100 p-3 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <h2 className="font-semibold">
          Section {section.id}: {section.title}
        </h2>
        <span>{open ? "▲" : "▼"}</span>
      </div>

      {open && (
        <div className="p-4 space-y-3">
          {items.map((item) => (
            <CourseItem key={item.id} item={item} />
          ))}

          <div className="border-t pt-3 text-sm text-indigo-600 space-x-3">
            {[
              "Lecture",
              "Quiz",
              "Coding Exercise",
              "Practice Test",
              "Assignment",
              "Role Play",
            ].map((t) => (
              <button
                key={t}
                onClick={() => addItem(t.toLowerCase().replace(/\s+/g, "_"))}
                className="hover:underline"
              >
                + {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
