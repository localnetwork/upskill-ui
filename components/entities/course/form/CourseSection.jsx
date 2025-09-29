"use client";
import { useState, useRef } from "react";
import BaseApi from "@/lib/api/_base.api";
import courseStore from "@/lib/store/courseStore";
import CurriculumItem from "./CurriculumItem";

export default function CourseSection({
  section,
  onAddItem,
  onUpdate,
  onDelete,
}) {
  // ✅ Collapsed if fetched from backend (has an ID), expanded if new
  const [open, setOpen] = useState(!section.id);

  // A section is confirmed if it already has a title & objective/description
  const [confirmed, setConfirmed] = useState(
    Boolean(section.title && (section.objective || section.description))
  );

  const [title, setTitle] = useState(section.title || "");
  const [objective, setObjective] = useState(
    section.objective || section.description || ""
  );
  const [items, setItems] = useState(section.items || []);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  // Editing states
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editObjective, setEditObjective] = useState(objective);

  const courseManagement = courseStore((state) => state.courseManagement);
  const dragItemIndex = useRef(null);
  const dragOverIndex = useRef(null);

  const handleAddSection = async () => {
    if (!title.trim() || !objective.trim()) return;
    setConfirmed(true);
    try {
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/course-sections`,
        {
          title: title.trim(),
          description: objective.trim(),
          course_id: courseManagement.id,
        }
      );
      onAddItem?.({
        ...response?.data?.data,
      });
    } catch (error) {
      console.error("Error adding section:", error);
    }
  };

  const addItem = (type) => {
    const nextId = Date.now();
    const newItem = { id: nextId.toString(), type, title: `${type}` };
    setItems((prev) => [...prev, newItem]);
    onAddItem?.(newItem);
  };

  const removeItem = (id) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const handleDragStart = (index) => (dragItemIndex.current = index);
  const handleDragEnter = (index) => (dragOverIndex.current = index);
  const handleDragEnd = () => {
    if (dragItemIndex.current == null || dragOverIndex.current == null) return;
    const copy = [...items];
    const dragged = copy.splice(dragItemIndex.current, 1)[0];
    copy.splice(dragOverIndex.current, 0, dragged);
    dragItemIndex.current = dragOverIndex.current = null;
    setItems(copy);
  };

  const itemTypes = [
    "Lecture",
    "Quiz",
    "Coding Exercise",
    "Practice Test",
    "Assignment",
    "Role Play",
  ];

  const handleEditSave = async () => {
    try {
      const response = await BaseApi.put(
        `${process.env.NEXT_PUBLIC_API_URL}/course-sections/${section.id}`,
        {
          title: editTitle.trim(),
          description: editObjective.trim(),
          course_id: courseManagement.id,
        }
      );
      onUpdate?.({
        ...section,
        title: editTitle.trim(),
        objective: editObjective.trim(),
      });
      setTitle(response.data.data.title || editTitle);
      setObjective(response.data.data.section_description || editObjective);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating section:", error);
    }
  };

  const handleEditCancel = () => {
    setEditTitle(title);
    setEditObjective(objective);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    const confirmedDelete = window.confirm(
      "Are you sure you want to delete this section? This action cannot be undone."
    );
    if (confirmedDelete) {
      try {
        await BaseApi.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/course-sections/${section.id}`
        );
        onDelete?.(section.id);
      } catch (error) {
        console.error("Error deleting section:", error);
      }
    }
  };

  return (
    <div className="border rounded">
      {/* Header */}
      <div
        className="flex justify-between items-center bg-gray-100 p-3 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <h2
          className="font-semibold flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {isEditing ? (
            <>
              <span>{`Section ${section.id || "New"}:`}</span>
              <input
                className="border border-purple-300 rounded px-2 py-1 outline-none focus:border-purple-600 w-1/2 text-lg font-semibold"
                maxLength={64}
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{ marginLeft: 4, marginRight: 8 }}
              />
              <span className="text-gray-500 text-xs">
                {editTitle.length}/64
              </span>
            </>
          ) : (
            <>
              <span>{`Section ${section.id || "New"}:`}</span>
              <span className="ml-2">{title}</span>
              <button
                type="button"
                className="ml-2 p-1 rounded bg-gray-200 hover:bg-gray-300"
                aria-label="Edit Section"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  setOpen(true);
                }}
              >
                ✎
              </button>
              {section.id && (
                <button
                  onClick={handleDelete}
                  className="ml-3 text-red-600 hover:underline"
                >
                  Delete
                </button>
              )}
            </>
          )}
        </h2>
        <span>{open ? "▲" : "▼"}</span>
      </div>

      {/* Body */}
      {open && (
        <div className="p-4 space-y-3">
          {isEditing ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleEditSave();
              }}
            >
              <div>
                <label className="block font-semibold mb-1">
                  What will students be able to do at the end of this section?
                </label>
                <input
                  className="w-full border border-purple-300 rounded px-3 py-2 focus:border-purple-600"
                  maxLength={200}
                  placeholder="Enter a Learning Objective"
                  value={editObjective}
                  onChange={(e) => setEditObjective(e.target.value)}
                />
                <span className="text-gray-500 text-xs float-right">
                  {editObjective.length}/200
                </span>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  className="text-black rounded px-4 py-2 hover:underline"
                  onClick={handleEditCancel}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 text-white rounded px-4 py-2 hover:bg-purple-700"
                >
                  Save Section
                </button>
              </div>
            </form>
          ) : !confirmed ? (
            <>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Section Title"
                className="w-full border rounded p-2"
              />
              <input
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Learning Objective"
                className="w-full border rounded p-2"
              />
              <button
                onClick={handleAddSection}
                className="px-4 py-2 bg-purple-600 text-white rounded"
              >
                Add Section
              </button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <div>
                  <p className="font-semibold">{section.title}</p>
                  <p className="text-sm text-gray-700">
                    {section.objective || section.description}
                  </p>
                </div>

                {items.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    className="flex justify-between items-center border p-2 bg-white"
                  >
                    <CurriculumItem item={item} />
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 text-sm hover:underline"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-3">
                <button
                  onClick={() => setShowTypeMenu((p) => !p)}
                  className="px-4 py-2 border rounded text-purple-600 hover:bg-purple-50"
                >
                  + Curriculum Item
                </button>
                {showTypeMenu && (
                  <div className="mt-2 border rounded p-2 bg-gray-50 space-y-1">
                    {itemTypes.map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          addItem(t.toLowerCase().replace(/\s+/g, "_"));
                          setShowTypeMenu(false);
                        }}
                        className="block w-full text-left hover:bg-gray-100 px-2 py-1 rounded"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
