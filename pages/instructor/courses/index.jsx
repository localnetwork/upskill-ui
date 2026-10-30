import InstructorCoursesList from "@/components/entities/instructor/InstructorCoursesList";
import InstructorCoursesPagination from "@/components/entities/instructor/InstructorCoursesPagination";
import Select from "@/components/forms/Select";
import InstructorLayout from "@/components/partials/InstructorLayout";
import BaseApi from "@/lib/api/_base.api";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import PayoutAccountTour from "@/components/entities/instructor/payout/PayoutAccountTour";

const COURSES_TOUR_STEPS = [
  {
    target: "tour-new-course",
    title: "Create your first course",
    body: "Click New Course to see the ways you can start building a course.",
  },
  {
    target: "tour-create-manual",
    title: "Create manually",
    body: "Start from a blank course: add a title and category, then build the curriculum yourself.",
  },
  {
    target: "tour-create-ai",
    title: "Draft with AI",
    body: "Describe your course in a brief and AI generates a draft with description and outline.",
  },
  {
    target: "tour-create-bulk",
    title: "Bulk draft with AI",
    body: "Generate several draft courses at once, then refine each one.",
  },
];
import { ChevronDown, Search } from "lucide-react";
import persistentStore from "@/lib/store/persistentStore";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

export default function Page() {
  const router = useRouter();
  const profile = persistentStore((state) => state.profile);

  const [levels, setLevels] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const [params, setParams] = useState({
    title: "",
    instructional_level: "",
    page: 1,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [deletingCourseId, setDeletingCourseId] = useState(null);
  const [showTour, setShowTour] = useState(false);
  const tourActiveRef = useRef(false);
  tourActiveRef.current = showTour;

  const handleTourStep = useCallback((index) => {
    setIsMenuOpen(index >= 1);
  }, []);

  const closeTour = () => {
    setShowTour(false);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && !tourActiveRef.current) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const fetchCourseLevels = async () => {
    try {
      const response = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/course-levels`,
      );

      const levelsPayload = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.data)
          ? response.data.data
          : [];

      setLevels(levelsPayload);
    } catch (_error) {
      setLevels([]);
    }
  };

  const fetchAuthoredCourses = async (overrideParams = params) => {
    setIsLoading(true);

    try {
      const meResponse = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users/me`,
      );

      const currentUser = meResponse?.data?.data;
      const roles = Array.isArray(currentUser?.roles) ? currentUser.roles : [];

      if (!roles.includes("EDUCATOR")) {
        toast.error("Your account is not an educator account.");
        router.replace("/register?mode=instructor");
        return;
      }

      persistentStore.setState({
        profile: {
          ...(profile || {}),
          ...(currentUser || {}),
          roles,
          firstname: currentUser?.firstName || currentUser?.firstname || "",
          lastname: currentUser?.lastName || currentUser?.lastname || "",
        },
      });

      const queryParams = {
        title: overrideParams.title,
        page: overrideParams.page,
      };

      if (overrideParams.instructional_level) {
        queryParams.instructional_level = overrideParams.instructional_level;
      }

      const query = new URLSearchParams(queryParams).toString();

      const response = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/authored?${query}`,
      );

      setCourses(response.data.data || []);
      setTotalPages(response.data.pagination?.total_pages || 1);
      if (
        !overrideParams.title &&
        !overrideParams.instructional_level &&
        (response.data.data || []).length === 0
      ) {
        setShowTour(true);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);

      if (error?.status === 401) {
        toast.error("Session expired. Please log in again.");
        router.replace("/login");
      } else if (error?.status === 403) {
        toast.error("Access denied: educator role is required.");
        router.replace("/register?mode=instructor");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseLevels();
    fetchAuthoredCourses();
  }, []);

  useEffect(() => {
    if (params.instructional_level) {
      const updatedParams = { ...params, page: 1 };
      setParams(updatedParams);
      fetchAuthoredCourses(updatedParams);
    }
  }, [params.instructional_level]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const updatedParams = { ...params, page: 1 };
    setParams(updatedParams);
    fetchAuthoredCourses(updatedParams);
  };

  const handlePageChange = (newPage) => {
    const updatedParams = { ...params, page: newPage };
    setParams(updatedParams);
    fetchAuthoredCourses(updatedParams);
  };

  const handleDeleteDraftCourse = async (courseId) => {
    const normalizedCourseId = String(courseId || "").trim();

    if (!normalizedCourseId) return;

    try {
      setDeletingCourseId(normalizedCourseId);

      await BaseApi.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${normalizedCourseId}`,
      );

      toast.success("Draft course deleted.");
      await fetchAuthoredCourses(params);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete draft course.");
      throw error;
    } finally {
      setDeletingCourseId(null);
    }
  };

  return (
    <InstructorLayout>
      {showTour ? (
        <PayoutAccountTour
          steps={COURSES_TOUR_STEPS}
          onStepChange={handleTourStep}
          onClose={closeTour}
        />
      ) : null}
      <main className="mx-auto w-full min-w-0 max-w-[1600px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* PAGE HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold sm:text-3xl lg:text-[40px]">
            Courses
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your courses, track enrollments, and review ratings.
          </p>
        </div>

        {/* SEARCH, FILTERS, AND CREATE COURSE */}
        <div className="mb-6 flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <form
            className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.7fr)_auto] xl:flex-1"
            onSubmit={handleSubmit}
          >
            {/* SEARCH INPUT */}
            <input
              type="text"
              value={params.title}
              onChange={(event) =>
                setParams({ ...params, title: event.target.value })
              }
              className="h-12 w-full min-w-0 rounded-lg border border-gray-300 px-4 text-sm outline-none transition focus:border-[#0056D2] focus:ring-2 focus:ring-blue-100"
              placeholder="Search courses..."
              aria-label="Search courses"
            />

            {/* LEVEL FILTER */}
            <Select
              value={params.instructional_level}
              onChange={(event) =>
                setParams({
                  ...params,
                  instructional_level: event.target.value,
                })
              }
              className="h-12 w-full min-w-0 rounded-lg border border-gray-300 px-3 text-sm"
              aria-label="Filter by instructional level"
            >
              <option value="">All levels</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.title}
                </option>
              ))}
            </Select>

            {/* SEARCH BUTTON */}
            <button
              type="submit"
              aria-label="Search"
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0056D2] px-5 font-semibold text-white shadow-sm transition hover:opacity-90 sm:w-auto"
            >
              <Search size={20} />
              <span className="sm:hidden">Search courses</span>
            </button>
          </form>

          {/* NEW COURSE DROPDOWN */}
          <div
            className="relative w-full shrink-0 sm:w-auto xl:min-w-[180px]"
            ref={menuRef}
          >
            <button
              id="tour-new-course"
              type="button"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0056D2] px-5 font-semibold text-white shadow-sm transition hover:opacity-90 sm:min-w-[180px]"
            >
              New Course
              <ChevronDown
                size={18}
                className={`transition-transform ${
                  isMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-full min-w-0 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg sm:w-72"
              >
                <Link
                  id="tour-create-manual"
                  role="menuitem"
                  href="/instructor/courses/create"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-3 transition hover:bg-gray-50"
                >
                  <span className="block text-sm font-semibold">
                    Create manually
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                    Start from a blank course
                  </span>
                </Link>

                <Link
                  id="tour-create-ai"
                  role="menuitem"
                  href="/instructor/courses/ai-draft"
                  onClick={() => setIsMenuOpen(false)}
                  className="block border-t border-[#ddd] px-4 py-3 transition hover:bg-gray-50"
                >
                  <span className="block text-sm font-semibold">
                    ✨ Draft with AI
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                    Generate one course from a brief
                  </span>
                </Link>

                <Link
                  id="tour-create-bulk"
                  role="menuitem"
                  href="/instructor/courses/bulk-ai-draft"
                  onClick={() => setIsMenuOpen(false)}
                  className="block border-t border-[#ddd] px-4 py-3 transition hover:bg-gray-50"
                >
                  <span className="block text-sm font-semibold">
                    ✨ Bulk draft with AI
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                    Generate several draft courses at once
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* COURSE LIST */}
        <div className="min-w-0">
          <InstructorCoursesList
            courses={courses}
            isLoading={isLoading}
            onDeleteDraftCourse={handleDeleteDraftCourse}
            deletingCourseId={deletingCourseId}
          />
        </div>

        {/* PAGINATION */}
        <div className="mt-6 min-w-0 overflow-x-auto">
          <InstructorCoursesPagination
            totalPages={totalPages}
            handlePageChange={handlePageChange}
            params={params}
          />
        </div>
      </main>
    </InstructorLayout>
  );
}
