"use client";

import BaseApi from "@/lib/api/_base.api";
import persistentStore from "@/lib/store/persistentStore";
import Link from "next/link";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function formatPrice(course) {
  const numeric = Number(course?.price || course?.price_tier?.price || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "Free";
  return `PHP ${numeric.toFixed(2)}`;
}

function quickMessageLabel(label, onClick) {
  return (
    <button
      key={label}
      type="button"
      onClick={onClick}
      className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
    >
      {label}
    </button>
  );
}

export default function LearnerAIWidget() {
  const profile = persistentStore((state) => state.profile);
  const roleList = useMemo(
    () => (Array.isArray(profile?.roles) ? profile.roles : []),
    [profile?.roles],
  );
  const isLearner = roleList.includes("LEARNER");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I can search published courses, manage your cart, check enrollment/cart status, and recommend courses based on your activity.",
      courses: [],
    },
  ]);
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open]);

  const sendMessage = async (rawMessage, extraPayload = {}) => {
    const text = String(rawMessage || "").trim();
    if (!text || isSending) return;

    setMessages((prev) => [...prev, { role: "user", content: text, courses: [] }]);
    setInput("");
    setIsSending(true);

    try {
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/learner-assistant`,
        {
          message: text,
          ...extraPayload,
          messages: messages
            .slice(-8)
            .map((row) => ({ role: row.role, content: row.content })),
        },
      );

      const payload = response?.data?.data || {};
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: String(payload?.reply || "I couldn't generate a response."),
          courses: Array.isArray(payload?.courses) ? payload.courses : [],
        },
      ]);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.data?.message ||
        "Assistant is unavailable right now.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: message, courses: [] },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await sendMessage(input);
  };

  const handleCourseAction = async (action, course) => {
    if (!course?.id) return;
    if (action === "add") {
      await sendMessage(`Add "${course.title}" to cart`, { course_id: course.id });
      return;
    }
    if (action === "remove") {
      await sendMessage(`Remove "${course.title}" from cart`, {
        course_id: course.id,
      });
      return;
    }
    await sendMessage(`Check status for "${course.title}"`, { course_id: course.id });
  };

  if (!isLearner) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-[90] h-14 w-14 rounded-full bg-[#0056D2] text-white shadow-lg shadow-[#0056D2]/30 flex items-center justify-center"
        aria-label="Open learner assistant"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {open ? (
        <div className="fixed bottom-24 right-6 z-[90] w-[360px] max-w-[calc(100vw-24px)] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
            <Sparkles size={16} className="text-[#0056D2]" />
            <p className="text-sm font-semibold text-slate-800">Learner AI Assistant</p>
          </div>

          <div className="px-3 py-2 border-b border-slate-100 flex flex-wrap gap-2">
            {quickMessageLabel("Recommend courses", () =>
              sendMessage("Recommend courses for me"),
            )}
            {quickMessageLabel("Search React courses", () =>
              sendMessage("Search React courses"),
            )}
            {quickMessageLabel("Show cart status", () =>
              sendMessage("Show my cart status"),
            )}
          </div>

          <div
            ref={listRef}
            className="h-[360px] overflow-y-auto px-3 py-3 space-y-3 bg-slate-50"
          >
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className="space-y-2">
                <div
                  className={`max-w-[92%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "ml-auto bg-[#0056D2] text-white"
                      : "bg-white border border-slate-200 text-slate-700"
                  }`}
                >
                  {message.content}
                </div>

                {message.role === "assistant" && Array.isArray(message.courses) && message.courses.length ? (
                  <div className="space-y-2">
                    {message.courses.map((course) => (
                      <div
                        key={course.id}
                        className="rounded-lg border border-slate-200 bg-white p-2.5"
                      >
                        <p className="text-sm font-semibold text-slate-900">{course.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {course?.category?.title || "General"} • {formatPrice(course)}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Link
                            href={`/courses/${course.slug}`}
                            className="text-xs font-semibold text-[#0056D2]"
                          >
                            View
                          </Link>
                          {course.is_enrolled ? (
                            <span className="text-[11px] rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                              Enrolled
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                handleCourseAction(
                                  course.is_in_cart ? "remove" : "add",
                                  course,
                                )
                              }
                              className="text-[11px] rounded-full border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-50"
                            >
                              {course.is_in_cart ? "Remove from cart" : "Add to cart"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCourseAction("status", course)}
                            className="text-[11px] rounded-full border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-50"
                          >
                            Check status
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            {isSending ? (
              <div className="max-w-[92%] rounded-xl px-3 py-2 text-sm bg-white border border-slate-200 text-slate-500">
                Thinking...
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-200 p-2.5 flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about courses, cart, recommendations..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={isSending || String(input || "").trim().length < 2}
              className={`h-[40px] w-[40px] rounded-lg flex items-center justify-center text-white ${
                isSending || String(input || "").trim().length < 2
                  ? "bg-[#0056D2]/60 cursor-not-allowed"
                  : "bg-[#0056D2]"
              }`}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
