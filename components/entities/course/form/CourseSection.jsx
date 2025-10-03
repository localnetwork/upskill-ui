"use client";
import { useState, useEffect } from "react";
import BaseApi from "@/lib/api/_base.api";
import courseStore from "@/lib/store/courseStore";
import CurriculumItem from "./CurriculumItem";
import { Trash, Loader2, Pencil, Save, Plus } from "lucide-react";
import {
  BookOpen,
  HelpCircle,
  Code,
  FileText,
  ClipboardCheck,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

export default function CourseSection({
  section,
  onAddItem,
  onUpdate,
  onDelete,
  autoExpand = false,
}) {
  const [open, setOpen] = useState(autoExpand);
  const [confirmed, setConfirmed] = useState(
    Boolean(
      section.id && (section.title || section.objective || section.description)
    )
  );

  const [title, setTitle] = useState(section.title || "");
  const [objective, setObjective] = useState(
    section.section_description || section.description || ""
  );
  const [items, setItems] = useState(section.items || []); // curriculums
  const [loadingItems, setLoadingItems] = useState(false);

  const [isEditing, setIsEditing] = useState(!section.id);
  const [editTitle, setEditTitle] = useState(title);
  const [editObjective, setEditObjective] = useState(objective);

  const [showTypeMenu, setShowTypeMenu] = useState(false);

  // NEW state for loading actions
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isReordering, setIsReordering] = useState(false);

  const [dragOverIndex, setDragOverIndex] = useState(null);

  const courseManagement = courseStore((state) => state.courseManagement);

  /** Fetch curriculums when section expands */
  useEffect(() => {
    const fetchItems = async () => {
      if (open && section.id) {
        setLoadingItems(true);
        try {
          const response = await BaseApi.get(
            `${process.env.NEXT_PUBLIC_API_URL}/course-sections/${section.id}/curriculums`
          );
          setItems(response?.data?.data || response?.data || []);
        } catch (error) {
          console.error("Error fetching curriculums:", error);
        } finally {
          setLoadingItems(false);
        }
      }
    };
    fetchItems();
  }, [open, section.id]);

  /** Save section (create or update) */
  const handleSaveSection = async () => {
    if (!(isEditing ? editTitle.trim() : title.trim())) return;
    if (!(isEditing ? editObjective.trim() : objective.trim())) return;

    try {
      setIsSaving(true);
      if (section.id) {
        // UPDATE
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
          ...response.data?.data,
          title: editTitle.trim(),
          objective: editObjective.trim(),
        });
        setTitle(editTitle.trim());
        setObjective(editObjective.trim());
      } else {
        // CREATE
        const response = await BaseApi.post(
          `${process.env.NEXT_PUBLIC_API_URL}/course-sections`,
          {
            title: editTitle.trim(),
            description: editObjective.trim(),
            course_id: courseManagement.id,
          }
        );
        onUpdate?.({
          ...section,
          ...response.data?.data,
          title: editTitle.trim(),
          objective: editObjective.trim(),
        });
        setTitle(editTitle.trim());
        setObjective(editObjective.trim());
      }

      setIsEditing(false);
      setConfirmed(true);
      setOpen(true);
    } catch (error) {
      console.error("Error saving section:", error);
    } finally {
      setIsSaving(false);
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
        setIsDeleting(true);
        if (section.id) {
          await BaseApi.delete(
            `${process.env.NEXT_PUBLIC_API_URL}/course-sections/${section.id}`
          );
        }
        onDelete?.(section.id);
      } catch (error) {
        console.error("Error deleting section:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  /** Add curriculum item locally + notify parent */
  const handleAddCurriculum = (curriculum_type) => {
    const tempId = `temp_${Date.now()}`;
    const newItem = {
      id: tempId,
      tempId,
      curriculum_type,
      title: "",
      curriculum_description: "",
      section_id: section.id,
      isNew: true,
    };
    setItems((prev) => [...prev, newItem]);
    onAddItem?.(section.id, newItem);
  };

  const replaceOrAppend = (list, updated) => {
    let found = false;
    const newList = list.map((i) => {
      const matchesTemp =
        updated?.tempId && i?.tempId && i.tempId === updated.tempId;
      const matchesId = updated?.id && i?.id && i.id === updated.id;
      if (matchesTemp || matchesId) {
        found = true;
        return { ...i, ...updated };
      }
      return i;
    });
    if (!found) newList.push(updated);
    return newList;
  };

  const handleItemSave = (savedItem) => {
    setItems((prev) => replaceOrAppend(prev, savedItem));
  };

  const handleItemUpdate = (updatedItem) => {
    setItems((prev) => replaceOrAppend(prev, updatedItem));
  };

  const handleItemDelete = (deletedId) => {
    setItems((prev) => prev.filter((i) => i.id !== deletedId));
  };

  const itemTypes = [
    { label: "Lecture", value: "lecture", icon: BookOpen },
    { label: "Quiz", value: "quiz", icon: HelpCircle },
    { label: "Coding Exercise", value: "coding_exercise", icon: Code },
    { label: "Practice Test", value: "practice_test", icon: FileText },
    { label: "Assignment", value: "assignment", icon: ClipboardCheck },
    { label: "Role Play", value: "role_play", icon: Users },
  ];

  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index); // highlight drop target
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = Number(e.dataTransfer.getData("text/plain"));
    setDragOverIndex(null);

    if (dragIndex === dropIndex) return;

    const reordered = Array.from(items);
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    setItems(reordered);

    try {
      setIsReordering(true);
      await BaseApi.put(
        `${process.env.NEXT_PUBLIC_API_URL}/course-sections/${section.id}/curriculums/sort`,
        {
          items: reordered.map((i) => i.id),
          section_id: section.id,
        }
      );
      toast.success("Curriculums sorted successfully!");
    } catch (err) {
      console.error("Error sorting:", err);
      toast.error("Failed to reorder. Please try again.");
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <div className="[border:1px_solid_oklch(67.22%_0.0355_279.77deg)] overflow-hidden">
      {/* Header */}
      <div
        className="flex justify-between items-center bg-[#F6F7F9] px-[30px] py-[20px] cursor-pointer"
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
                className="w-1/2 border-[oklch(67.22%_0.0355_279.77deg)] border rounded-[5px] p-[10px] px-3 pr-[50px] py-2  "
                maxLength={64}
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
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
                className="ml-2 py-[3px] px-[5px] hover:bg-gray-200 rounded-sm flex items-center justify-center cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                  setOpen(true);
                }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Pencil size={14} className="inline mb-0.5" />
                )}
              </button>
              {section.id && (
                <button
                  onClick={handleDelete}
                  className="py-[3px] px-[5px] hover:bg-gray-200 rounded-sm flex items-center justify-center cursor-pointer disabled:opacity-50"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 size={14} className="animate-spin inline" />
                  ) : (
                    <Trash size={14} className="inline mb-0.5" />
                  )}
                </button>
              )}
            </>
          )}
        </h2>
        <span>{open ? "▲" : "▼"}</span>
      </div>

      {/* Body */}
      {open && (
        <div className="px-[30px] py-[20px] space-y-3">
          {isEditing ? (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveSection();
              }}
            >
              <div className="relative">
                <label className="block font-semibold mb-1">
                  Learning Objective
                </label>
                <input
                  className="w-full border-[oklch(67.22%_0.0355_279.77deg)] border rounded-[5px] p-[10px] px-3 pr-[50px] py-2 "
                  maxLength={200}
                  placeholder="Enter a Learning Objective"
                  value={editObjective}
                  onChange={(e) => setEditObjective(e.target.value)}
                />
                <span className="text-gray-500 text-xs float-right absolute bottom-[12px] right-2">
                  {editObjective.length}/200
                </span>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  className="text-black rounded px-4 py-2 hover:underline"
                  onClick={handleEditCancel}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 cursor-pointer flex items-center justify-center font-bold border-[2px] border-[#0056D2] hover:bg-[#0056D2] hover:text-white text-[#0056D2] rounded"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} className="inline mr-1" />
                  )}
                  Save Section
                </button>
              </div>
            </form>
          ) : (
            <>
              {section.id && (
                <div className="">
                  {isReordering && (
                    <div className="flex items-center text-sm text-gray-500 gap-2 mb-2">
                      <Loader2 size={14} className="animate-spin" />
                      Reordering...
                    </div>
                  )}
                  {loadingItems ? (
                    <p className="text-sm text-gray-500">Loading...</p>
                  ) : items.length > 0 ? (
                    <div className="space-y-2">
                      {items.map((it, index) => (
                        <div
                          key={it.id || it.tempId}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          className="flex items-center gap-2 rounded bg-white cursor-move"
                        >
                          <CurriculumItem
                            item={it}
                            onSave={handleItemSave}
                            onUpdate={handleItemUpdate}
                            onDelete={handleItemDelete}
                          />
                          <span className="text-gray-400">☰</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <></>
                  )}

                  <div className="pt-3">
                    <button
                      onClick={() => setShowTypeMenu((p) => !p)}
                      className="px-4 py-2 cursor-pointer flex items-center justify-center font-bold border-[2px] border-[#0056D2] hover:bg-[#0056D2] hover:text-white text-[#0056D2] rounded"
                    >
                      <Plus size={16} className="mr-1" /> Add Curriculum
                    </button>
                    {showTypeMenu && (
                      <div className="mt-2 border rounded p-2 bg-gray-50 space-y-1">
                        {itemTypes.map((t) => (
                          <button
                            key={t.value}
                            onClick={() => {
                              handleAddCurriculum(t.value);
                              setShowTypeMenu(false);
                            }}
                            className="flex cursor-pointer items-center gap-2 w-full text-left hover:bg-gray-100 px-2 py-1 rounded"
                          >
                            <t.icon size={16} className="text-gray-600" />
                            {t.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
