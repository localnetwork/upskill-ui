"use client";
import { useEffect, useState, useRef } from "react";
import { v4 as uuid } from "uuid"; // <-- for stable keys
import CourseSection from "./CourseSection";
import courseStore from "@/lib/store/courseStore";
import BaseApi from "@/lib/api/_base.api";

export default function CourseBuilder() {
  const [sections, setSections] = useState([]);
  const courseManagement = courseStore((state) => state.courseManagement);

  const nextIdCounter = useRef(1);

  useEffect(() => {
    const getSections = async () => {
      try {
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/course-sections/course/${courseManagement?.id}`
        );
        const data = response.data || [];
        setSections(
          data.map((s) => ({
            ...s,
            tempKey: uuid(), // stable key for existing sections
          }))
        );

        const maxId = Math.max(
          0,
          ...data.map((s) => parseInt(s.id, 10)).filter((n) => !isNaN(n))
        );
        nextIdCounter.current = maxId + 1;
      } catch (error) {
        console.error("Error fetching sections:", error);
      }
    };

    if (courseManagement?.id) getSections();
  }, [courseManagement?.id]);

  const addSection = () => {
    const newId = nextIdCounter.current++;
    setSections((prev) => [
      ...prev,
      {
        tempKey: uuid(), // ✅ stable React key (does not change on re-render)
        id: newId.toString(),
        title: `New Section ${newId}`,
        objective: "",
        items: [],
        isNew: true,
      },
    ]);
  };

  const updateSection = (sectionId, updatedSection) => {
    setSections((prev) =>
      prev.map((sec) =>
        sec.id === sectionId ? { ...sec, ...updatedSection, isNew: false } : sec
      )
    );
  };

  const deleteSection = (sectionId) => {
    setSections((prev) => prev.filter((sec) => sec.id !== sectionId));
  };

  const addItemToSection = (sectionId, item) => {
    setSections((prev) =>
      prev.map((sec) =>
        sec.id === sectionId
          ? { ...sec, items: [...(sec.items || []), item] }
          : sec
      )
    );
  };

  return (
    <div className="space-y-6">
      {sections.map((s) => (
        <CourseSection
          key={s.tempKey} // ✅ use stable key
          section={s}
          onAddItem={(item) => addItemToSection(s.id, item)}
          onUpdate={(updated) => updateSection(s.id, updated)}
          onDelete={() => deleteSection(s.id)}
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
