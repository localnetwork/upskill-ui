import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import BaseApi from "@/lib/api/_base.api";
import {
  MARKUP_LANGUAGES,
  buildPreviewDocument,
} from "@/lib/services/codingPreview";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const STATUS_STYLES = {
  IDLE: "bg-slate-700 text-slate-200",
  RUNNING: "bg-blue-500/20 text-blue-300",
  COMPLETED: "bg-emerald-500/20 text-emerald-300",
  FAILED: "bg-red-500/20 text-red-300",
};

const STATUS_LABELS = {
  IDLE: "Ready",
  RUNNING: "Running...",
  COMPLETED: "Checked",
  FAILED: "Error",
};

const RUN_TIMEOUT_MS = 5000;

function getDraftKey(lectureId, language) {
  return `coding-draft:${lectureId}:${language}`;
}

function getStepKey(lectureId, language) {
  return `coding-step:${lectureId}:${language}`;
}

function getStepNumber(step) {
  return Number(step?.step_number || step?.stepNumber || 0);
}

function getSortedSteps(asset, language) {
  const entries = Array.isArray(asset?.step_challenges?.[language])
    ? asset.step_challenges[language]
    : [];
  return [...entries].sort((a, b) => getStepNumber(a) - getStepNumber(b));
}

function cleanList(value) {
  return Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
}

// Runs learner JavaScript inside a sandboxed, origin-less iframe and collects console output.
function runJavaScriptInSandbox(code) {
  return new Promise((resolve) => {
    const token = Math.random().toString(36).slice(2);
    const lines = [];
    const iframe = document.createElement("iframe");
    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.style.display = "none";
    let finished = false;
    let timer = null;

    const finish = (timedOut = false) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      iframe.remove();
      if (timedOut) {
        lines.push({
          type: "error",
          text: "Stopped: the code ran longer than 5 seconds.",
        });
      }
      resolve(lines);
    };

    const onMessage = (event) => {
      if (event.source !== iframe.contentWindow) return;
      const data = event.data;
      if (!data || data.token !== token) return;
      if (data.type === "done") {
        finish();
        return;
      }
      lines.push({ type: data.type, text: String(data.text ?? "") });
    };

    window.addEventListener("message", onMessage);
    const safeCode = JSON.stringify(String(code || "")).replace(/</g, "\\u003c");
    iframe.srcdoc = `<script>
const T=${JSON.stringify(token)};
const send=(type,text)=>parent.postMessage({token:T,type,text},"*");
const fmt=(a)=>a.map((x)=>{try{return typeof x==="string"?x:JSON.stringify(x)}catch(e){return String(x)}}).join(" ");
["log","info","debug"].forEach((k)=>{console[k]=(...a)=>send("log",fmt(a))});
["warn","error"].forEach((k)=>{console[k]=(...a)=>send("error",fmt(a))});
window.onerror=(m)=>{send("error",String(m));return true};
try{(0,eval)(${safeCode})}catch(e){send("error",String(e))}
setTimeout(()=>send("done",""),400);
<\/script>`;
    timer = setTimeout(() => finish(true), RUN_TIMEOUT_MS);
    document.body.appendChild(iframe);
  });
}

export default function CodingExercisePreview({
  lecture,
  setCourse,
  prevLecture,
  nextLecture,
  onNavigate,
}) {
  const [activeLanguage, setActiveLanguage] = useState(
    lecture?.asset?.languages?.[0] || "javascript",
  );
  const [codeByLanguage, setCodeByLanguage] = useState({});
  const [status, setStatus] = useState("IDLE");
  const [stepCheckSummary, setStepCheckSummary] = useState(null);
  const [currentStepNumber, setCurrentStepNumber] = useState(1);
  const [submissionError, setSubmissionError] = useState("");
  const [notice, setNotice] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resizerPercent, setResizerPercent] = useState(40);
  const [revealedHints, setRevealedHints] = useState({});
  const [previewCode, setPreviewCode] = useState("");
  const [runState, setRunState] = useState({ status: "idle", lines: [] });
  const [lessonDone, setLessonDone] = useState(false);
  const isDraggingRef = useRef(false);
  const containerRef = useRef(null);
  const bodyRef = useRef(null);
  const checkRef = useRef(null);
  const runRef = useRef(null);

  const languages = useMemo(() => {
    const fromAsset =
      Array.isArray(lecture?.asset?.languages) && lecture.asset.languages.length
        ? lecture.asset.languages
        : [];
    if (fromAsset.length) return fromAsset;
    const fromSteps = lecture?.asset?.step_challenges
      ? Object.keys(lecture.asset.step_challenges)
      : [];
    return fromSteps.length ? fromSteps : ["javascript"];
  }, [lecture?.asset?.languages, lecture?.asset?.step_challenges]);

  const stepChallenges = useMemo(
    () => getSortedSteps(lecture?.asset || {}, activeLanguage),
    [lecture?.asset, activeLanguage],
  );
  const isStepMode = stepChallenges.length > 0;
  const activeStep = useMemo(() => {
    if (!stepChallenges.length) return null;
    return (
      stepChallenges.find((step) => getStepNumber(step) === currentStepNumber) ||
      stepChallenges[0]
    );
  }, [stepChallenges, currentStepNumber]);
  const activeStepNumber = activeStep ? getStepNumber(activeStep) : 1;
  const activeStepIndex = activeStep ? stepChallenges.indexOf(activeStep) : 0;

  const hintItems = useMemo(() => {
    const stepHints = cleanList(activeStep?.hints);
    return stepHints.length ? stepHints : cleanList(lecture?.asset?.hints);
  }, [activeStep, lecture?.asset?.hints]);
  const hintKey = `${activeLanguage}:${activeStepNumber}`;
  const revealedCount = Math.min(revealedHints[hintKey] || 0, hintItems.length);

  const isHtml = MARKUP_LANGUAGES.includes(activeLanguage);
  const activeCode = codeByLanguage[activeLanguage] || "";

  useEffect(() => {
    if (!languages.includes(activeLanguage)) {
      setActiveLanguage(languages[0]);
    }
  }, [languages, activeLanguage]);

  useEffect(() => {
    const nextCodeByLanguage = {};
    for (const language of languages) {
      let saved = null;
      try {
        saved = localStorage.getItem(getDraftKey(lecture?.id, language));
      } catch (_error) {}
      const firstStep = getSortedSteps(lecture?.asset || {}, language)[0];
      const starterFromStep = String(
        firstStep?.starter_code || firstStep?.starterCode || "",
      );
      nextCodeByLanguage[language] =
        saved !== null
          ? saved
          : starterFromStep || lecture?.asset?.starter_code?.[language] || "";
    }
    setCodeByLanguage(nextCodeByLanguage);
    setStatus("IDLE");
    setStepCheckSummary(null);
    setSubmissionError("");
    setNotice(null);
    setRunState({ status: "idle", lines: [] });
    setRevealedHints({});
    setLessonDone(false);
  }, [lecture?.id, languages.join("|")]);

  // Restore which step the learner was on, so saved code and step stay in sync.
  useEffect(() => {
    let saved = 1;
    try {
      saved =
        Number(
          localStorage.getItem(getStepKey(lecture?.id, activeLanguage)),
        ) || 1;
    } catch (_error) {}
    const exists = getSortedSteps(lecture?.asset || {}, activeLanguage).some(
      (step) => getStepNumber(step) === saved,
    );
    setCurrentStepNumber(exists ? saved : 1);
  }, [lecture?.id, activeLanguage]);

  useEffect(() => {
    if (!lecture?.id || !activeLanguage) return;
    try {
      localStorage.setItem(
        getStepKey(lecture.id, activeLanguage),
        String(currentStepNumber),
      );
    } catch (_error) {}
  }, [lecture?.id, activeLanguage, currentStepNumber]);

  useEffect(() => {
    if (!lecture?.id || !activeLanguage) return;
    const currentCode = codeByLanguage[activeLanguage];
    if (currentCode === undefined) return;
    try {
      localStorage.setItem(getDraftKey(lecture.id, activeLanguage), currentCode);
    } catch (_error) {}
  }, [lecture?.id, activeLanguage, codeByLanguage]);

  // Debounced live preview for HTML.
  useEffect(() => {
    if (!isHtml) return undefined;
    const timer = setTimeout(() => setPreviewCode(activeCode), 400);
    return () => clearTimeout(timer);
  }, [isHtml, activeCode]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const rect = bodyRef.current?.getBoundingClientRect();
      if (!rect) return;
      const percent = Math.max(
        22,
        Math.min(70, Math.round(((e.clientX - rect.left) / rect.width) * 100)),
      );
      setResizerPercent(percent);
    };
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const updateCurrentLectureCompletion = () => {
    setLessonDone(true);
    setCourse((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((section) => ({
          ...section,
          curriculums: section.curriculums.map((curriculum) =>
            curriculum.id === lecture.id
              ? {
                  ...curriculum,
                  is_taken: true,
                  completed: true,
                  progress_pct: 100,
                }
              : curriculum,
          ),
        })),
      };
    });
  };

  const getErrorMessage = (error, fallback) =>
    error?.response?.data?.message ||
    error?.data?.message ||
    error?.message ||
    fallback;

  const runCode = useCallback(async () => {
    if (status === "RUNNING") return;
    if (!String(activeCode).trim()) {
      setRunState({
        status: "done",
        lines: [{ type: "error", text: "Write some code first." }],
      });
      return;
    }

    if (isHtml) {
      setPreviewCode(activeCode);
      return;
    }

    setRunState({ status: "running", lines: [] });
    try {
      if (activeLanguage === "javascript") {
        const lines = await runJavaScriptInSandbox(activeCode);
        setRunState({
          status: "done",
          lines: lines.length
            ? lines
            : [{ type: "info", text: "(no output - use console.log to print)" }],
        });
        return;
      }

      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/course-curriculums/${lecture.id}/coding-run`,
        { language: activeLanguage, sourceCode: activeCode },
      );
      const data = response?.data?.data || {};
      const lines = [];
      if (data.compileOutput)
        lines.push({ type: "error", text: data.compileOutput });
      if (data.output) lines.push({ type: "log", text: data.output });
      if (data.stderr) lines.push({ type: "error", text: data.stderr });
      if (!lines.length)
        lines.push({
          type: "info",
          text: data.statusDescription || "(no output)",
        });
      setRunState({ status: "done", lines });
    } catch (error) {
      setRunState({
        status: "done",
        lines: [
          {
            type: "error",
            text: getErrorMessage(error, "Unable to run code right now."),
          },
        ],
      });
    }
  }, [activeCode, activeLanguage, isHtml, lecture?.id, status]);

  const checkStepCode = async () => {
    if (!isStepMode || !activeStep) return;
    try {
      setSubmissionError("");
      setStepCheckSummary(null);
      setNotice(null);
      setStatus("RUNNING");
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/course-curriculums/${lecture.id}/coding-step-check`,
        {
          language: activeLanguage,
          sourceCode: activeCode,
          stepNumber: activeStepNumber,
        },
      );
      const data = response?.data?.data || {};
      setStatus("COMPLETED");
      setStepCheckSummary(data?.summary || null);
      if (
        data?.next?.stepNumber &&
        Number(data.next.stepNumber) !== activeStepNumber
      ) {
        setCurrentStepNumber(Number(data.next.stepNumber));
        setNotice({
          type: "success",
          text: `Step ${activeStepNumber} complete! Step ${data.next.stepNumber} is ready.`,
        });
        if (data?.next?.starterCode !== undefined) {
          setCodeByLanguage((prev) => ({
            ...prev,
            [activeLanguage]: data.next.starterCode,
          }));
        }
      }
      if (data?.lessonCompleted) {
        setNotice({
          type: "success",
          text: "Exercise complete! Great work.",
        });
        updateCurrentLectureCompletion();
      }
    } catch (error) {
      setStatus("FAILED");
      setSubmissionError(getErrorMessage(error, "Unable to check code"));
    }
  };

  const submitSolution = async () => {
    try {
      setSubmissionError("");
      setStepCheckSummary(null);
      setNotice(null);
      setStatus("RUNNING");
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/course-curriculums/${lecture.id}/coding-submit`,
        {
          language: activeLanguage,
          sourceCode: activeCode,
          action: "submit",
        },
      );
      const data = response?.data?.data || {};
      setStatus("COMPLETED");
      setStepCheckSummary(data?.summary || null);
      if (data?.lessonCompleted) {
        setNotice({ type: "success", text: "Solution accepted. Well done!" });
        updateCurrentLectureCompletion();
      }
    } catch (error) {
      setStatus("FAILED");
      setSubmissionError(getErrorMessage(error, "Unable to submit code"));
    }
  };

  // Keep the latest handlers reachable from Monaco keybindings registered once on mount.
  checkRef.current = isStepMode ? checkStepCode : submitSolution;
  runRef.current = runCode;

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (_error) {}
  };

  const resetCode = () => {
    setCodeByLanguage((prev) => ({
      ...prev,
      [activeLanguage]:
        String(activeStep?.starter_code || activeStep?.starterCode || "") ||
        lecture?.asset?.starter_code?.[activeLanguage] ||
        "",
    }));
    setStepCheckSummary(null);
    setNotice(null);
  };

  const revealNextHint = () =>
    setRevealedHints((prev) => ({
      ...prev,
      [hintKey]: Math.min((prev[hintKey] || 0) + 1, hintItems.length),
    }));

  const visibleResults = stepCheckSummary?.visibleResults || [];
  const darkBtn =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-200 border border-slate-600 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex flex-col bg-[#0f111a] text-slate-100 overflow-hidden"
    >
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-b border-slate-700 bg-[#161925]">
        <h3 className="font-semibold text-sm truncate max-w-[40%]">
          {lecture?.title || "Coding Exercise"}
        </h3>

        {isStepMode && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {stepChallenges.map((step, index) => (
                <span
                  key={getStepNumber(step) || index}
                  title={step?.title || `Step ${index + 1}`}
                  className={`h-1.5 w-6 rounded-full ${
                    index < activeStepIndex || lessonDone
                      ? "bg-emerald-400"
                      : index === activeStepIndex
                        ? "bg-blue-400"
                        : "bg-slate-600"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-slate-400">
              Step {activeStepIndex + 1} of {stepChallenges.length}
            </span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {languages.length > 1 &&
            languages.map((language) => (
              <button
                key={language}
                onClick={() => setActiveLanguage(language)}
                className={`px-2.5 py-1 rounded-md text-xs ${
                  activeLanguage === language
                    ? "bg-blue-600 text-white"
                    : "border border-slate-600 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {language}
              </button>
            ))}
          <span
            className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_STYLES[status]}`}
          >
            {STATUS_LABELS[status]}
          </span>
          {prevLecture && (
            <button
              onClick={() => onNavigate?.(prevLecture)}
              disabled={Boolean(prevLecture?.is_locked)}
              title={prevLecture.title}
              className={darkBtn}
            >
              <ChevronLeft size={14} /> Prev
            </button>
          )}
          {nextLecture && (
            <button
              onClick={() => onNavigate?.(nextLecture)}
              disabled={Boolean(nextLecture?.is_locked)}
              title={nextLecture.title}
              className={darkBtn}
            >
              Next <ChevronRight size={14} />
            </button>
          )}
          <button onClick={toggleFullscreen} className={darkBtn}>
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div
        ref={bodyRef}
        className="flex-1 min-h-0 flex"
      >
        {/* Instructions panel */}
        <div
          className="min-w-0 overflow-y-auto p-5 space-y-5 bg-white text-slate-800"
          style={{ width: `${resizerPercent}%` }}
        >
          {isStepMode && activeStep ? (
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 mb-1">
                Step {activeStepIndex + 1}
                {activeStep?.title ? ` - ${activeStep.title}` : ""}
              </p>
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                {String(activeStep?.instruction || activeStep?.instructions || "")}
              </p>
            </section>
          ) : (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
              This lesson has no step-by-step challenges configured yet.
            </p>
          )}

          {/* Hints */}
          <section className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
                <Lightbulb size={15} /> Hints
              </p>
              {hintItems.length > 0 && (
                <button
                  onClick={revealNextHint}
                  disabled={revealedCount >= hintItems.length}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {revealedCount >= hintItems.length
                    ? "No more hints"
                    : revealedCount === 0
                      ? "Show a hint"
                      : "Show next hint"}
                </button>
              )}
            </div>
            {hintItems.length === 0 ? (
              <p className="text-xs text-slate-500 mt-2">
                No hints for this exercise.
              </p>
            ) : (
              <>
                <p className="text-xs text-slate-500 mt-1">
                  {revealedCount} of {hintItems.length} hints revealed
                </p>
                <div className="space-y-2 mt-2">
                  {hintItems.slice(0, revealedCount).map((item, index) => (
                    <p
                      key={`${index}-${item}`}
                      className="text-sm bg-white border border-amber-200 rounded-md p-2.5"
                    >
                      <span className="font-semibold text-amber-700">
                        Hint {index + 1}:
                      </span>{" "}
                      {item}
                    </p>
                  ))}
                </div>
              </>
            )}
          </section>

          {notice && (
            <p
              className={`text-sm rounded-md p-3 border ${
                notice.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {notice.text}
              {lessonDone && nextLecture && !nextLecture.is_locked && (
                <button
                  onClick={() => onNavigate?.(nextLecture)}
                  className="ml-2 underline font-semibold"
                >
                  Continue to next lesson
                </button>
              )}
            </p>
          )}

          {submissionError && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
              {submissionError}
            </p>
          )}

          {stepCheckSummary && (
            <section className="rounded-lg border border-slate-200 p-3 space-y-2">
              <p
                className={`text-sm font-semibold ${
                  stepCheckSummary.allPassed
                    ? "text-emerald-700"
                    : "text-red-600"
                }`}
              >
                {stepCheckSummary.allPassed
                  ? "All checks passed"
                  : "Not quite yet - keep trying"}
                <span className="font-normal text-slate-500">
                  {" "}
                  ({stepCheckSummary.passedChecks ??
                    stepCheckSummary.passedTests ??
                    0}
                  /
                  {stepCheckSummary.totalChecks ??
                    stepCheckSummary.totalTests ??
                    0}
                  )
                </span>
              </p>
              {visibleResults.map((item) => {
                const showOutputDiff = item.mode === "RUN_OUTPUT" || !item.mode;
                return (
                  <div key={item.id} className="text-sm">
                    <p className="flex items-start gap-1.5">
                      {item.passed ? (
                        <CheckCircle2
                          size={16}
                          className="text-emerald-600 mt-0.5 shrink-0"
                        />
                      ) : (
                        <XCircle
                          size={16}
                          className="text-red-500 mt-0.5 shrink-0"
                        />
                      )}
                      <span>{item.name}</span>
                    </p>
                    {!item.passed && showOutputDiff && (
                      <div className="ml-6 mt-1 text-xs space-y-1">
                        <p>
                          <span className="font-semibold">Expected:</span>{" "}
                          <code className="bg-slate-100 px-1 rounded">
                            {item.expectedOutput}
                          </code>
                        </p>
                        <p>
                          <span className="font-semibold">Actual:</span>{" "}
                          <code className="bg-slate-100 px-1 rounded">
                            {item.actualOutput}
                          </code>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
              {(stepCheckSummary.hiddenSummary?.total || 0) > 0 && (
                <p className="text-xs text-slate-500">
                  Hidden checks: {stepCheckSummary.hiddenSummary.passed}/
                  {stepCheckSummary.hiddenSummary.total}
                </p>
              )}
            </section>
          )}
        </div>

        <div
          role="separator"
          onMouseDown={() => {
            isDraggingRef.current = true;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
          }}
          className="w-1.5 shrink-0 cursor-col-resize bg-slate-700 hover:bg-blue-500 transition-colors"
        />

        {/* Editor + output */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-[3] min-h-0">
            <Editor
              language={activeLanguage}
              value={activeCode}
              onChange={(value) =>
                setCodeByLanguage((prev) => ({
                  ...prev,
                  [activeLanguage]: value ?? "",
                }))
              }
              onMount={(editor, monaco) => {
                try {
                  editor.addCommand(
                    monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
                    () => checkRef.current?.(),
                  );
                  editor.addCommand(
                    monaco.KeyMod.Shift | monaco.KeyCode.Enter,
                    () => runRef.current?.(),
                  );
                } catch (_e) {}
              }}
              theme="vs-dark"
              height="100%"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 12 },
              }}
            />
          </div>

          <div className="flex-[2] min-h-0 flex flex-col border-t border-slate-700">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#161925] text-xs text-slate-300">
              <span className="font-semibold">
                {isHtml ? "Live preview" : "Output"}
              </span>
              {!isHtml && runState.lines.length > 0 && (
                <button
                  onClick={() => setRunState({ status: "idle", lines: [] })}
                  className="text-slate-400 hover:text-white"
                >
                  Clear
                </button>
              )}
            </div>
            {isHtml ? (
              <iframe
                title="Preview"
                sandbox="allow-scripts"
                srcDoc={buildPreviewDocument(
                  activeLanguage,
                  previewCode,
                  activeStep?.preview_html,
                )}
                className="flex-1 w-full bg-white"
              />
            ) : (
              <pre className="flex-1 overflow-auto p-3 text-xs font-mono bg-[#0b0d14] whitespace-pre-wrap">
                {runState.status === "running" ? (
                  <span className="text-slate-400 inline-flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Running...
                  </span>
                ) : runState.lines.length ? (
                  runState.lines.map((line, index) => (
                    <span
                      key={index}
                      className={`block ${
                        line.type === "error"
                          ? "text-red-400"
                          : line.type === "info"
                            ? "text-slate-500"
                            : "text-slate-200"
                      }`}
                    >
                      {line.text}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">
                    Click Run to see the output of your code here.
                  </span>
                )}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-t border-slate-700 bg-[#161925]">
        <button
          onClick={runCode}
          disabled={status === "RUNNING" || runState.status === "running"}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50"
        >
          <Play size={14} /> {isHtml ? "Refresh preview" : "Run"}
        </button>
        {isStepMode && (
          <button
            onClick={checkStepCode}
            disabled={status === "RUNNING"}
            className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
          >
            Check Your Code
          </button>
        )}
        <button
          onClick={submitSolution}
          disabled={status === "RUNNING"}
          className="px-3 py-2 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          Submit Solution
        </button>
        <button onClick={resetCode} className={`${darkBtn} !py-2 !text-sm`}>
          <RotateCcw size={14} /> Reset code
        </button>
        <span className="ml-auto text-xs text-slate-500 hidden md:block">
          Ctrl+Enter: check - Shift+Enter: run
        </span>
      </div>
    </div>
  );
}
