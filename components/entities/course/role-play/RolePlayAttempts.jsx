import { Ban, Check, Play, RotateCcw, Square, TriangleAlert, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getRolePlayCharacter,
  previewRolePlayVoice,
  stopRolePlayVoice,
} from "@/lib/rolePlayCharacters";

const formatClock = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

const formatDate = (value) => {
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  return `${month} ${date.getDate()}, ${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDuration = (seconds) =>
  `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;

function Report({ report, completed }) {
  if (completed === false) {
    return (
      <div className="flex items-center gap-5 rounded-xl bg-[#f6f7f9] p-6">
        <TriangleAlert
          size={40}
          strokeWidth={1.5}
          className="shrink-0 text-slate-800"
        />
        <div>
          <p className="text-[13px] font-bold text-slate-900">
            Role Play not completed
          </p>
          <p className="mt-0.5 text-[12px] text-slate-500">
            It looks like this practice session ended unexpectedly. Continue
            practicing to receive feedback.
          </p>
        </div>
      </div>
    );
  }
  if (!report) {
    return (
      <div className="flex items-center gap-5 rounded-xl bg-[#f6f7f9] p-6">
        <Ban size={40} strokeWidth={1.5} className="shrink-0 text-slate-800" />
        <div>
          <p className="text-[13px] font-bold text-slate-900">
            No report available for this attempt
          </p>
          <p className="mt-0.5 text-[12px] text-slate-500">
            This practice ended before enough dialogue was completed to generate
            meaningful feedback.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-4 rounded-xl bg-[#f6f7f9] p-6 text-[13px] text-slate-800">
      <p className="leading-relaxed">{report.summary}</p>
      {report.goals?.length > 0 && (
        <div>
          <h3 className="mb-2 font-bold text-slate-900">Goals</h3>
          <ul className="space-y-2">
            {report.goals.map((item, index) => (
              <li key={index} className="flex gap-2">
                {item.met ? (
                  <Check
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />
                ) : (
                  <X size={16} className="mt-0.5 shrink-0 text-red-500" />
                )}
                <span>
                  <span className="font-medium">{item.goal}</span>
                  {item.feedback && (
                    <span className="block text-slate-500">
                      {item.feedback}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {report.strengths?.length > 0 && (
        <div>
          <h3 className="mb-1 font-bold text-slate-900">What went well</h3>
          <ul className="list-disc pl-5">
            {report.strengths.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {report.improvements?.length > 0 && (
        <div>
          <h3 className="mb-1 font-bold text-slate-900">To improve</h3>
          <ul className="list-disc pl-5">
            {report.improvements.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function RolePlayAttempts({
  title,
  attempts,
  selectedId,
  onSelect,
  onPracticeAgain,
  character,
}) {
  const ordered = [...attempts].reverse();
  const selected =
    attempts.find((attempt) => attempt.id === selectedId) || ordered[0];
  const number = attempts.indexOf(selected) + 1;
  const voice = getRolePlayCharacter(character?.voice);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [replayingAll, setReplayingAll] = useState(false);
  const replayRunRef = useRef(0);

  const stopReplay = useCallback(() => {
    replayRunRef.current += 1;
    stopRolePlayVoice();
    setPlayingIndex(null);
    setReplayingAll(false);
  }, []);

  useEffect(() => stopReplay, [selected?.id, stopReplay]);

  const speakLine = (message, onEnd) => {
    if (message.role === "assistant") {
      previewRolePlayVoice(voice, message.content, { onEnd });
    } else {
      // Learner audio isn't recorded, so their lines are only highlighted for a moment.
      setTimeout(onEnd, Math.min(6000, 800 + message.content.length * 55));
    }
  };

  const playOne = (index) => {
    if (playingIndex === index && !replayingAll) return stopReplay();
    stopReplay();
    const run = replayRunRef.current;
    setPlayingIndex(index);
    speakLine(selected.transcript[index], () => {
      if (replayRunRef.current === run) setPlayingIndex(null);
    });
  };

  const replayAll = () => {
    if (replayingAll) return stopReplay();
    stopReplay();
    const run = replayRunRef.current;
    setReplayingAll(true);
    const step = (index) => {
      if (replayRunRef.current !== run) return;
      if (index >= selected.transcript.length) {
        setPlayingIndex(null);
        setReplayingAll(false);
        return;
      }
      setPlayingIndex(index);
      speakLine(selected.transcript[index], () => step(index + 1));
    };
    step(0);
  };

  return (
    <div className="mx-auto max-w-[590px] px-4 pt-6">
      <h1 className="text-[28px] font-bold text-slate-900">{title}</h1>
      <button
        type="button"
        onClick={onPracticeAgain}
        className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-3 text-[14px] font-bold text-white"
      >
        <RotateCcw size={14} /> Practice again
      </button>

      <div className="mt-6 flex gap-6 border-b border-slate-200">
        {ordered.map((attempt) => {
          const active = attempt.id === selected.id;
          return (
            <button
              key={attempt.id}
              type="button"
              onClick={() => onSelect(attempt.id)}
              className={`-mb-px border-b-2 px-1 pb-3 text-[13px] ${
                active
                  ? "border-slate-900 font-medium text-slate-900"
                  : "border-transparent text-slate-500"
              }`}
            >
              <span className="inline-flex items-center gap-1">
                Practice {attempts.indexOf(attempt) + 1}
                {attempt.completed !== false && (
                  <Check size={12} className="text-emerald-600" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-4">
        <h2 className="text-[20px] font-bold text-slate-900">
          Practice Role Play Report
        </h2>
        <span className="border-l border-slate-300 pl-4 text-[12px] text-slate-500">
          {formatDate(selected.created_at)}
        </span>
        {selected.completed !== false && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[12px] font-bold text-emerald-700">
            <Check size={12} /> Completed
          </span>
        )}
      </div>
      <div className="mt-4">
        <Report report={selected.report} completed={selected.completed} />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-[18px] font-bold text-slate-900">Transcript</h2>
        {selected.transcript.length > 0 && (
          <button
            type="button"
            onClick={replayAll}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-[12px] font-bold text-slate-900 hover:bg-slate-50"
          >
            {replayingAll ? (
              <Square size={12} fill="currentColor" />
            ) : (
              <Play size={12} fill="currentColor" />
            )}
            {replayingAll ? "Stop replay" : "Replay conversation"}
          </button>
        )}
      </div>
      <p className="mt-1 text-[12px] text-slate-500">
        Practice {number} · {selected.mode === "audio" ? "Audio" : "Text"} ·{" "}
        {formatDuration(selected.duration_seconds)}
      </p>
      <div className="mb-24 mt-4 space-y-3 rounded-xl bg-[#f6f7f9] p-5">
        {selected.transcript.map((message, index) => {
          const isAi = message.role === "assistant";
          const active = playingIndex === index;
          return (
            <div
              key={index}
              className={`rounded-lg p-2 text-[13px] transition ${active ? "bg-white shadow-sm" : ""}`}
            >
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-900">
                  {isAi ? character?.name || "AI character" : "You"}
                </p>
                {Number.isFinite(message.at) && (
                  <span className="text-[11px] text-slate-400">
                    {formatClock(message.at)}
                  </span>
                )}
                {isAi && (
                  <button
                    type="button"
                    onClick={() => playOne(index)}
                    aria-label={active ? "Stop line" : "Replay line"}
                    className="ml-auto text-primary"
                  >
                    {active ? (
                      <Square size={12} fill="currentColor" />
                    ) : (
                      <Play size={12} fill="currentColor" />
                    )}
                  </button>
                )}
              </div>
              <p className="mt-0.5 text-slate-700">{message.content}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
