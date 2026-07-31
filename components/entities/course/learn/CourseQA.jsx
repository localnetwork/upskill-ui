"use client";

import { useEffect, useState } from "react";
import BaseApi from "@/lib/api/_base.api";
import {
  BookOpen,
  ChevronDown,
  ArrowBigUp,
  MessageSquare,
  PlusCircle,
  School,
  HelpCircle,
  Palette,
  ArrowUpDown,
  CircleQuestionMark,
  XCircle,
  HelpCircleIcon,
  Tag,
} from "lucide-react";
const CATEGORY_OPTIONS = [
  {
    value: "COURSE_CONTENT",
    label: "Course Content",
    description:
      "Ask about this lesson, exercises, or concepts from the course.",
    icon: <School />,
  },
  {
    value: "SOMETHING_ELSE",
    label: "Something else",
    description: "Ask related learning questions beyond direct lesson content.",
    icon: <HelpCircleIcon />,
  },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All status" },
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
];

const CATEGORY_FILTER_OPTIONS = [
  { value: "all", label: "All categories" },
  { value: "COURSE_CONTENT", label: "Course Content" },
  { value: "SOMETHING_ELSE", label: "Something else" },
];

const SORT_FILTER_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "most_upvoted", label: "Most Upvoted" },
  { value: "oldest", label: "Oldest" },
];

function formatAuthorName(author) {
  return (
    [author?.firstName, author?.lastName].filter(Boolean).join(" ").trim() ||
    author?.username ||
    "User"
  );
}

function formatCategory(category) {
  return category === "SOMETHING_ELSE" ? "Something else" : "Course Content";
}

export default function CourseQA({ courseSlug, lectureId }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [askStep, setAskStep] = useState(1);
  const [isSubmittingThread, setIsSubmittingThread] = useState(false);
  const [newQuestionCategory, setNewQuestionCategory] =
    useState("COURSE_CONTENT");
  const [newQuestionTitle, setNewQuestionTitle] = useState("");
  const [newQuestionBody, setNewQuestionBody] = useState("");
  const [newQuestionImagePath, setNewQuestionImagePath] = useState("");
  const [newQuestionImageTitle, setNewQuestionImageTitle] = useState("");
  const [isUploadingQuestionImage, setIsUploadingQuestionImage] =
    useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [selectedThreadLoading, setSelectedThreadLoading] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isUpdatingVote, setIsUpdatingVote] = useState(false);
  const [isUpdatingResolved, setIsUpdatingResolved] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    sort: "newest",
  });
  const [canModerate, setCanModerate] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  const isThreadView = Boolean(selectedThreadId);
  const showHeaderAskButton = !isThreadView;
  const showListFilters = !isAsking && !isThreadView;
  const showList = !isAsking && !isThreadView;
  const showThread = isThreadView;

  const fetchThreads = async ({ preserveSelected = true } = {}) => {
    if (!courseSlug || !lectureId) return;
    try {
      setLoading(true);
      const response = await BaseApi.get(
        `${apiBase}/courses/${encodeURIComponent(courseSlug)}/discussions`,
        {
          params: {
            lessonId: lectureId,
            limit: 20,
            page: 1,
            status: filters.status,
            category: filters.category,
            sort: filters.sort,
          },
        },
      );
      const nextThreads = Array.isArray(response?.data?.data)
        ? response.data.data
        : [];
      setThreads(nextThreads);
      setCanModerate(Boolean(response?.data?.permissions?.canModerate));
      if (!preserveSelected) {
        setSelectedThreadId(null);
        setSelectedThread(null);
      } else if (
        selectedThreadId &&
        !nextThreads.some((thread) => thread.id === selectedThreadId)
      ) {
        setSelectedThreadId(null);
        setSelectedThread(null);
      }
    } catch (error) {
      console.error("Error fetching discussion threads:", error);
      setThreads([]);
      setCanModerate(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchThreadDetail = async (threadId) => {
    if (!threadId) return;
    try {
      setSelectedThreadLoading(true);
      const response = await BaseApi.get(
        `${apiBase}/discussions/${encodeURIComponent(threadId)}`,
      );
      setSelectedThread(response?.data?.data || null);
    } catch (error) {
      console.error("Error fetching thread detail:", error);
      setSelectedThread(null);
    } finally {
      setSelectedThreadLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads({ preserveSelected: false });
  }, [courseSlug, lectureId, filters.status, filters.category, filters.sort]);

  useEffect(() => {
    if (!selectedThreadId) {
      setSelectedThread(null);
      setReplyDraft("");
      return;
    }
    fetchThreadDetail(selectedThreadId);
  }, [selectedThreadId]);

  const handleCreateThread = async (event) => {
    event.preventDefault();
    if (isSubmittingThread) return;
    const title = newQuestionTitle.trim();
    const body = newQuestionBody.trim();
    if (!title || !body) return;

    try {
      setIsSubmittingThread(true);
      await BaseApi.post(
        `${apiBase}/courses/${encodeURIComponent(courseSlug)}/discussions`,
        {
          lessonId: lectureId,
          category: newQuestionCategory,
          imagePath: newQuestionImagePath || null,
          title,
          body,
        },
      );
      setNewQuestionTitle("");
      setNewQuestionBody("");
      setNewQuestionImagePath("");
      setNewQuestionImageTitle("");
      setNewQuestionCategory("COURSE_CONTENT");
      setIsAsking(false);
      setAskStep(1);
      await fetchThreads();
    } catch (error) {
      console.error("Error creating discussion thread:", error);
    } finally {
      setIsSubmittingThread(false);
    }
  };

  const handleQuestionImageUpload = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file || isUploadingQuestionImage) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);

    try {
      setIsUploadingQuestionImage(true);
      const response = await BaseApi.post(`${apiBase}/media`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const uploaded = response?.data || {};
      setNewQuestionImagePath(String(uploaded.path || "").trim());
      setNewQuestionImageTitle(String(uploaded.title || file.name || "").trim());
    } catch (error) {
      console.error("Error uploading discussion image:", error);
    } finally {
      setIsUploadingQuestionImage(false);
      event.target.value = "";
    }
  };

  const handleReply = async () => {
    if (!selectedThreadId || isSubmittingReply) return;
    const body = replyDraft.trim();
    if (!body) return;
    try {
      setIsSubmittingReply(true);
      await BaseApi.post(
        `${apiBase}/discussions/${encodeURIComponent(selectedThreadId)}/replies`,
        {
          body,
        },
      );
      setReplyDraft("");
      await Promise.all([fetchThreadDetail(selectedThreadId), fetchThreads()]);
    } catch (error) {
      console.error("Error posting discussion reply:", error);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const setOptimisticVoteState = (threadId, hasUpvoted, upvotesCount) => {
    const safeCount = Math.max(0, Number(upvotesCount || 0));
    setThreads((previous) =>
      previous.map((item) =>
        item.id === threadId
          ? {
              ...item,
              hasUpvoted,
              upvotesCount: safeCount,
            }
          : item,
      ),
    );
    setSelectedThread((previous) =>
      previous && previous.id === threadId
        ? {
            ...previous,
            hasUpvoted,
            upvotesCount: safeCount,
          }
        : previous,
    );
  };

  const handleToggleVote = async (thread) => {
    if (!thread?.id || isUpdatingVote) return;
    const threadId = thread.id;
    const baseline =
      threads.find((item) => item.id === threadId) ||
      (selectedThread?.id === threadId ? selectedThread : null) ||
      thread;
    const previousHasUpvoted = Boolean(baseline?.hasUpvoted);
    const previousUpvotesCount = Number(baseline?.upvotesCount || 0);
    const nextHasUpvoted = !previousHasUpvoted;
    const nextUpvotesCount = Math.max(
      0,
      previousUpvotesCount + (nextHasUpvoted ? 1 : -1),
    );

    try {
      setIsUpdatingVote(true);
      setOptimisticVoteState(threadId, nextHasUpvoted, nextUpvotesCount);

      const response = await BaseApi.put(
        `${apiBase}/discussions/${encodeURIComponent(threadId)}/vote`,
        {
          isUpvoted: nextHasUpvoted,
        },
      );
      const serverVote = response?.data?.data;
      if (serverVote?.threadId === threadId) {
        setOptimisticVoteState(
          threadId,
          Boolean(serverVote.hasUpvoted),
          Number(serverVote.upvotesCount || 0),
        );
      }
    } catch (error) {
      console.error("Error updating vote:", error);
      setOptimisticVoteState(
        threadId,
        previousHasUpvoted,
        previousUpvotesCount,
      );
    } finally {
      setIsUpdatingVote(false);
    }
  };

  const handleToggleResolved = async () => {
    if (!selectedThread?.id || isUpdatingResolved) return;
    try {
      setIsUpdatingResolved(true);
      await BaseApi.put(
        `${apiBase}/discussions/${encodeURIComponent(selectedThread.id)}/resolved`,
        {
          isResolved: !selectedThread.isResolved,
        },
      );
      await Promise.all([fetchThreadDetail(selectedThread.id), fetchThreads()]);
    } catch (error) {
      console.error("Error updating discussion status:", error);
    } finally {
      setIsUpdatingResolved(false);
    }
  };

  return (
    <div className="new ui">
      <section className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">
            Knowledge Exchange
          </span>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-on-surface md:text-5xl">
            Q&amp;A Discussions
          </h1>
          <p className="text-lg leading-relaxed text-on-surface-variant">
            Collaborate with fellow scholars. Ask questions, upvote impactful
            threads, and track resolved academic challenges in{" "}
            <span className="italic">real-time</span>.
          </p>
        </div>

        {showHeaderAskButton && (
          <button
            type="button"
            onClick={() =>
              setIsAsking((previous) => {
                const next = !previous;
                if (!next) setAskStep(1);
                return next;
              })
            }
            className="group flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-bold text-white shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-95"
          >
            {isAsking ? <XCircle /> : <PlusCircle />}
            <span>{isAsking ? "Cancel" : "Ask New Question"}</span>
          </button>
        )}
      </section>

      {isAsking && (
        <form
          onSubmit={handleCreateThread}
          className="mb-10 rounded-lg border border-[#e2e8f0]/50 bg-[#f1f5f9] p-4"
        >
          {askStep === 1 ? (
            <div className="space-y-4">
              <p className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
                Step 1: Select question type
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                {CATEGORY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setNewQuestionCategory(option.value)}
                    className={`rounded-lg border p-4 text-left transition-all ${
                      newQuestionCategory === option.value
                        ? "border-primary bg-white shadow-sm"
                        : "border-[#e2e8f0] bg-white hover:border-primary/40"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">
                        {option.icon}
                      </span>
                      <span className="text-sm font-bold text-on-surface">
                        {option.label}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setAskStep(2)}
                  className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-white"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
                Step 2: Write your question
              </p>
              <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-primary">
                {/* <span className="material-symbols-outlined text-sm">label</span> */}
                <Tag className="text-sm" />
                {formatCategory(newQuestionCategory)}
              </div>
              <input
                value={newQuestionTitle}
                onChange={(event) => setNewQuestionTitle(event.target.value)}
                placeholder="Question title"
                className="w-full rounded-md border border-[#e2e8f0] bg-white px-4 py-3 text-sm font-semibold text-on-surface"
              />
              <textarea
                value={newQuestionBody}
                onChange={(event) => setNewQuestionBody(event.target.value)}
                placeholder="Write your question..."
                className="min-h-[120px] w-full rounded-md border border-[#e2e8f0] bg-white px-4 py-3 text-sm text-on-surface"
              />
              <div className="rounded-md border border-dashed border-[#e2e8f0] bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-on-surface">
                      Attach image (optional)
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      PNG, JPG, WEBP supported.
                    </p>
                  </div>
                  <label className="cursor-pointer rounded-full border border-[#e2e8f0] px-4 py-1.5 text-xs font-bold text-on-surface-variant hover:border-primary hover:text-primary">
                    {isUploadingQuestionImage
                      ? "Uploading..."
                      : newQuestionImagePath
                        ? "Change image"
                        : "Upload image"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQuestionImageUpload}
                      className="hidden"
                      disabled={isUploadingQuestionImage}
                    />
                  </label>
                </div>
                {newQuestionImagePath ? (
                  <div className="mt-3 space-y-2">
                    <img
                      src={newQuestionImagePath}
                      alt={newQuestionImageTitle || "Discussion attachment"}
                      className="max-h-60 w-full rounded-md border border-[#e2e8f0] object-cover"
                    />
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-on-surface-variant">
                        {newQuestionImageTitle || "Attached image"}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setNewQuestionImagePath("");
                          setNewQuestionImageTitle("");
                        }}
                        className="rounded-full border border-[#e2e8f0] px-3 py-1 text-xs font-bold text-on-surface-variant hover:border-red-200 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setAskStep(1)}
                  className="rounded-full border border-[#e2e8f0] bg-white px-6 py-2 text-sm font-bold text-on-surface-variant"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingThread}
                  className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmittingThread ? "Posting..." : "Post Discussion"}
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {showListFilters && (
        <div className="mb-10 flex flex-wrap gap-2 rounded-lg border border-[#e2e8f0]/50 bg-[#f1f5f9] p-2">
          <div className="min-w-[200px] flex-1">
            <label className="sr-only">Status</label>
            <div className="group relative">
              <select
                value={filters.status}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    status: event.target.value,
                  }))
                }
                className="w-full cursor-pointer appearance-none rounded-md border-none bg-white px-4 py-3 text-sm font-semibold text-on-surface-variant transition-all focus:ring-2 focus:ring-primary/20"
              >
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 transition-colors group-hover:text-primary" />
            </div>
          </div>

          <div className="min-w-[200px] flex-1">
            <label className="sr-only">Category</label>
            <div className="group relative">
              <select
                value={filters.category}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    category: event.target.value,
                  }))
                }
                className="w-full cursor-pointer appearance-none rounded-md border-none bg-white px-4 py-3 text-sm font-semibold text-on-surface-variant transition-all focus:ring-2 focus:ring-primary/20"
              >
                {CATEGORY_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 transition-colors group-hover:text-primary" />
            </div>
          </div>

          <div className="min-w-[200px] flex-1">
            <label className="sr-only">Sort Order</label>
            <div className="group relative">
              <select
                value={filters.sort}
                onChange={(event) =>
                  setFilters((previous) => ({
                    ...previous,
                    sort: event.target.value,
                  }))
                }
                className="w-full cursor-pointer appearance-none rounded-md border-none bg-white px-4 py-3 text-sm font-semibold text-on-surface-variant transition-all focus:ring-2 focus:ring-primary/20"
              >
                {SORT_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <ArrowUpDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 transition-colors group-hover:text-primary" />
            </div>
          </div>
        </div>
      )}

      {showList && (
        <div className="space-y-6">
          {loading ? (
            <p className="text-sm text-on-surface-variant">
              Loading discussions...
            </p>
          ) : threads.length === 0 ? (
            <div className="flex flex-col items-center rounded-lg border-2 border-dashed border-[#e2e8f0] bg-[#f1f5f9]/30 py-12">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                <BookOpen className="text-3xl text-primary" />
              </div>
              <p className="mb-2 font-bold text-on-surface-variant">
                End of the Scroll
              </p>
              <p className="max-w-xs text-center text-xs text-on-surface-variant/60">
                Can&apos;t find what you&apos;re looking for? Be the first to
                start a new discussion in this module.
              </p>
            </div>
          ) : (
            threads.map((thread) => (
              <div
                key={thread.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setIsAsking(false);
                  setSelectedThreadId(thread.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setIsAsking(false);
                    setSelectedThreadId(thread.id);
                  }
                }}
                className="group rounded-lg border border-[#e2e8f0] bg-surface p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-xl"
              >
                <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                          thread.isResolved
                            ? "bg-green-100 text-green-700"
                            : "bg-[#fff9f0] text-[#ea580c]"
                        }`}
                      >
                        {thread.isResolved ? "Resolved" : "Open"}
                      </span>
                      <span className="text-xs font-medium tracking-tight text-on-surface-variant/60">
                        Post ID: {thread.id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>

                    <h3 className="mb-1 text-xl font-bold text-on-surface transition-colors group-hover:text-primary">
                      {thread.title}
                    </h3>

                    <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                      <span className="font-semibold text-on-surface">
                        {formatAuthorName(thread.author)}
                      </span>
                      <span className="text-on-surface-variant/40">•</span>
                      <span className="text-xs">
                        {new Date(thread.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleToggleVote(thread);
                      }}
                      className={`flex h-14 w-14 flex-col items-center justify-center rounded-lg transition-all duration-200 ${
                        thread.hasUpvoted
                          ? "bg-primary text-white"
                          : "hover:bg-primary hover:text-white"
                      }`}
                    >
                      <ArrowBigUp className="font-variation-settings-fill-1" />
                      <span className="text-xs font-extrabold">
                        {thread.upvotesCount}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="mb-6 rounded-md border-l-4 border-primary bg-[#f1f5f9] p-4">
                  {thread.imagePath ? (
                    <img
                      src={thread.imagePath}
                      alt={thread.title}
                      className="mb-3 max-h-64 w-full rounded-md border border-[#e2e8f0] object-cover"
                    />
                  ) : null}
                  <p className="line-clamp-2 text-on-surface-variant">
                    {thread.body}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-4">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 rounded-full bg-[#f1f5f9] px-3 py-1.5 text-xs font-bold text-on-surface-variant">
                      {thread.category === "SOMETHING_ELSE" ? (
                        <School />
                      ) : (
                        <HelpCircle />
                      )}
                      {formatCategory(thread.category)}
                    </span>

                    <div className="flex items-center gap-1.5 text-xs font-bold text-on-surface-variant">
                      <MessageSquare className="text-sm" />
                      {thread.repliesCount} replies
                    </div>
                  </div>

                  <button
                    type="button"
                    className="text-xs font-extrabold uppercase tracking-widest text-primary hover:underline"
                  >
                    Join Discussion
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showThread && (
        <div className="rounded-lg border border-[#e2e8f0] bg-surface p-6">
          {selectedThreadLoading ? (
            <p className="text-sm text-on-surface-variant">
              Loading discussion...
            </p>
          ) : !selectedThread ? (
            <p className="text-sm text-on-surface-variant">
              Discussion not found.
            </p>
          ) : (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedThreadId(null);
                  setSelectedThread(null);
                }}
                className="rounded-full border border-[#e2e8f0] bg-white px-4 py-1.5 text-sm font-bold text-on-surface-variant"
              >
                Back to discussions
              </button>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-2xl font-extrabold text-on-surface">
                    {selectedThread.title}
                  </h4>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${
                      selectedThread.isResolved
                        ? "bg-green-100 text-green-700"
                        : "bg-[#fff9f0] text-[#ea580c]"
                    }`}
                  >
                    {selectedThread.isResolved ? "Resolved" : "Open"}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">
                  {formatAuthorName(selectedThread.author)} •{" "}
                  {new Date(selectedThread.createdAt).toLocaleString()}
                </p>
                <p className="whitespace-pre-wrap text-on-surface-variant">
                  {selectedThread.body}
                </p>
                {selectedThread.imagePath ? (
                  <img
                    src={selectedThread.imagePath}
                    alt={selectedThread.title}
                    className="max-h-80 w-full rounded-md border border-[#e2e8f0] object-cover"
                  />
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-bold text-on-surface-variant">
                    {formatCategory(selectedThread.category)}
                  </span>
                  <button
                    type="button"
                    disabled={isUpdatingVote}
                    onClick={() => handleToggleVote(selectedThread)}
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      selectedThread.hasUpvoted
                        ? "bg-primary text-white"
                        : "border border-[#e2e8f0] bg-white text-on-surface-variant"
                    }`}
                  >
                    {selectedThread.hasUpvoted ? "Upvoted" : "Upvote"} ▲{" "}
                    {selectedThread.upvotesCount}
                  </button>
                  {canModerate && (
                    <button
                      type="button"
                      disabled={isUpdatingResolved}
                      onClick={handleToggleResolved}
                      className="rounded-full border border-[#e2e8f0] bg-white px-3 py-1 text-xs font-bold text-on-surface-variant"
                    >
                      {selectedThread.isResolved
                        ? "Mark Open"
                        : "Mark Resolved"}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
                  Replies
                </h5>
                {(selectedThread.replies || []).length === 0 ? (
                  <p className="text-sm text-on-surface-variant">
                    No replies yet.
                  </p>
                ) : (
                  (selectedThread.replies || []).map((reply) => (
                    <div
                      key={reply.id}
                      className="rounded-md border border-[#e2e8f0] bg-[#f1f5f9] p-3"
                    >
                      <p className="text-xs text-on-surface-variant">
                        {formatAuthorName(reply.author)} •{" "}
                        {new Date(reply.createdAt).toLocaleString()}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-on-surface-variant">
                        {reply.body}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2 border-t border-[#e2e8f0] pt-3">
                <textarea
                  value={replyDraft}
                  onChange={(event) => setReplyDraft(event.target.value)}
                  placeholder="Write a reply..."
                  className="min-h-[90px] w-full rounded-md border border-[#e2e8f0] bg-white px-3 py-2 text-sm"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={isSubmittingReply}
                    onClick={handleReply}
                    className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmittingReply ? "Posting..." : "Post Reply"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
