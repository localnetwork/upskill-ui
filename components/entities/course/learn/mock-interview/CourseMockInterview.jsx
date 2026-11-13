import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import MOCKINTERVIEWAPI from "@/lib/api/mock-interview/request";
import useInterviewSpeech from "./useInterviewSpeech";

const InterviewAvatar = dynamic(() => import("./InterviewAvatar"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-900" />,
});

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];

const errorMessage = (error) =>
  error?.response?.data?.message || error?.message || "Something went wrong";

function ReportList({ title, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <h4 className="font-semibold text-slate-800 mb-1">{title}</h4>
      <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function CourseMockInterview({ courseId }) {
  const speech = useInterviewSpeech();
  const [phase, setPhase] = useState("setup");
  const [role, setRole] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [interviewId, setInterviewId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const chatEnd = useRef(null);

  const { speak, stopSpeaking, startListening, stopListening, transcript, setTranscript } = speech;

  useEffect(() => {
    if (!courseId) return;
    MOCKINTERVIEWAPI.list(courseId)
      .then((res) => setHistory((res.data?.data || []).filter((row) => row.status === "COMPLETED")))
      .catch(() => {});
  }, [courseId, phase]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (transcript) setDraft(transcript);
  }, [transcript]);

  useEffect(() => () => stopSpeaking(), [stopSpeaking]);

  const say = (text) => {
    if (voiceOn) speak(text);
  };

  const handleStart = async () => {
    setBusy(true);
    try {
      const res = await MOCKINTERVIEWAPI.start({
        courseId,
        difficulty,
        ...(role.trim() ? { role: role.trim() } : {}),
      });
      const interview = res.data.data;
      setInterviewId(interview.id);
      setMessages(interview.turns.map((turn) => ({ speaker: turn.speaker, text: turn.text })));
      setPhase("interview");
      say(interview.turns[interview.turns.length - 1]?.text);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const handleFinish = async (id = interviewId) => {
    stopListening();
    stopSpeaking();
    setBusy(true);
    try {
      const res = await MOCKINTERVIEWAPI.finish(id);
      setReport(res.data.data);
      setPhase("report");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async () => {
    const answer = draft.trim();
    if (!answer || busy) return;
    stopListening();
    stopSpeaking();
    setBusy(true);
    setDraft("");
    setTranscript("");
    setMessages((prev) => [...prev, { speaker: "USER", text: answer }]);
    try {
      const res = await MOCKINTERVIEWAPI.answer(interviewId, answer);
      const { feedback, score, nextQuestion, done } = res.data.data;
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...next[next.length - 1], feedback, score };
        return nextQuestion ? [...next, { speaker: "AI", text: nextQuestion }] : next;
      });
      if (done) {
        await handleFinish();
        return;
      }
      say(nextQuestion);
    } catch (error) {
      setMessages((prev) => prev.slice(0, -1));
      setDraft(answer);
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const toggleMic = () => {
    if (speech.listening) return stopListening();
    stopSpeaking();
    if (!startListening()) toast.error("Voice input isn't supported in this browser. Type your answer instead.");
  };

  const toggleVoice = () => {
    if (voiceOn) stopSpeaking();
    setVoiceOn((value) => !value);
  };

  const reset = () => {
    setReport(null);
    setMessages([]);
    setInterviewId(null);
    setPhase("setup");
  };

  if (phase === "setup") {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-[320px] rounded-xl overflow-hidden">
          <InterviewAvatar speaking={false} listening={false} />
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-800">AI Mock Interview</h3>
          <p className="text-sm text-slate-600">
            Alex, your AI interviewer, will ask questions based on this course and give feedback after
            each answer. Answer by voice or by typing.
          </p>
          <label className="block text-sm font-medium text-slate-700">
            Target role (optional)
            <input
              value={role}
              onChange={(event) => setRole(event.target.value)}
              maxLength={100}
              placeholder="e.g. Junior Frontend Developer"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <div>
            <span className="block text-sm font-medium text-slate-700 mb-1">Difficulty</span>
            <div className="flex gap-2">
              {DIFFICULTIES.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`px-3 py-1.5 rounded-md border text-sm capitalize ${difficulty === level ? "bg-primary text-white border-primary" : "border-slate-300 text-slate-600"}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleStart}
            disabled={busy}
            className="px-5 py-2 rounded-md bg-primary text-white text-sm font-semibold disabled:opacity-60"
          >
            {busy ? "Preparing interview..." : "Start interview"}
          </button>
          {history.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-1">Previous attempts</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                {history.slice(0, 3).map((row) => (
                  <li key={row.id}>
                    {new Date(row.startedAt).toLocaleDateString()} · {row.difficulty} · score{" "}
                    <strong>{row.score ?? "-"}/100</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === "report" && report) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold">
            {report.score ?? 0}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Interview complete</h3>
            <p className="text-sm text-slate-600">{report.summary || "Thanks for completing the interview."}</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <ReportList title="Strengths" items={report.report?.strengths} />
          <ReportList title="Improve" items={report.report?.improvements} />
          <ReportList title="Review these topics" items={report.report?.recommendedTopics} />
        </div>
        <button
          type="button"
          onClick={reset}
          className="px-5 py-2 rounded-md bg-primary text-white text-sm font-semibold"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <div className="relative h-[320px] md:h-[460px] rounded-xl overflow-hidden">
        <InterviewAvatar speaking={speech.speaking} listening={speech.listening} />
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-white">
          <span className="bg-black/50 rounded px-2 py-1">
            {speech.speaking ? "Alex is speaking..." : busy ? "Alex is thinking..." : speech.listening ? "Listening..." : "Your turn"}
          </span>
          <button type="button" onClick={toggleVoice} className="bg-black/50 rounded p-1.5" aria-label="Toggle interviewer voice">
            {voiceOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
        </div>
      </div>

      <div className="flex flex-col h-[460px]">
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.map((message, index) => (
            <div key={index} className={message.speaker === "AI" ? "" : "text-right"}>
              <div
                className={`inline-block max-w-[90%] rounded-lg px-3 py-2 text-sm text-left ${message.speaker === "AI" ? "bg-slate-100 text-slate-800" : "bg-primary text-white"}`}
              >
                {message.text}
              </div>
              {message.feedback && (
                <p className="mt-1 text-xs text-slate-500 italic">
                  Feedback ({message.score}/10): {message.feedback}
                </p>
              )}
            </div>
          ))}
          {busy && <p className="text-xs text-slate-400">Thinking...</p>}
          <div ref={chatEnd} />
        </div>
        <div className="pt-3 space-y-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            maxLength={4000}
            disabled={busy}
            placeholder="Speak with the mic or type your answer..."
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={toggleMic}
                disabled={busy}
                className={`p-2 rounded-md border ${speech.listening ? "bg-red-500 text-white border-red-500" : "border-slate-300 text-slate-600"}`}
                aria-label="Toggle microphone"
              >
                {speech.listening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button
                type="button"
                onClick={() => handleFinish()}
                disabled={busy}
                className="px-3 py-2 rounded-md border border-slate-300 text-sm text-slate-600"
              >
                End interview
              </button>
            </div>
            <button
              type="button"
              onClick={handleSend}
              disabled={busy || !draft.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white text-sm font-semibold disabled:opacity-60"
            >
              <Send size={16} /> Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
