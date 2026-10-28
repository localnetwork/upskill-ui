import InstructorLayout from "../../components/partials/InstructorLayout";
import dynamic from "next/dynamic";
import Input from "@/components/forms/Input";
import Select from "@/components/forms/Select";
import Checkbox from "@/components/forms/Checkbox";
import InstructorQaPanel from "@/components/entities/instructor/InstructorQaPanel";
import InstructorMessagesPanel from "@/components/entities/instructor/InstructorMessagesPanel";
import COMMUNICATIONAPI from "@/lib/api/communication/request";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const TextEditor = dynamic(() => import("@/components/forms/TextEditor"), {
  ssr: false,
});

const TABS = [
  { key: "qa", label: "Q&A" },
  { key: "ai", label: "AI assistant insights" },
  { key: "messages", label: "Messages" },
  { key: "assignments", label: "Assignments" },
  { key: "announcements", label: "Announcements" },
];

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

const INITIAL_ANNOUNCEMENT_FORM = {
  courseId: "all",
  excludeCourseId: "",
  useEnrollmentDate: false,
  useCourseProgress: false,
  includeAfter: "",
  includeBefore: "",
  progressZero: true,
  progressOneToFortyNine: true,
  progressFiftyToNinetyNine: true,
  progressCompleted: true,
  subject: "",
  body: "",
};

export default function Page() {
  const [activeTab, setActiveTab] = useState("qa");
  const [courses, setCourses] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState(INITIAL_ANNOUNCEMENT_FORM);
  const [announcementStatus, setAnnouncementStatus] = useState("");
  const [isAnnouncementComposerOpen, setIsAnnouncementComposerOpen] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [isAnnouncementsLoading, setIsAnnouncementsLoading] = useState(false);

  const [aiInsights, setAiInsights] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [assignments, setAssignments] = useState([]);
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);

  const courseOptions = useMemo(
    () => [{ id: "all", title: "All courses" }, ...(courses || [])],
    [courses],
  );

  const setAnnouncementField = (key, value) => {
    setAnnouncementForm((prev) => ({ ...prev, [key]: value }));
  };

  const getCourseTitle = (courseId) => {
    if (!courseId || courseId === "all") return "All courses";
    const matched = courseOptions.find((course) => course.id === courseId);
    return matched?.title || "Selected course";
  };

  const loadCourses = async () => {
    try {
      const response = await COMMUNICATIONAPI.getInstructorCourses();
      setCourses(Array.isArray(response?.data?.data) ? response.data.data : []);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load courses.");
      setCourses([]);
    }
  };

  const loadAnnouncementDraft = async () => {
    try {
      const response = await COMMUNICATIONAPI.getAnnouncementDraft();
      const draft = response?.data?.data?.draft;
      if (!draft) return;
      setAnnouncementForm((prev) => ({
        ...prev,
        ...draft,
        useEnrollmentDate: toBoolean(draft.useEnrollmentDate),
        useCourseProgress: toBoolean(draft.useCourseProgress),
        progressZero: toBoolean(draft.progressZero ?? true),
        progressOneToFortyNine: toBoolean(draft.progressOneToFortyNine ?? true),
        progressFiftyToNinetyNine: toBoolean(draft.progressFiftyToNinetyNine ?? true),
        progressCompleted: toBoolean(draft.progressCompleted ?? true),
      }));
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load announcement draft.");
    }
  };

  const loadAiInsights = async () => {
    setIsAiLoading(true);
    try {
      const response = await COMMUNICATIONAPI.getInstructorAiInsights();
      setAiInsights(response?.data?.data || null);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load AI insights.");
      setAiInsights(null);
    } finally {
      setIsAiLoading(false);
    }
  };

  const loadAssignments = async () => {
    setIsAssignmentsLoading(true);
    try {
      const response = await COMMUNICATIONAPI.getInstructorAssignments();
      setAssignments(Array.isArray(response?.data?.data) ? response.data.data : []);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load assignments.");
      setAssignments([]);
    } finally {
      setIsAssignmentsLoading(false);
    }
  };

  const loadAnnouncements = async () => {
    setIsAnnouncementsLoading(true);
    try {
      const response = await COMMUNICATIONAPI.getAnnouncements({ page: 1, limit: 20 });
      setAnnouncements(Array.isArray(response?.data?.data) ? response.data.data : []);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to load announcements.");
      setAnnouncements([]);
    } finally {
      setIsAnnouncementsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
    loadAnnouncementDraft();
  }, []);

  useEffect(() => {
    if (activeTab === "ai") loadAiInsights();
    if (activeTab === "assignments") loadAssignments();
    if (activeTab === "announcements") loadAnnouncements();
  }, [activeTab]);

  const discardAnnouncement = () => {
    setAnnouncementForm((prev) => ({
      ...prev,
      subject: "",
      body: "",
    }));
    setAnnouncementStatus("Draft discarded.");
  };

  const saveAnnouncementDraft = async () => {
    setIsSavingDraft(true);
    setAnnouncementStatus("");
    try {
      const response = await COMMUNICATIONAPI.saveAnnouncementDraft(announcementForm);
      const updatedAt = response?.data?.data?.updatedAt;
      setAnnouncementStatus(
        `Draft saved${updatedAt ? ` at ${formatDateTime(updatedAt)}` : "."}`,
      );
      toast.success("Announcement draft saved.");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to save announcement draft.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const sendAnnouncement = async () => {
    if (!announcementForm.subject.trim() || !announcementForm.body.replace(/<[^>]*>|&nbsp;/g, "").trim()) {
      toast.error("Subject and body are required.");
      return;
    }
    setIsSendingAnnouncement(true);
    setAnnouncementStatus("");
    try {
      const response = await COMMUNICATIONAPI.sendAnnouncement(announcementForm);
      const recipientsCount = Number(response?.data?.data?.recipientsCount || 0);
      const sentAt = response?.data?.data?.sentAt;
      setAnnouncementStatus(
        `Announcement sent to ${recipientsCount} recipients${sentAt ? ` at ${formatDateTime(sentAt)}` : "."}`,
      );
      toast.success("Announcement sent.");
      setIsAnnouncementComposerOpen(false);
      loadAnnouncements();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to send announcement.");
    } finally {
      setIsSendingAnnouncement(false);
    }
  };

  return (
    <InstructorLayout>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <section className="rounded-lg border border-[#e2e8f0] bg-white p-6">
          <h1 className="text-2xl font-bold text-on-surface">Communication center</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Manage learner conversations, insights, assignments, and announcements.
          </p>
        </section>

        <div className="flex flex-wrap gap-2 border-b border-[#e2e8f0] pb-3">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                activeTab === tab.key
                  ? "bg-primary text-white"
                  : "border border-[#cbd5e1] text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "qa" ? <InstructorQaPanel courses={courses} /> : null}

        {activeTab === "ai" ? (
          <section className="rounded-lg border border-[#e2e8f0] bg-white p-6">
            <h2 className="text-lg font-semibold text-on-surface">AI assistant insights</h2>
            {isAiLoading ? (
              <p className="mt-4 text-sm text-slate-500">Loading insights...</p>
            ) : !aiInsights ? (
              <p className="mt-4 text-sm text-slate-500">No insights available yet.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Total learners</p>
                  <p className="mt-2 text-2xl font-bold text-on-surface">
                    {Number(aiInsights.totalLearners || 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">At-risk learners</p>
                  <p className="mt-2 text-2xl font-bold text-on-surface">
                    {Number(aiInsights.atRiskLearners || 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Low ratings (30 days)
                  </p>
                  <p className="mt-2 text-2xl font-bold text-on-surface">
                    {Number(aiInsights.lowRatingReviewsLast30Days || 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Unanswered questions
                  </p>
                  <p className="mt-2 text-2xl font-bold text-on-surface">
                    {Number(aiInsights.unansweredQuestions || 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 md:col-span-2 xl:col-span-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Top concern</p>
                  <p className="mt-2 text-sm font-semibold text-on-surface">
                    {aiInsights.topConcern}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">
                    Suggested action
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{aiInsights.suggestedAction}</p>
                </div>
              </div>
            )}
          </section>
        ) : null}

        {activeTab === "messages" ? <InstructorMessagesPanel courses={courseOptions} /> : null}

        {activeTab === "assignments" ? (
          <section className="rounded-lg border border-[#e2e8f0] bg-white p-6">
            <h2 className="text-lg font-semibold text-on-surface">Assignments</h2>
            {isAssignmentsLoading ? (
              <p className="mt-4 text-sm text-slate-500">Loading assignments...</p>
            ) : assignments.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No assignments found.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-lg border border-slate-200 p-4">
                    <p className="font-semibold text-on-surface">{assignment.title}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {assignment?.course?.title || "Course"} • Created{" "}
                      {formatDateTime(assignment.createdAt)}
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                      <div className="rounded-md bg-slate-50 p-2">
                        <p className="text-xs text-slate-500">Enrolled</p>
                        <p className="font-semibold">{Number(assignment.enrolledCount || 0)}</p>
                      </div>
                      <div className="rounded-md bg-slate-50 p-2">
                        <p className="text-xs text-slate-500">Completed</p>
                        <p className="font-semibold">{Number(assignment.completedCount || 0)}</p>
                      </div>
                      <div className="rounded-md bg-slate-50 p-2">
                        <p className="text-xs text-slate-500">Pending</p>
                        <p className="font-semibold">{Number(assignment.pendingCount || 0)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {activeTab === "announcements" ? (
          <section className="space-y-5 rounded-lg border border-[#e2e8f0] bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-on-surface">Announcements</h2>
              <button
                type="button"
                onClick={() => setIsAnnouncementComposerOpen((prev) => !prev)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                {isAnnouncementComposerOpen ? "Back to list" : "Compose"}
              </button>
            </div>

            {!isAnnouncementComposerOpen ? (
              <div className="space-y-3">
                {isAnnouncementsLoading ? (
                  <p className="text-sm text-slate-500">Loading announcements...</p>
                ) : announcements.length === 0 ? (
                  <p className="text-sm text-slate-500">No announcements yet.</p>
                ) : (
                  announcements.map((announcement) => (
                    <div key={announcement.id} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-on-surface">
                          {announcement.subject || "Untitled announcement"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(announcement.sentAt)}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        {getCourseTitle(announcement.courseId)} •{" "}
                        {Number(announcement.recipientsCount || 0)} recipients
                      </p>
                      <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap">
                        {announcement.body || "No content"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-sm text-slate-700">Courses</p>
                    <Select
                      name="courseId"
                      value={announcementForm.courseId}
                      onChange={(event) => setAnnouncementField("courseId", event.target.value)}
                      options={courseOptions.map((course) => ({
                        value: course.id,
                        label: course.title,
                      }))}
                      controlClassName="border border-[#4b4c54] rounded-lg min-h-[48px] px-4 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <p className="mb-1 text-sm text-slate-700">Exclude students by course</p>
                    <Select
                      name="excludeCourseId"
                      value={announcementForm.excludeCourseId || ""}
                      onChange={(event) =>
                        setAnnouncementField("excludeCourseId", event.target.value)
                      }
                      options={[
                        { value: "", label: "None" },
                        ...courseOptions
                          .filter((course) => course.id !== "all")
                          .map((course) => ({ value: course.id, label: course.title })),
                      ]}
                      controlClassName="border border-[#4b4c54] rounded-lg min-h-[48px] px-4 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-800">Filter recipients by</p>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Checkbox
                      label="Enrollment date"
                      checked={announcementForm.useEnrollmentDate}
                      onChange={(event) =>
                        setAnnouncementField("useEnrollmentDate", event.target.checked)
                      }
                    />
                    <Checkbox
                      label="Course progress"
                      checked={announcementForm.useCourseProgress}
                      onChange={(event) =>
                        setAnnouncementField("useCourseProgress", event.target.checked)
                      }
                    />
                  </div>

                  {announcementForm.useCourseProgress ? (
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <p className="md:col-span-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Include students who have progressed
                      </p>
                      <Checkbox
                        label="0% (Not started)"
                        checked={announcementForm.progressZero}
                        onChange={(event) =>
                          setAnnouncementField("progressZero", event.target.checked)
                        }
                      />
                      <Checkbox
                        label="1-49%"
                        checked={announcementForm.progressOneToFortyNine}
                        onChange={(event) =>
                          setAnnouncementField("progressOneToFortyNine", event.target.checked)
                        }
                      />
                      <Checkbox
                        label="50-99%"
                        checked={announcementForm.progressFiftyToNinetyNine}
                        onChange={(event) =>
                          setAnnouncementField("progressFiftyToNinetyNine", event.target.checked)
                        }
                      />
                      <Checkbox
                        label="100% completed"
                        checked={announcementForm.progressCompleted}
                        onChange={(event) =>
                          setAnnouncementField("progressCompleted", event.target.checked)
                        }
                      />
                    </div>
                  ) : null}

                  {announcementForm.useEnrollmentDate ? (
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Input
                        type="date"
                        name="includeAfter"
                        label="Enrolled after"
                        value={announcementForm.includeAfter}
                        onChange={(event) => setAnnouncementField("includeAfter", event.target.value)}
                      />
                      <Input
                        type="date"
                        name="includeBefore"
                        label="Enrolled before"
                        value={announcementForm.includeBefore}
                        onChange={(event) => setAnnouncementField("includeBefore", event.target.value)}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4 rounded-lg border border-slate-200 p-4">
                  <h3 className="font-semibold text-on-surface">Content</h3>
                  <Input
                    name="subject"
                    label="Subject"
                    value={announcementForm.subject}
                    onChange={(event) => setAnnouncementField("subject", event.target.value)}
                  />
                  <div>
                    <p className="mb-1 text-sm text-slate-700">Body</p>
                    <TextEditor
                      name="body"
                      value={announcementForm.body}
                      initialValue={announcementForm.body}
                      height={280}
                      onChange={(event) => setAnnouncementField("body", event.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={discardAnnouncement}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={saveAnnouncementDraft}
                      disabled={isSavingDraft}
                      className="rounded-lg border border-[#93c5fd] bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-[#1d4ed8] disabled:opacity-60"
                    >
                      {isSavingDraft ? "Saving..." : "Save as draft"}
                    </button>
                    <button
                      type="button"
                      onClick={sendAnnouncement}
                      disabled={isSendingAnnouncement}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {isSendingAnnouncement ? "Sending..." : "Send"}
                    </button>
                  </div>
                  {announcementStatus ? (
                    <p className="text-sm text-slate-600">{announcementStatus}</p>
                  ) : null}
                </div>
              </>
            )}
          </section>
        ) : null}
      </div>
    </InstructorLayout>
  );
}
