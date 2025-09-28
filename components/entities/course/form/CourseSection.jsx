"use client";
import { useState, useRef } from "react";
import CourseItem from "./CourseItem";

export default function CourseSection({ section, onAddItem }) {
  const [open, setOpen] = useState(true);
  const [items, setItems] = useState(section.items || []);

  const dragItemIndex = useRef(null);
  const dragOverIndex = useRef(null);

  const addItem = (type) => {
    const nextId = Date.now();
    const newItem = { id: nextId.toString(), type, title: `${type} sample` };
    setItems((prev) => [...prev, newItem]);
    onAddItem?.(newItem);
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDragStart = (index) => {
    dragItemIndex.current = index;
  };

  const handleDragEnter = (index) => {
    dragOverIndex.current = index;
  };

  const handleDragEnd = () => {
    const copyItems = [...items];
    const draggedItem = copyItems.splice(dragItemIndex.current, 1)[0];
    copyItems.splice(dragOverIndex.current, 0, draggedItem);
    dragItemIndex.current = null;
    dragOverIndex.current = null;
    setItems(copyItems);
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
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                className="flex items-center justify-between border rounded p-2 bg-white hover:bg-gray-100"
              >
                <CourseItem item={item} />

                <button
                  onClick={() => removeItem(item.id)}
                  className="px-2 py-1 border rounded text-xs text-red-600 hover:bg-red-100"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

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
