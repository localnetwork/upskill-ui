import BaseApi from "@/lib/api/_base.api";
import { Send, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

function normalizeSuggestedTopics(course) {
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

  for (const section of sections) {
    pushUnique(`Explain ${section?.title}`);
    for (const curriculum of (section?.curriculums || []).slice(0, 4)) {
      pushUnique(`Help me understand: ${curriculum?.title}`);
    }
  }

  return output.slice(0, 14);
}

function parseMessageBlocks(content) {
  const lines = String(content || "")
    .replace(/\r\n/g, "\n")
    .split("\n");
  const blocks = [];
  let currentParagraph = [];
  let currentList = null;

  const flushParagraph = () => {
    if (currentParagraph.length === 0) return;
    blocks.push({
      type: "paragraph",
      text: currentParagraph.join(" ").trim(),
    });
    currentParagraph = [];
  };

  const flushList = () => {
    if (!currentList || currentList.items.length === 0) return;
    blocks.push(currentList);
    currentList = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(bulletMatch[1].trim());
      continue;
    }

    if (orderedMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(orderedMatch[2].trim());
      continue;
    }

    flushList();
    currentParagraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  return blocks;
}

function MessageContent({ content, isUser }) {
  const blocks = parseMessageBlocks(content);
  const textClass = isUser ? "text-white" : "text-slate-700";
  const listClass = isUser ? "text-white/95" : "text-slate-700";

  return (
    <div className="space-y-2 leading-relaxed">
      {blocks.length === 0 ? <p className={textClass}>{content}</p> : null}
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={`p-${index}`} className={textClass}>
              {block.text}
            </p>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={`ul-${index}`} className={`list-disc pl-5 space-y-1 ${listClass}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`uli-${index}-${itemIndex}`}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <ol key={`ol-${index}`} className={`list-decimal pl-5 space-y-1 ${listClass}`}>
            {block.items.map((item, itemIndex) => (
              <li key={`oli-${index}-${itemIndex}`}>{item}</li>
            ))}
          </ol>
        );
      })}
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
    () => normalizeSuggestedTopics(course),
    [course],
  );

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
            .map((row) => ({ role: row.role, content: row.content })),
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

        <div className="px-4 py-3 border-b border-slate-200">
          <p className="text-[12px] text-slate-500 mb-2">Suggested topics</p>
          <div className="flex flex-wrap gap-2">
            {localSuggestedTopics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => sendMessage(topic)}
                className="text-[11px] rounded-full px-3 py-1 border border-[#cbd5e1] text-[#334155] hover:bg-[#eff6ff] hover:border-[#93c5fd]"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#f8fafc]">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`max-w-[90%] rounded-xl px-3 py-2 text-[13px] ${
                message.role === "user"
                  ? "ml-auto bg-[#0056D2] text-white"
                  : "bg-white border border-slate-200 text-slate-700"
              }`}
            >
              <MessageContent
                content={message.content}
                isUser={message.role === "user"}
              />
            </div>
          ))}
          {isSending ? (
            <div className="max-w-[90%] rounded-xl px-3 py-2 text-[13px] bg-white border border-slate-200 text-slate-500">
              Thinking...
            </div>
          ) : null}
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-3 border-t border-slate-200 flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about this course..."
            className="flex-1 min-h-[44px] max-h-[120px] border border-slate-300 rounded-lg px-3 py-2 text-[13px] resize-y"
          />
          <button
            type="submit"
            disabled={isSending || String(input || "").trim().length < 2}
            className={`h-[44px] px-3 rounded-lg text-white ${
              isSending || String(input || "").trim().length < 2
                ? "bg-[#0056D2]/60 cursor-not-allowed"
                : "bg-[#0056D2] hover:opacity-90"
            }`}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
