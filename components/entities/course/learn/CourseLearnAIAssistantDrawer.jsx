import BaseApi from "@/lib/api/_base.api";
import { Send, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const MAX_SUGGESTED_TOPICS = 3;

function normalizeSuggestedTopics(course, currentLecture) {
  const sections = Array.isArray(course?.sections) ? course.sections : [];
  const output = [];
  const seen = new Set();

  const pushUnique = (value) => {
    const normalized = String(value || "").trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    output.push(normalized);
  };

  if (currentLecture?.title) {
    pushUnique(`Summarize: ${currentLecture.title}`);
    pushUnique(`Help me understand: ${currentLecture.title}`);
  }

  for (const section of sections) {
    pushUnique(`Explain ${section?.title}`);
    for (const curriculum of (section?.curriculums || []).slice(0, 4)) {
      pushUnique(`Help me understand: ${curriculum?.title}`);
    }
  }

  return output.slice(0, MAX_SUGGESTED_TOPICS);
}

function buildMarkdownComponents(isUser) {
  const link = isUser ? "underline text-white" : "underline text-[#0056D2]";
  return {
    p: (props) => <p className="my-2 first:mt-0 last:mb-0" {...props} />,
    h1: (props) => (
      <h3 className="mt-3 mb-1 text-[15px] font-bold" {...props} />
    ),
    h2: (props) => (
      <h3 className="mt-3 mb-1 text-[15px] font-bold" {...props} />
    ),
    h3: (props) => (
      <h4 className="mt-3 mb-1 text-[14px] font-semibold" {...props} />
    ),
    h4: (props) => <h4 className="mt-2 mb-1 font-semibold" {...props} />,
    ul: (props) => <ul className="my-2 list-disc pl-5 space-y-1" {...props} />,
    ol: (props) => (
      <ol className="my-2 list-decimal pl-5 space-y-1" {...props} />
    ),
    a: (props) => (
      <a
        className={link}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ),
    blockquote: (props) => (
      <blockquote
        className="my-2 border-l-4 border-slate-300 pl-3 italic opacity-90"
        {...props}
      />
    ),
    hr: () => <hr className="my-3 border-slate-200" />,
    pre: (props) => (
      <pre
        className="my-2 overflow-x-auto rounded-lg bg-[#16161D] p-3 text-[12px] text-slate-100"
        {...props}
      />
    ),
    code: ({ className, children, ...props }) =>
      className ? (
        <code className={`${className} font-mono`} {...props}>
          {children}
        </code>
      ) : (
        <code
          className={`rounded px-1 py-0.5 font-mono text-[12px] ${
            isUser ? "bg-white/20" : "bg-slate-100 text-slate-800"
          }`}
          {...props}
        >
          {children}
        </code>
      ),
    table: (props) => (
      <div className="my-2 overflow-x-auto">
        <table className="min-w-full border-collapse text-[12px]" {...props} />
      </div>
    ),
    th: (props) => (
      <th
        className="border border-slate-300 bg-slate-100 px-2 py-1 text-left font-semibold text-slate-800"
        {...props}
      />
    ),
    td: (props) => (
      <td className="border border-slate-300 px-2 py-1" {...props} />
    ),
  };
}

function MessageContent({ content, isUser }) {
  const components = useMemo(() => buildMarkdownComponents(isUser), [isUser]);

  return (
    <div
      className={`leading-relaxed break-words ${
        isUser ? "text-white" : "text-slate-700"
      }`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {String(content || "")}
      </ReactMarkdown>
    </div>
  );
}
export default function CourseLearnAIAssistantDrawer({
  open,
  onClose,
  course,
  currentLecture,
}) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I can help explain this course. Ask me about any section, lesson, or concept.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const localSuggestedTopics = useMemo(
    () => normalizeSuggestedTopics(course, currentLecture),
    [course, currentLecture],
  );
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending, open]);

  const canSend = !isSending && input.trim().length >= 2;

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (canSend) sendMessage(input);
    }
  };

  const sendMessage = async (rawText) => {
    const text = String(rawText || "").trim();
    if (!text || isSending || !course?.slug) return;

    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${encodeURIComponent(course.slug)}/learn-assistant`,
        {
          message: text,
          lecture_id: currentLecture?.id || null,
          messages: nextMessages
            .slice(-10)
            .map((row) => ({
              role: row.role,
              content: String(row.content || "").slice(0, 4000),
            })),
        },
      );
      const reply =
        String(response?.data?.data?.reply || "").trim() ||
        "I couldn't generate a response. Please try asking in a different way.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (error) {
      toast.error(error?.data?.message || "AI assistant is unavailable.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I’m having trouble replying right now. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await sendMessage(input);
  };

  return (
    <div
      className={`fixed top-[60px] right-0 h-[calc(100vh-60px)] w-full max-w-[420px] bg-white border-l border-slate-200 shadow-2xl z-[70] transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles size={16} className="text-[#0056D2]" />
            AI Course Assistant
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#f8fafc]">
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            return (
              <div
                key={`${message.role}-${index}`}
                className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser ? (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-[#0056D2]/10 text-[#0056D2] flex items-center justify-center">
                    <Sparkles size={14} />
                  </div>
                ) : null}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] shadow-sm p-[15px] ${
                    isUser
                      ? "bg-[#0056D2] text-white rounded-br-sm"
                      : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm"
                  }`}
                >
                  <MessageContent content={message.content} isUser={isUser} />
                </div>
              </div>
            );
          })}
          {isSending ? (
            <div className="flex items-end gap-2">
              <div className="h-7 w-7 shrink-0 rounded-full bg-[#0056D2]/10 text-[#0056D2] flex items-center justify-center">
                <Sparkles size={14} />
              </div>
              <div className="rounded-2xl rounded-bl-sm bg-white border border-slate-200 px-4 py-3 flex gap-1">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-200 bg-white p-3 space-y-2 shrink-0">
          {localSuggestedTopics.length > 0 ? (
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400 mb-1.5">
                Suggested topics
              </p>
              <div className="flex flex-col gap-1.5">
                {localSuggestedTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    disabled={isSending}
                    onClick={() => sendMessage(topic)}
                    className="w-full text-left text-[12px] truncate rounded-lg px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-[#eff6ff] hover:border-[#93c5fd] disabled:opacity-50"
                    title={topic}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask about this course... (Enter to send)"
              className="flex-1 min-h-[44px] max-h-[120px] border border-slate-300 rounded-lg px-3 py-2.5 text-[13px] resize-none focus:outline-none focus:border-[#0056D2]"
            />
            <button
              type="submit"
              disabled={!canSend}
              className={`h-[44px] px-3 rounded-lg text-white ${
                canSend
                  ? "bg-[#0056D2] hover:opacity-90"
                  : "bg-[#0056D2]/60 cursor-not-allowed"
              }`}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
