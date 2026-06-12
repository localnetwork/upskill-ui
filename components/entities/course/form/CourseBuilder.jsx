"use client";
import { useEffect, useState, useRef } from "react";
import { v4 as uuid } from "uuid";
import CourseSection from "./CourseSection";
import courseStore from "@/lib/store/courseStore";
import BaseApi from "@/lib/api/_base.api";
import { Plus } from "lucide-react";

function CourseSectionSkeleton() {
  return (
    <div className="[border:1px_solid_oklch(67.22%_0.0355_279.77deg)] overflow-hidden animate-pulse">
      <div className="flex justify-between items-center bg-[#F6F7F9] px-[30px] py-[20px]">
        <div className="h-6 w-[55%] bg-gray-200 rounded" />
        <div className="h-5 w-5 bg-gray-200 rounded" />
      </div>
      <div className="px-[30px] py-[20px] space-y-3">
        <div className="h-6 w-[35%] bg-gray-200 rounded" />
        <div className="h-20 w-full bg-gray-200 rounded" />
        <div className="h-11 w-[180px] bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export default function CourseBuilder() {
  const [sections, setSections] = useState([]);
  const [isSectionsLoading, setIsSectionsLoading] = useState(false);
  const courseManagement = courseStore((state) => state.courseManagement);

  const nextIdCounter = useRef(1);

  useEffect(() => {
    const getSections = async () => {
      try {
        setIsSectionsLoading(true);
        const response = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/course-sections/course/${courseManagement?.id}`
        );
        const data = response.data || [];
        setSections(
          data.map((s) => ({
            ...s,
            tempKey: uuid(),
            isNew: false, // fetched = not new
          }))
        );

        const maxId = Math.max(
          0,
          ...data.map((s) => parseInt(s.id, 10)).filter((n) => !isNaN(n))
        );
        nextIdCounter.current = maxId + 1;
      } catch (error) {
        console.error("Error fetching sections:", error);
      } finally {
        setIsSectionsLoading(false);
      }
    };

    if (courseManagement?.id) {
      getSections();
    } else {
      setSections([]);
      setIsSectionsLoading(false);
    }
  }, [courseManagement?.id]);

  const addSection = () => {
    const newId = nextIdCounter.current++;
    setSections((prev) => [
      ...prev,
      {
        tempKey: uuid(),
        id: null, // not yet saved in backend
        title: "",
        objective: "",
        items: [],
        isNew: true, // important → triggers editing mode + auto expand
      },
    ]);
  };

  const updateSection = (sectionId, updatedSection) => {
    setSections((prev) =>
      prev.map((sec) =>
        sec.tempKey === sectionId
          ? { ...sec, ...updatedSection, isNew: false }
          : sec
      )
    );
  };

  const deleteSection = (sectionId) => {
    setSections((prev) => prev.filter((sec) => sec.tempKey !== sectionId));
  };

  const addItemToSection = (sectionId, item) => {
    setSections((prev) =>
      prev.map((sec) =>
        sec.tempKey === sectionId
          ? { ...sec, items: [...(sec.items || []), item] }
          : sec
      )
    );
  };

  return (
    <div className="space-y-6">
      {isSectionsLoading &&
        [1, 2, 3].map((index) => <CourseSectionSkeleton key={`section-skeleton-${index}`} />)}

      {!isSectionsLoading &&
        sections.map((s) => (
          <CourseSection
            key={s.tempKey}
            section={s}
            onAddItem={(item) => addItemToSection(s.tempKey, item)}
            onUpdate={(updated) => updateSection(s.tempKey, updated)}
            onDelete={() => deleteSection(s.tempKey)}
            autoExpand={s.isNew}
          />
        ))}

      <button
        onClick={addSection}
        className="px-4 py-2 cursor-pointer flex items-center justify-center font-bold border-[2px] border-[#0056D2] hover:bg-[#0056D2] hover:text-white text-[#0056D2] rounded"
      >
        <Plus width={20} height={20} className="inline mr-1" /> Add Section
      </button>
    </div>
  );
}
