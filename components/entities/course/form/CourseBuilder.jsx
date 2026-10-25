"use client";
import { useEffect, useState, useRef, useCallback } from "react";
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

export default function CourseBuilder({ courseId, liveTick = 0 }) {
  const [sections, setSections] = useState([]);
  const [topics, setTopics] = useState([]);
  const [isSectionsLoading, setIsSectionsLoading] = useState(false);
  const courseManagement = courseStore((state) => state.courseManagement);
  const activeCourseId = courseId || courseManagement?.id;

  const nextIdCounter = useRef(1);
  const latestFetchId = useRef(0);

  const mapSectionsForCourseStore = useCallback(
    (inputSections = []) =>
      (Array.isArray(inputSections) ? inputSections : [])
        .filter((section) => Boolean(section?.id))
        .map((section) => ({
          id: section.id,
          uuid: section.id,
          title: section.title || "",
          curriculums: Array.isArray(section.items) ? section.items : [],
        })),
    [],
  );

  const getSections = useCallback(async () => {
    if (!activeCourseId) {
      setSections([]);
      setTopics([]);
      setIsSectionsLoading(false);
      return;
    }

    const fetchId = ++latestFetchId.current;
    try {
      setIsSectionsLoading(true);
      const [sectionsResponse, topicsResponse] = await Promise.all([
        BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/course-sections/course/${activeCourseId}`,
        ),
        BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/course-sections/course/${activeCourseId}/topics`,
        ),
      ]);

      if (latestFetchId.current !== fetchId) return;

      const data = sectionsResponse.data.data || [];
      const storeCourse = courseStore.getState().courseManagement;
      const sourceSections = Array.isArray(storeCourse?.sections)
        ? storeCourse.sections
        : [];
      const curriculumBySectionId = new Map();

      for (const section of sourceSections) {
        const sectionId = String(section?.id || section?.uuid || "").trim();
        if (!sectionId) continue;
        const curriculums = Array.isArray(section?.curriculums)
          ? section.curriculums
          : Array.isArray(section?.items)
            ? section.items
            : [];
        curriculumBySectionId.set(sectionId, curriculums);
      }

      setTopics(topicsResponse?.data?.data || []);
      setSections(
        data?.map((s) => ({
          ...s,
          items:
            curriculumBySectionId.get(String(s?.id || "").trim()) || [],
          itemsLoaded: curriculumBySectionId.has(String(s?.id || "").trim()),
          tempKey: uuid(),
          isNew: false,
        })),
      );

      const maxId = Math.max(
        0,
        ...data?.map((s) => parseInt(s.id, 10)).filter((n) => !isNaN(n)),
      );
      nextIdCounter.current = maxId + 1;
    } catch (error) {
      if (latestFetchId.current !== fetchId) return;
      console.error("Error fetching sections:", error);
    } finally {
      if (latestFetchId.current !== fetchId) return;
      setIsSectionsLoading(false);
    }
  }, [activeCourseId]);

  useEffect(() => {
    if (activeCourseId) {
      setSections([]);
      setTopics([]);
      getSections();
    } else {
      setSections([]);
      setTopics([]);
      setIsSectionsLoading(false);
    }
  }, [activeCourseId, getSections]);

  useEffect(() => {
    if (isSectionsLoading) return;
    if (!activeCourseId) return;

    const storeCourse = courseStore.getState().courseManagement;
    const storeCourseId = String(storeCourse?.id || storeCourse?.uuid || "").trim();
    const currentCourseId = String(activeCourseId || "").trim();
    if (!storeCourse || !storeCourseId || storeCourseId !== currentCourseId) return;

    const nextSections = mapSectionsForCourseStore(sections);
    courseStore.setState({
      courseManagement: {
        ...storeCourse,
        sections: nextSections,
      },
    });
  }, [sections, isSectionsLoading, activeCourseId, mapSectionsForCourseStore]);

  // Silent refresh used while an AI draft is still filling in the curriculum.
  useEffect(() => {
    if (!liveTick || !activeCourseId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const sectionsResponse = await BaseApi.get(
          `${process.env.NEXT_PUBLIC_API_URL}/course-sections/course/${activeCourseId}`,
        );
        const data = sectionsResponse?.data?.data || [];
        const withItems = await Promise.all(
          data.map(async (section) => {
            try {
              const response = await BaseApi.get(
                `${process.env.NEXT_PUBLIC_API_URL}/course-sections/${section.id}/curriculums`,
              );
              return { section, items: response?.data?.data || response?.data || [] };
            } catch (_error) {
              return { section, items: null };
            }
          }),
        );
        if (cancelled) return;
        setSections((prev) =>
          withItems.map(({ section, items }) => {
            const existing = prev.find((item) => item.id === section.id);
            return {
              ...section,
              items: items ?? existing?.items ?? [],
              itemsLoaded: items !== null || Boolean(existing?.itemsLoaded),
              tempKey: existing?.tempKey || uuid(),
              isNew: false,
            };
          }),
        );
      } catch (error) {
        console.error("Error refreshing live curriculum:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [liveTick, activeCourseId]);

  useEffect(() => {
    const handleAICourseUpdated = (event) => {
      const detailCourseId = String(event?.detail?.courseId || "").trim();
      if (!detailCourseId) return;
      if (String(activeCourseId || "") !== detailCourseId) return;
      getSections();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("course-ai-updated", handleAICourseUpdated);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("course-ai-updated", handleAICourseUpdated);
      }
    };
  }, [activeCourseId, getSections]);

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
          : sec,
      ),
    );
  };

  const deleteSection = (sectionId) => {
    setSections((prev) => prev.filter((sec) => sec.tempKey !== sectionId));
  };

  const addItemToSection = (sectionId, item) => {
    setSections((prev) =>
      prev.map((sec) =>
        sec.tempKey === sectionId
          ? { ...sec, items: [...(sec.items || []), item], itemsLoaded: true }
          : sec,
      ),
    );
  };

  const hydrateSectionItems = (sectionTempKey, nextItems) => {
    setSections((prev) =>
      prev.map((sec) =>
        sec.tempKey === sectionTempKey
          ? {
              ...sec,
              items: Array.isArray(nextItems) ? nextItems : [],
              itemsLoaded: true,
            }
          : sec,
      ),
    );
  };

  return (
    <div className="space-y-6">
      {isSectionsLoading &&
        [1, 2, 3].map((index) => (
          <CourseSectionSkeleton key={`section-skeleton-${index}`} />
        ))}

      {!isSectionsLoading &&
        sections.map((s) => (
          <CourseSection
            key={s.tempKey}
            section={s}
            topics={topics}
            onAddItem={(item) => addItemToSection(s.tempKey, item)}
            onUpdate={(updated) => updateSection(s.tempKey, updated)}
            onDelete={() => deleteSection(s.tempKey)}
            onItemsHydrated={(items) => hydrateSectionItems(s.tempKey, items)}
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
