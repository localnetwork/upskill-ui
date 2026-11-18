import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ChevronLeft, Loader2, OctagonAlert, Plus } from "lucide-react";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";
import MiniEditor from "@/components/entities/course/assignment/MiniEditor";
import { confirmModal } from "@/lib/services/confirm";
import FileUploader from "@/components/entities/course/assignment/FileUploader";

const API = process.env.NEXT_PUBLIC_API_URL;

const TABS = [
  ["basic", "Basic Info"],
  ["instructions", "Instructions"],
  ["questions", "Questions"],
  ["solutions", "Solutions"],
];

const emptyForm = {
  title: "",
  description: "",
  duration_minutes: "",
  status: "DRAFT",
  instructions: { video: null, text: "", resource: null },
  questions: [],
  solutions: { video: null, answers: {}, resource: null },
};

function fromCurriculum(curriculum) {
  const asset = curriculum?.asset || {};
  return {
    title: curriculum?.title || "",
    description: curriculum?.curriculum_description || "",
    duration_minutes: curriculum?.estimated_duration
      ? Math.round(curriculum.estimated_duration / 60)
      : "",
    status: asset.status || "DRAFT",
    instructions: { ...emptyForm.instructions, ...(asset.instructions || {}) },
    questions: asset.questions || [],
    solutions: { ...emptyForm.solutions, ...(asset.solutions || {}) },
  };
}

function plain(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

function Section({ title, children }) {
  return (
    <section className="border-b border-[#d1d7dc] pb-6">
      {title ? (
        <h2 className="mb-3 text-[16px] font-bold text-[#1c1d1f]">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}

// One editable rich-text item with Edit/Delete when saved.
function RichItem({
  label,
  html,
  onSave,
  onDelete,
  startEditing = false,
  addLabel,
  stacked = false,
}) {
  const [editing, setEditing] = useState(startEditing);
  const [draft, setDraft] = useState(html || "");

  if (editing) {
    return (
      <div className="space-y-2">
        <MiniEditor value={draft} onChange={setDraft} />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setDraft(html || "");
              setEditing(false);
              if (startEditing && !html) onDelete?.();
            }}
            className="rounded border border-slate-300 px-3 py-1.5 text-[14px] font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!plain(draft)}
            onClick={() => {
              onSave(draft);
              setEditing(false);
            }}
            className="rounded bg-slate-900 px-3 py-1.5 text-[14px] font-bold text-white disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      </div>
    );
  }

  if (!html) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="rounded border border-slate-900 px-3 py-1.5 text-[14px] font-bold"
      >
        {addLabel || "Add"}
      </button>
    );
  }

  if (stacked) {
    return (
      <div>
        {label ? <p className="mb-3 text-[14px] font-bold">{label}</p> : null}
        <div
          className="mb-4 break-words text-[16px] text-[#3e4143]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="h-[42px] rounded-lg bg-primary px-6 text-[15px] font-bold text-white"
          >
            Edit
          </button>
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="h-[42px] rounded-lg border border-primary px-6 text-[15px] font-bold text-primary"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        {label ? <p className="text-[13px] font-bold">{label}</p> : null}
        <div
          className="break-words text-[14px]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <div className="flex shrink-0 gap-3 text-[14px] font-semibold">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-primary"
        >
          Edit
        </button>
        {onDelete ? (
          <button type="button" onClick={onDelete} className="text-red-600">
            Delete
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function AssignmentPage() {
  const router = useRouter();
  const { slug, lessonId } = router.query;
  const curriculumUrl = `/instructor/courses/${slug}/curriculum`;

  const [tab, setTab] = useState("basic");
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newQuestion, setNewQuestion] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const patch = useCallback(
    (changes) => setForm((prev) => ({ ...prev, ...changes })),
    [],
  );

  useEffect(() => {
    if (!lessonId) return;
    let active = true;
    (async () => {
      try {
        const response = await BaseApi.get(
          `${API}/course-curriculums/${lessonId}/assignment`,
        );
        if (active) setForm(fromCurriculum(response?.data?.data?.curriculum));
      } catch (error) {
        toast.error(
          error?.response?.data?.message || "Unable to load this assignment",
        );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [lessonId]);

  const save = async (override = {}, { publish, quiet } = {}) => {
    const next = { ...form, ...override };
    setSaving(true);
    try {
      const response = await BaseApi.put(
        `${API}/course-curriculums/${lessonId}/assignment`,
        {
          basic: {
            title: next.title,
            description: next.description,
            duration_minutes: Number(next.duration_minutes) || 0,
          },
          assignment: {
            instructions: next.instructions,
            questions: next.questions,
            solutions: next.solutions,
          },
          ...(publish === undefined ? {} : { publish }),
        },
      );
      setForm(fromCurriculum(response?.data?.data));
      if (!quiet) toast.success("Saved");
      return true;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const published = form.status === "PUBLISHED";
  const errors = {
    title: !form.title.trim(),
    description: !form.description.trim(),
    duration: !(Number(form.duration_minutes) >= 1),
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const plainOf = (html) =>
    String(html || "")
      .replace(/<[^>]*>/g, "")
      .trim();

  const issues = [
    errors.title && ["basic", "You need to have a title."],
    errors.description && ["basic", "You need to have a description."],
    errors.duration && [
      "basic",
      "You need to estimate the duration of your assignment.",
    ],
    !plainOf(form.instructions.text) &&
      !form.instructions.video && [
        "instructions",
        "You need to have instruction video or text.",
      ],
    form.questions.length === 0 && [
      "questions",
      "You need to have at least 1 question.",
    ],
  ].filter(Boolean);

  const handlePublishToggle = async () => {
    if (published) {
      save({}, { publish: false });
      return;
    }
    const confirmed = await confirmModal({
      title: "Please confirm",
      message:
        "Are you sure you want to publish? Make sure you save any changes before publishing.",
      confirmText: "OK",
    });
    if (!confirmed) return;
    if (issues.length) {
      setShowIssues(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setShowIssues(false);
    save({}, { publish: true });
  };

  const handleDeleteQuestion = async (questionId) => {
    if (published && form.questions.length <= 1) {
      setDeleteError(
        "You cannot delete the final question. Add another question before deleting it.",
      );
      return;
    }
    setDeleteError("");
    const confirmed = await confirmModal({
      title: "Please confirm",
      message: "Are you sure you want to delete?",
      confirmText: "OK",
    });
    if (!confirmed) return;
    setQuestions(form.questions.filter((q) => q.id !== questionId));
  };

  const setQuestions = (questions) => {
    setDeleteError("");
    patch({ questions });
    return save({ questions });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container">
        <div className="border-b border-[#d1d7dc] px-4 pb-4 pt-4 sm:px-6">
          <Link
            href={curriculumUrl}
            className="inline-flex items-center gap-2 text-[15px] font-bold text-primary"
          >
            <ChevronLeft size={14} /> Back to curriculum
          </Link>
          <div className="mt-1 flex items-center justify-between gap-3">
            <h1 className="text-[28px] font-bold leading-tight text-[#1c1d1f] sm:text-[32px]">
              Create Assignment
            </h1>
            <button
              type="button"
              disabled={saving}
              onClick={handlePublishToggle}
              className={`rounded-lg border px-4 py-2.5 text-[15px] font-bold ${
                published
                  ? "border-primary text-primary"
                  : "border-primary bg-primary text-white"
              } disabled:opacity-60`}
            >
              {published ? "Published" : "Publish"}
            </button>
          </div>
        </div>

        {showIssues && issues.length > 0 ? (
          <div className="space-y-4 px-4 pt-8 sm:px-6">
            {issues.map(([targetTab, message]) => (
              <div
                key={message}
                className="flex items-center gap-4 rounded-lg border border-[#c4160a] px-5 py-5 text-[16px] text-[#1c1d1f]"
              >
                <OctagonAlert size={26} className="shrink-0 text-[#c4160a]" />
                <p>
                  {message}{" "}
                  <button
                    type="button"
                    onClick={() => setTab(targetTab)}
                    className="border-b-2 border-[#a87be8] text-[#1c1d1f]"
                  >
                    Click here to fix it.
                  </button>
                </p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid gap-6 px-4 py-8 sm:px-6 md:grid-cols-[300px_1fr]">
          <nav className="flex gap-1 overflow-x-auto md:flex-col md:gap-0">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-left text-[16px] text-[#1c1d1f] md:h-[52px] md:border-b-0 md:border-l-4 md:py-0 md:pl-9 ${
                  tab === key
                    ? "border-[#2d2f31] font-medium"
                    : "border-transparent hover:text-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="min-w-0 max-w-[1285px] space-y-4">
            {tab === "basic" && (
              <div className="space-y-5">
                <div>
                  <label
                    className={`mb-2 flex items-center gap-2 text-[15px] font-bold ${errors.title ? "text-[#c4160a]" : "text-[#1c1d1f]"}`}
                  >
                    Title
                    {errors.title ? <OctagonAlert size={18} /> : null}
                  </label>
                  <div className="relative">
                    <input
                      value={form.title}
                      maxLength={80}
                      onChange={(e) => patch({ title: e.target.value })}
                      placeholder="Title"
                      className={`h-[50px] w-full rounded-[4px] border px-5 pr-16 text-[15px] outline-none ${errors.title ? "border-[#c4160a]" : "border-[#d1d7dc] focus:border-primary"}`}
                    />
                    <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[17px] text-[#6a6f73]">
                      {80 - form.title.length}
                    </span>
                  </div>
                </div>
                <div>
                  <label
                    className={`mb-2 flex items-center gap-2 text-[15px] font-bold ${errors.description ? "text-[#c4160a]" : "text-[#1c1d1f]"}`}
                  >
                    Description
                    {errors.description ? <OctagonAlert size={18} /> : null}
                  </label>
                  <div className="relative">
                    <textarea
                      value={form.description}
                      maxLength={300}
                      rows={3}
                      onChange={(e) => patch({ description: e.target.value })}
                      className={`min-h-[100px] w-full rounded-[4px] border px-5 py-3 pr-16 text-[16px] outline-none ${errors.description ? "border-[#c4160a]" : "border-[#d1d7dc] focus:border-primary"}`}
                    />
                    <span className="pointer-events-none absolute right-5 top-3 text-[17px] text-[#6a6f73]">
                      {300 - form.description.length}
                    </span>
                  </div>
                </div>
                <div>
                  <label
                    className={`mb-2 flex items-center gap-2 text-[15px] font-bold ${errors.duration ? "text-[#c4160a]" : "text-[#1c1d1f]"}`}
                  >
                    Estimated Duration
                    {errors.duration ? <OctagonAlert size={18} /> : null}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.duration_minutes}
                    onChange={(e) =>
                      patch({ duration_minutes: e.target.value })
                    }
                    className={`h-[50px] w-[250px] max-w-full rounded-[4px] border px-5 text-[15px] outline-none ${errors.duration ? "border-[#c4160a]" : "border-[#d1d7dc] focus:border-primary"}`}
                  />
                  {errors.duration ? (
                    <p className="mt-2 w-[250px] max-w-full text-[14px] text-[#c4160a]">
                      A minimum duration of 1 minute is required
                    </p>
                  ) : (
                    <p className="mt-2 text-[14px] text-[#6a6f73]">
                      In minutes
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={saving || hasErrors}
                  onClick={() => save()}
                  className="h-[42px] rounded-lg bg-primary px-8 text-[15px] font-bold text-white disabled:bg-[#dcc9f5]"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}

            {tab === "instructions" && (
              <>
                <Section title="Video">
                  <p className="mb-3 text-[14px] text-slate-600">
                    Add a video that walks learners through the assignment.
                  </p>
                  <FileUploader
                    lessonId={lessonId}
                    accept="video/*"
                    label="Upload Video"
                    showPreview
                    value={form.instructions.video}
                    onChange={(video) =>
                      save(
                        { instructions: { ...form.instructions, video } },
                        { quiet: true },
                      )
                    }
                  />
                </Section>
                <Section title="Assignment Instructions">
                  <RichItem
                    html={form.instructions.text}
                    addLabel="Add instructions"
                    onSave={(text) =>
                      save({ instructions: { ...form.instructions, text } })
                    }
                    onDelete={() =>
                      save({ instructions: { ...form.instructions, text: "" } })
                    }
                  />
                </Section>
                <Section title="Downloadable resource">
                  <FileUploader
                    lessonId={lessonId}
                    label="Select File"
                    maxBytes={1024 * 1024 * 1024}
                    value={form.instructions.resource}
                    onChange={(resource) =>
                      save(
                        { instructions: { ...form.instructions, resource } },
                        { quiet: true },
                      )
                    }
                  />
                </Section>
              </>
            )}

            {tab === "questions" && (
              <Section title="Questions">
                <div className="space-y-4">
                  {deleteError ? (
                    <div className="flex items-center gap-4 rounded-lg border border-[#c4160a] px-5 py-5 text-[16px] font-medium text-[#1c1d1f]">
                      <OctagonAlert
                        size={26}
                        className="shrink-0 text-[#c4160a]"
                      />
                      <p>{deleteError}</p>
                    </div>
                  ) : null}
                  {form.questions.map((question, index) => (
                    <div key={question.id}>
                      <RichItem
                        stacked
                        label={`Question ${index + 1}`}
                        html={question.body}
                        onSave={(body) =>
                          setQuestions(
                            form.questions.map((q) =>
                              q.id === question.id ? { ...q, body } : q,
                            ),
                          )
                        }
                        onDelete={() => handleDeleteQuestion(question.id)}
                      />
                    </div>
                  ))}
                  {newQuestion ? (
                    <div className="flex gap-3">
                      <span className="pt-0.5 text-[14px] font-bold">
                        {form.questions.length + 1}.
                      </span>
                      <div className="min-w-0 flex-1">
                        <RichItem
                          startEditing
                          onSave={async (body) => {
                            setNewQuestion(false);
                            await setQuestions([
                              ...form.questions,
                              { id: `q${Date.now()}`, body },
                            ]);
                          }}
                          onDelete={() => setNewQuestion(false)}
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setNewQuestion(true)}
                      className="inline-flex items-center gap-1 rounded border border-slate-900 px-4 py-2 text-[14px] font-bold"
                    >
                      <Plus size={16} /> Add more
                    </button>
                  )}
                </div>
              </Section>
            )}

            {tab === "solutions" && (
              <>
                <Section title="Video">
                  <p className="mb-3 text-[14px] text-slate-600">
                    Upload a video walkthrough of the solution. Use at least
                    720p, under 4.0 GB.
                  </p>
                  <FileUploader
                    lessonId={lessonId}
                    accept="video/*"
                    label="Select Video"
                    showPreview
                    value={form.solutions.video}
                    onChange={(video) =>
                      save(
                        { solutions: { ...form.solutions, video } },
                        { quiet: true },
                      )
                    }
                  />
                </Section>
                <Section title="Questions">
                  {form.questions.length === 0 ? (
                    <p className="text-[14px] text-slate-500">
                      Add questions first to provide answers.
                    </p>
                  ) : (
                    <div className="space-y-5">
                      {form.questions.map((question, index) => (
                        <div key={question.id} className="space-y-2">
                          <div className="flex gap-2 text-[14px]">
                            <span className="font-bold">{index + 1}.</span>
                            <div
                              className="break-words"
                              dangerouslySetInnerHTML={{
                                __html: question.body,
                              }}
                            />
                          </div>
                          <div className="ml-5">
                            <RichItem
                              label="Your answer"
                              addLabel="Add Answer"
                              html={form.solutions.answers[question.id]}
                              onSave={(body) =>
                                save({
                                  solutions: {
                                    ...form.solutions,
                                    answers: {
                                      ...form.solutions.answers,
                                      [question.id]: body,
                                    },
                                  },
                                })
                              }
                              onDelete={() => {
                                const answers = { ...form.solutions.answers };
                                delete answers[question.id];
                                save({
                                  solutions: { ...form.solutions, answers },
                                });
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
                <Section title="Downloadable resource">
                  <p className="mb-3 text-[14px] text-slate-600">
                    File must be under 1 GiB.
                  </p>
                  <FileUploader
                    lessonId={lessonId}
                    label="Select File"
                    maxBytes={1024 * 1024 * 1024}
                    value={form.solutions.resource}
                    onChange={(resource) =>
                      save(
                        { solutions: { ...form.solutions, resource } },
                        { quiet: true },
                      )
                    }
                  />
                </Section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
