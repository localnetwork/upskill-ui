import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import BaseApi from "@/lib/api/_base.api";

const STATUS_COLORS = {
  IDLE: "bg-gray-100 text-gray-700",
  RUNNING: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
};

function getDraftKey(lectureId, language) {
  return `coding-draft:${lectureId}:${language}`;
}

function getSortedSteps(asset, language) {
  const entries = Array.isArray(asset?.step_challenges?.[language])
    ? asset.step_challenges[language]
    : [];
  return [...entries].sort(
    (a, b) =>
      Number(a?.step_number || a?.stepNumber || 0) -
      Number(b?.step_number || b?.stepNumber || 0),
  );
}

export default function CodingExercisePreview({ lecture, setCourse }) {
  const [activeLanguage, setActiveLanguage] = useState(
    lecture?.asset?.languages?.[0] || "javascript",
  );
  const [codeByLanguage, setCodeByLanguage] = useState({});
  const [status, setStatus] = useState("IDLE");
  const [stepCheckSummary, setStepCheckSummary] = useState(null);
  const [currentStepNumber, setCurrentStepNumber] = useState(1);
  const [submissionError, setSubmissionError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resizerPercent, setResizerPercent] = useState(55);
  const isDraggingRef = useRef(false);
  const containerRef = useRef(null);

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
      stepChallenges.find(
        (step) =>
          Number(step?.step_number || step?.stepNumber || 0) === currentStepNumber,
      ) || stepChallenges[0]
    );
  }, [stepChallenges, currentStepNumber]);

  const hintItems = useMemo(
    () =>
      Array.isArray(lecture?.asset?.hints)
        ? lecture.asset.hints.map((item) => String(item || "").trim()).filter(Boolean)
        : [],
    [lecture?.asset?.hints],
  );

  useEffect(() => {
    if (!languages.includes(activeLanguage)) {
      setActiveLanguage(languages[0]);
    }
  }, [languages, activeLanguage]);

  useEffect(() => {
    const nextCodeByLanguage = {};
    for (const language of languages) {
      const draftKey = getDraftKey(lecture?.id, language);
      const saved = typeof window !== "undefined" ? localStorage.getItem(draftKey) : "";
      const firstStep = getSortedSteps(lecture?.asset || {}, language)[0];
      const starterFromStep = String(
        firstStep?.starter_code || firstStep?.starterCode || "",
      );
      nextCodeByLanguage[language] =
        saved !== null && saved !== undefined
          ? saved
          : starterFromStep || lecture?.asset?.starter_code?.[language] || "";
    }
    setCodeByLanguage(nextCodeByLanguage);
    setStatus("IDLE");
    setStepCheckSummary(null);
    setSubmissionError("");
    setCurrentStepNumber(1);
  }, [lecture?.id, languages.join("|")]);

  useEffect(() => {
    if (!lecture?.id || !activeLanguage) return;
    const currentCode = codeByLanguage[activeLanguage];
    if (currentCode === undefined) return;
    try {
      localStorage.setItem(getDraftKey(lecture.id, activeLanguage), currentCode);
    } catch (_error) {}
  }, [lecture?.id, activeLanguage, codeByLanguage]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const percent = Math.max(20, Math.min(80, Math.round((x / rect.width) * 100)));
      setResizerPercent(percent);
    };
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = "";
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const activeCode = codeByLanguage[activeLanguage] || "";

  const updateCurrentLectureCompletion = () => {
    setCourse((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((section) => ({
          ...section,
          curriculums: section.curriculums.map((curriculum) =>
            curriculum.id === lecture.id
              ? { ...curriculum, is_taken: true, completed: true, progress_pct: 100 }
              : curriculum,
          ),
        })),
      };
    });
  };

  const checkStepCode = async () => {
    if (!isStepMode || !activeStep) return;
    try {
      setSubmissionError("");
      setStepCheckSummary(null);
      setStatus("RUNNING");
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/course-curriculums/${lecture.id}/coding-step-check`,
        {
          language: activeLanguage,
          sourceCode: activeCode,
          stepNumber: Number(activeStep?.step_number || activeStep?.stepNumber || 1),
        },
      );
      const data = response?.data?.data || {};
      setStatus("COMPLETED");
      setStepCheckSummary(data?.summary || null);
      if (data?.next?.stepNumber && Number(data.next.stepNumber) !== currentStepNumber) {
        setCurrentStepNumber(Number(data.next.stepNumber));
        if (data?.next?.starterCode) {
          setCodeByLanguage((prev) => ({
            ...prev,
            [activeLanguage]: data.next.starterCode,
          }));
        }
      }
      if (data?.lessonCompleted) {
        updateCurrentLectureCompletion();
      }
    } catch (error) {
      setStatus("FAILED");
      setSubmissionError(
        error?.response?.data?.message || error?.message || "Unable to check code",
      );
    }
  };

  const submitSolution = async () => {
    try {
      setSubmissionError("");
      setStepCheckSummary(null);
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
        updateCurrentLectureCompletion();
      }
    } catch (error) {
      setStatus("FAILED");
      setSubmissionError(
        error?.response?.data?.message || error?.message || "Unable to submit code",
      );
    }
  };

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

  return (
    <div
      ref={containerRef}
      className={`bg-white w-full h-[500px] absolute top-0 left-0 ${isFullscreen ? "p-3" : "p-4"} overflow-hidden`}
    >
      <div className="h-full gap-4" style={{ display: "grid", gridTemplateColumns: `${resizerPercent}% 1fr` }}>

        <div className="border rounded p-4 overflow-y-auto">
          <h3 className="text-xl font-semibold mb-2">
            {lecture?.title || "Coding Exercise"}
          </h3>
          {isStepMode && activeStep ? (
            <>
              <p className="text-xs font-semibold text-[#0056D2] mb-2">
                Step {Number(activeStep?.step_number || activeStep?.stepNumber || 1)} of{" "}
                {stepChallenges.length}
              </p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {String(activeStep?.instruction || "")}
              </p>
            </>
          ) : (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
              This lesson has no step-by-step challenges configured yet.
            </p>
          )}

          <div className="mt-4">
            <p className="text-sm font-semibold mb-2">Hints</p>
            {hintItems.length ? (
              <div className="space-y-2">
                {hintItems.map((item, index) => (
                  <p key={`${index}-${item}`} className="text-xs border rounded p-2 bg-gray-50">
                    Hint {index + 1}: {item}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">No hints available.</p>
            )}
          </div>

          {submissionError ? (
            <p className="mt-4 text-xs text-red-600">{submissionError}</p>
          ) : null}

          {stepCheckSummary ? (
            <div className="mt-4 text-xs rounded border p-2 bg-gray-50 space-y-2">
              <p className="font-semibold">
                Result: {stepCheckSummary.allPassed ? "Step passed" : "Step not passed yet"}
              </p>
              <p>
                Passed {stepCheckSummary.passedChecks}/{stepCheckSummary.totalChecks}
              </p>
              <p>
                Hidden checks: {stepCheckSummary.hiddenSummary?.passed || 0}/
                {stepCheckSummary.hiddenSummary?.total || 0}
              </p>
              {(stepCheckSummary.visibleResults || []).map((item) => (
                <div key={item.id} className="border rounded p-2 bg-white">
                  <p className="font-semibold">
                    {item.name}: {item.passed ? "PASS" : "FAIL"}
                  </p>
                  {!item.passed ? (
                    <>
                      <p>
                        <span className="font-semibold">Expected:</span>{" "}
                        <code>{item.expectedOutput}</code>
                      </p>
                      <p>
                        <span className="font-semibold">Actual:</span>{" "}
                        <code>{item.actualOutput}</code>
                      </p>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div
          role="separator"
          onMouseDown={(e) => { isDraggingRef.current = true; document.body.style.cursor = 'col-resize'; }}
          className="mx-[-4px] cursor-col-resize"
          style={{ width: 8 }}
        />

        <div className="border rounded overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-gray-50 flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-2">
              {languages.map((language) => (
                <button
                  key={language}
                  onClick={() => setActiveLanguage(language)}
                  className={`px-2 py-1 border rounded text-xs ${activeLanguage === language ? "bg-black text-white" : "bg-white"}`}
                >
                  {language}
                </button>
              ))}
            </div>
            <span
              className={`ml-auto px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[status] || STATUS_COLORS.IDLE}`}
            >
              {status}
            </span>
            <button
              onClick={toggleFullscreen}
              className="px-2 py-1 border rounded text-xs hover:bg-gray-100"
            >
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          </div>

          <div className="flex-1 min-h-0">
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
                  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                    checkStepCode();
                  });
                  editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {
                    submitSolution();
                  });
                } catch (_e) {}
              }}
              theme="vs-dark"
              height="100%"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: "on",
                scrollBeyondLastLine: false,
              }}
            />
          </div>

          <div className="p-3 border-t space-y-3 bg-white">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={checkStepCode}
                disabled={!isStepMode || status === "RUNNING"}
                className="px-3 py-2 rounded text-sm bg-[#0056D2] text-white hover:bg-[#0046ab] disabled:opacity-50"
              >
                Check Your Code
              </button>
              <button
                onClick={submitSolution}
                disabled={status === "RUNNING"}
                className="px-3 py-2 rounded text-sm bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Submit Solution
              </button>
              <button
                onClick={() =>
                  setCodeByLanguage((prev) => ({
                    ...prev,
                    [activeLanguage]:
                      String(activeStep?.starter_code || activeStep?.starterCode || "") ||
                      lecture?.asset?.starter_code?.[activeLanguage] ||
                      "",
                  }))
                }
                className="px-3 py-2 rounded text-sm border hover:bg-gray-100"
              >
                Reset Step Code
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
