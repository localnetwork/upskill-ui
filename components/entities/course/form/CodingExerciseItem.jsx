"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import BaseApi from "@/lib/api/_base.api";
import {
  DEFAULT_CSS_PREVIEW_HTML,
  buildPreviewDocument,
} from "@/lib/services/codingPreview";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const AVAILABLE_LANGUAGES = [
  "html",
  "css",
  "javascript",
  "typescript",
  "python",
  "java",
  "php",
  "go",
  "csharp",
  "c",
  "cpp",
  "ruby",
  "rust",
  "kotlin",
  "swift",
  "sql",
];

const LANGUAGE_LABELS = {
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  java: "Java",
  php: "PHP",
  go: "Go",
  csharp: "C#",
  c: "C",
  cpp: "C++",
  ruby: "Ruby",
  rust: "Rust",
  kotlin: "Kotlin",
  swift: "Swift",
  sql: "SQL",
};

const languageLabel = (language) =>
  LANGUAGE_LABELS[language] || String(language || "").toUpperCase();

const MARKUP_LANGUAGES = ["html", "css"];

const CSS_QUICK_CHECKS = [
  {
    name: "Styles an element with a color",
    type: "regex",
    value: "\\{[^}]*\\bcolor\\s*:\\s*[^;}]+",
  },
  {
    name: "Sets a background",
    type: "regex",
    value: "\\{[^}]*\\bbackground(-color)?\\s*:\\s*[^;}]+",
  },
  {
    name: "Sets a font-size",
    type: "regex",
    value: "\\{[^}]*\\bfont-size\\s*:\\s*[^;}]+",
  },
  { name: "Uses flexbox", type: "regex", value: "display\\s*:\\s*(inline-)?flex" },
  { name: "Adds padding or margin", type: "regex", value: "\\b(padding|margin)\\s*:" },
];

const CSS_TEMPLATE = "/* Write your CSS here */\n";

const CHECK_TYPES = [
  {
    value: "contains",
    label: "Code contains",
    help: "Passes when the learner's code contains this text.",
    placeholder: "<h1>Hello</h1>",
  },
  {
    value: "regex",
    label: "Code matches pattern (regex)",
    help: "Flexible match. Example: <h1[^>]*>\\s*\\S+ means an h1 with any text.",
    placeholder: "<h1[^>]*>\\s*\\S+",
  },
  {
    value: "exact",
    label: "Code is exactly",
    help: "Passes only when the whole code equals this text.",
    placeholder: "<p>Full expected code</p>",
  },
  {
    value: "output",
    label: "Program output is",
    help: "Runs the code and compares printed output (not available for HTML).",
    placeholder: "Hello, world",
  },
];

const HTML_QUICK_CHECKS = [
  { name: "Has an <h1> with text", type: "regex", value: "<h1[^>]*>\\s*\\S+" },
  { name: "Has a paragraph", type: "regex", value: "<p[^>]*>\\s*\\S+" },
  {
    name: "Has a link with href",
    type: "regex",
    value: "<a\\s[^>]*href=[\"'][^\"']+[\"']",
  },
  {
    name: "Has an image with alt",
    type: "regex",
    value: "<img\\s[^>]*alt=[\"'][^\"']+[\"']",
  },
  { name: "Has a list with items", type: "regex", value: "<(ul|ol)[^>]*>\\s*<li" },
];

const HTML_TEMPLATE =
  "<!DOCTYPE html>\n<html>\n  <body>\n    \n  </body>\n</html>";

const INPUT =
  "w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0056D2]/40";
const BTN =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50";

const newId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

function parseStarterCode(value) {
  const fallback = {
    languages: ["html"],
    hints: [],
    step_challenges: {},
    metadata: {},
  };
  if (!value) return fallback;
  try {
    return typeof value === "object" ? value : JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function parseMultilineList(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function checkToValidator(check) {
  const base = {
    id: check.id,
    name: check.name || "Check",
    visibility: check.visibility || "VISIBLE",
    expected_output: check.value,
    input: check.input || "",
  };
  switch (check.type) {
    case "regex":
      return { ...base, mode: "CODE_INCLUDES", comparison_mode: "REGEX" };
    case "exact":
      return { ...base, mode: "EXACT_CODE", comparison_mode: "EXACT" };
    case "output":
      return { ...base, mode: "RUN_OUTPUT", comparison_mode: "EXACT" };
    default:
      return { ...base, mode: "CODE_INCLUDES", comparison_mode: "INCLUDES" };
  }
}

function validatorToCheck(validator, index) {
  const mode = String(validator?.mode || "CODE_INCLUDES").toUpperCase();
  const comparison = String(
    validator?.comparison_mode || validator?.comparisonMode || "EXACT",
  ).toUpperCase();
  let type = "contains";
  if (mode === "RUN_OUTPUT") type = "output";
  else if (mode === "EXACT_CODE") type = "exact";
  else if (comparison === "REGEX") type = "regex";
  return {
    id: validator?.id || newId("check"),
    name: validator?.name || `Check ${index + 1}`,
    type,
    value: String(validator?.expected_output ?? validator?.expectedOutput ?? ""),
    input: String(validator?.input || ""),
    visibility: validator?.visibility || "VISIBLE",
  };
}

function parseStepHints(value) {
  return String(value || "")
    .split(/\n\s*---\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

// Converts a stored step (new `validators` or legacy single expected value) into editable form.
function hydrateStep(step, index) {
  let checks = [];
  if (Array.isArray(step?.validators) && step.validators.length) {
    checks = step.validators.map(validatorToCheck);
  } else if (step?.expected_output || step?.expectedOutput) {
    checks = [
      validatorToCheck(
        {
          name: "Step check",
          mode: step.validation_mode || step.validationMode,
          comparison_mode: step.comparison_mode || step.comparisonMode,
          expected_output: step.expected_output ?? step.expectedOutput,
          input: step.input,
        },
        0,
      ),
    ];
  }
  return {
    id: step?.id || newId("step"),
    title: step?.title || `Step ${index + 1}`,
    instruction: step?.instruction || step?.instructions || "",
    starter_code: step?.starter_code || step?.starterCode || "",
    preview_html: step?.preview_html || step?.previewHtml || "",
    hintsText: (Array.isArray(step?.hints) ? step.hints : [])
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .join("\n---\n"),
    checks,
  };
}

function serializeStep(step, index) {
  const validators = step.checks
    .filter((check) => String(check.value || "").trim())
    .map(checkToValidator);
  const first = validators[0];
  return {
    id: step.id,
    step_number: index + 1,
    title: step.title || `Step ${index + 1}`,
    instruction: step.instruction,
    starter_code: step.starter_code,
    ...(step.preview_html ? { preview_html: step.preview_html } : {}),
    hints: parseStepHints(step.hintsText),
    validators,
    // kept for older readers of the payload
    validation_mode: first?.mode || "CODE_INCLUDES",
    comparison_mode: first?.comparison_mode || "INCLUDES",
    expected_output: first?.expected_output || "",
  };
}

function normalizeMarkup(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .trim()
    .toLowerCase();
}

// Mirrors the backend source comparison so instructors can test checks before publishing.
function runLocalCheck(check, code, language) {
  if (check.type === "output") return null;
  const isMarkup = MARKUP_LANGUAGES.includes(language);
  let source = String(code || "").trim();
  let expected = String(check.value || "").trim();
  if (!expected) return false;
  if (check.type === "regex") {
    try {
      return new RegExp(expected, isMarkup ? "is" : "").test(source);
    } catch (_error) {
      return false;
    }
  }
  if (isMarkup) {
    source = normalizeMarkup(source);
    expected = normalizeMarkup(expected);
  }
  return check.type === "exact"
    ? source === expected
    : source.includes(expected);
}

function isValidRegex(value) {
  try {
    new RegExp(value);
    return true;
  } catch (_error) {
    return false;
  }
}

export function buildMinimalCodingPayload({
  languages,
  hintsDraft,
  stepChallengesByLanguage,
  status,
}) {
  return {
    languages,
    hints: parseMultilineList(hintsDraft),
    step_challenges: stepChallengesByLanguage || {},
    metadata: {
      status: status || "Draft",
    },
  };
}

export default function CodingExerciseItem({ exercise, onClose, onSave }) {
  const parsedAsset = useMemo(
    () => parseStarterCode(exercise?.asset || null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const initialLanguages =
    Array.isArray(parsedAsset.languages) && parsedAsset.languages.length
      ? parsedAsset.languages
      : ["html"];

  const [title, setTitle] = useState(
    exercise?.title || "Untitled Step Challenge",
  );
  const [languages, setLanguages] = useState(initialLanguages);
  const [activeLanguage, setActiveLanguage] = useState(initialLanguages[0]);
  const [hintsDraft, setHintsDraft] = useState(
    Array.isArray(parsedAsset.hints) ? parsedAsset.hints.join("\n") : "",
  );
  const [stepsByLanguage, setStepsByLanguage] = useState(() => {
    const raw =
      parsedAsset.step_challenges &&
      typeof parsedAsset.step_challenges === "object"
        ? parsedAsset.step_challenges
        : {};
    const result = {};
    for (const [language, list] of Object.entries(raw)) {
      result[language] = (Array.isArray(list) ? list : [])
        .slice()
        .sort(
          (a, b) =>
            Number(a?.step_number || a?.stepNumber || 0) -
            Number(b?.step_number || b?.stepNumber || 0),
        )
        .map(hydrateStep);
    }
    return result;
  });
  const [selectedStepId, setSelectedStepId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const rootRef = useRef(null);

  const steps = useMemo(
    () => stepsByLanguage[activeLanguage] || [],
    [stepsByLanguage, activeLanguage],
  );
  const selectedStep =
    steps.find((step) => step.id === selectedStepId) || steps[0] || null;
  const isMarkup = MARKUP_LANGUAGES.includes(activeLanguage);
  const checkTypes = CHECK_TYPES.filter(
    (type) => !(type.value === "output" && isMarkup),
  );
  const canSave = Boolean(title.trim()) && languages.length > 0;

  useEffect(() => {
    const onChange = () =>
      setIsFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await rootRef.current?.requestFullscreen();
      }
    } catch (_error) {
      setMessage({
        type: "error",
        text: "Your browser blocked fullscreen mode.",
      });
    }
  };

  const setSteps = (updater) => {
    setStepsByLanguage((prev) => ({
      ...prev,
      [activeLanguage]: updater(prev[activeLanguage] || []),
    }));
    setTestResults(null);
  };

  const updateStep = (id, patch) =>
    setSteps((list) =>
      list.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );

  const addStep = () => {
    const step = {
      id: newId("step"),
      title: `Step ${steps.length + 1}`,
      instruction: "",
      starter_code:
        isMarkup && !steps.length
          ? activeLanguage === "css"
            ? CSS_TEMPLATE
            : HTML_TEMPLATE
          : "",
      preview_html:
        activeLanguage === "css"
          ? steps[steps.length - 1]?.preview_html || DEFAULT_CSS_PREVIEW_HTML
          : "",
      hintsText: "",
      checks: [],
    };
    setSteps((list) => [...list, step]);
    setSelectedStepId(step.id);
  };

  const deleteStep = (id) => {
    setSteps((list) => list.filter((item) => item.id !== id));
    setSelectedStepId(null);
  };

  const moveStep = (id, direction) =>
    setSteps((list) => {
      const index = list.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const addCheck = (preset) => {
    if (!selectedStep) return;
    const check = {
      id: newId("check"),
      name: preset?.name || `Check ${selectedStep.checks.length + 1}`,
      type: preset?.type || "contains",
      value: preset?.value || "",
      input: "",
      visibility: "VISIBLE",
    };
    updateStep(selectedStep.id, { checks: [...selectedStep.checks, check] });
  };

  const updateCheck = (checkId, patch) =>
    updateStep(selectedStep.id, {
      checks: selectedStep.checks.map((check) =>
        check.id === checkId ? { ...check, ...patch } : check,
      ),
    });

  const removeCheck = (checkId) =>
    updateStep(selectedStep.id, {
      checks: selectedStep.checks.filter((check) => check.id !== checkId),
    });

  const toggleLanguage = (language) => {
    setLanguages((prev) => {
      const exists = prev.includes(language);
      if (exists && prev.length === 1) return prev;
      const next = exists
        ? prev.filter((item) => item !== language)
        : [...prev, language];
      if (!next.includes(activeLanguage)) setActiveLanguage(next[0]);
      return next;
    });
  };

  const testChecks = () => {
    if (!selectedStep) return;
    setTestResults(
      selectedStep.checks.map((check) => ({
        id: check.id,
        passed: runLocalCheck(check, selectedStep.starter_code, activeLanguage),
      })),
    );
  };

  const validate = () => {
    for (const language of languages) {
      const list = stepsByLanguage[language] || [];
      for (let i = 0; i < list.length; i += 1) {
        const step = list[i];
        const label = `${language.toUpperCase()} - Step ${i + 1}`;
        if (!String(step.instruction || "").trim()) {
          return `${label}: add an instruction for the learner.`;
        }
        const filled = step.checks.filter((c) => String(c.value || "").trim());
        if (!filled.length) {
          return `${label}: add at least one check so the answer can be validated.`;
        }
        const badRegex = filled.find(
          (c) => c.type === "regex" && !isValidRegex(c.value),
        );
        if (badRegex) {
          return `${label}: "${badRegex.name}" has an invalid regex pattern.`;
        }
      }
    }
    return "";
  };

  const saveExercise = async (status = "Draft") => {
    if (!canSave) return;
    const problem = status === "Published" ? validate() : "";
    if (problem) {
      setMessage({ type: "error", text: problem });
      return;
    }
    try {
      setSaving(true);
      setMessage(null);
      const stepChallengesByLanguage = {};
      for (const language of languages) {
        stepChallengesByLanguage[language] = (
          stepsByLanguage[language] || []
        ).map(serializeStep);
      }
      const codingStarterCode = buildMinimalCodingPayload({
        languages,
        hintsDraft,
        stepChallengesByLanguage,
        status,
      });
      const firstStep = stepChallengesByLanguage[languages[0]]?.[0];
      const response = await BaseApi.put(
        `${process.env.NEXT_PUBLIC_API_URL}/course-curriculums/${exercise.id}`,
        {
          title,
          description: exercise?.curriculum_description || "",
          codingInstructions: firstStep?.instruction || "",
          codingStarterCode,
        },
      );
      onSave?.(response?.data?.data);
      setMessage({
        type: "success",
        text: status === "Published" ? "Exercise published." : "Draft saved.",
      });
    } catch (error) {
      console.error("Error saving step challenge:", error);
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          error?.data?.message ||
          "Could not save the exercise. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const stepIndex = selectedStep
    ? steps.findIndex((step) => step.id === selectedStep.id)
    : -1;
  const editorHeight = isFullscreen ? "55vh" : "320px";

  return (
    <div
      ref={rootRef}
      className={`relative bg-white dark:bg-slate-900 p-6 space-y-6 ${
        isFullscreen
          ? "overflow-y-auto h-screen w-screen"
          : "rounded-2xl border border-slate-200/70 dark:border-slate-700"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Coding Exercise Builder
          </p>
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {title || "Untitled Step Challenge"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Build the exercise one step at a time. Each step has an instruction,
            starter code, and checks that decide if the learner passed.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={toggleFullscreen} className={BTN}>
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            {isFullscreen ? "Exit fullscreen" : "Edit in fullscreen"}
          </button>
          <button type="button" onClick={onClose} className={BTN}>
            Close
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          1. Basics
        </h4>
        <label className="block">
          <span className="text-xs text-slate-500">Exercise title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`${INPUT} mt-1`}
          />
        </label>
        <div>
          <p className="text-xs text-slate-500 mb-2">
            Languages learners can use (pick HTML for an HTML course)
          </p>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_LANGUAGES.map((language) => (
              <button
                key={language}
                type="button"
                onClick={() => toggleLanguage(language)}
                className={`px-3 py-1.5 rounded-full border text-xs ${
                  languages.includes(language)
                    ? "bg-[#0056D2] text-white border-[#0056D2]"
                    : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200"
                }`}
              >
                {languageLabel(language)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            2. Steps
          </h4>
          {languages.length > 1 && (
            <div className="flex gap-2">
              {languages.map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => {
                    setActiveLanguage(language);
                    setSelectedStepId(null);
                    setTestResults(null);
                  }}
                  className={`px-3 py-1 rounded border text-xs ${
                    activeLanguage === language
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {languageLabel(language)}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-4">
          <div className="space-y-2">
            {steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  setSelectedStepId(step.id);
                  setTestResults(null);
                }}
                className={`w-full text-left rounded-lg border px-3 py-2 text-sm ${
                  selectedStep?.id === step.id
                    ? "border-[#0056D2] bg-[#0056D2]/10 text-[#0056D2]"
                    : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                <span className="font-semibold">{index + 1}.</span>{" "}
                {step.title || `Step ${index + 1}`}
                <span className="block text-[11px] text-slate-500">
                  {step.checks.length} check{step.checks.length === 1 ? "" : "s"}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={addStep}
              className={`${BTN} w-full justify-center`}
            >
              <Plus size={14} /> Add step
            </button>
          </div>

          {selectedStep ? (
            <div className="space-y-4 min-w-0">
              <div className="flex flex-wrap items-end gap-2">
                <label className="flex-1 min-w-[200px]">
                  <span className="text-xs text-slate-500">Step title</span>
                  <input
                    value={selectedStep.title}
                    onChange={(e) =>
                      updateStep(selectedStep.id, { title: e.target.value })
                    }
                    className={`${INPUT} mt-1`}
                  />
                </label>
                <button
                  type="button"
                  title="Move up"
                  disabled={stepIndex <= 0}
                  onClick={() => moveStep(selectedStep.id, -1)}
                  className={BTN}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  title="Move down"
                  disabled={stepIndex >= steps.length - 1}
                  onClick={() => moveStep(selectedStep.id, 1)}
                  className={BTN}
                >
                  <ArrowDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteStep(selectedStep.id)}
                  className={`${BTN} !border-red-300 !text-red-600`}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>

              <label className="block">
                <span className="text-xs text-slate-500">
                  Instruction shown to the learner
                </span>
                <textarea
                  rows={3}
                  value={selectedStep.instruction}
                  onChange={(e) =>
                    updateStep(selectedStep.id, { instruction: e.target.value })
                  }
                  placeholder='e.g. "Add an h1 heading that says Welcome inside the body."'
                  className={`${INPUT} mt-1`}
                />
              </label>

              <div>
                <p className="text-xs text-slate-500 mb-1">
                  Starter code (what the learner sees first
                  {isMarkup ? "; the preview on the right updates live" : ""})
                </p>
                <div className={`grid gap-3 ${isMarkup ? "xl:grid-cols-2" : ""}`}>
                  <div className="rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
                    <Editor
                      key={`${activeLanguage}-${selectedStep.id}`}
                      language={activeLanguage}
                      value={selectedStep.starter_code}
                      onChange={(value) =>
                        updateStep(selectedStep.id, {
                          starter_code: value ?? "",
                        })
                      }
                      theme="vs-dark"
                      height={editorHeight}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        wordWrap: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>
                  {isMarkup && (
                    <div className="flex flex-col gap-2">
                      <iframe
                        title="Live preview"
                        sandbox=""
                        srcDoc={buildPreviewDocument(
                          activeLanguage,
                          selectedStep.starter_code,
                          selectedStep.preview_html,
                        )}
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white"
                        style={{ height: editorHeight }}
                      />
                    </div>
                  )}
                </div>
                {activeLanguage === "css" && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 mb-1">
                      Sample HTML the CSS is applied to (shown in the preview
                      for learners)
                    </p>
                    <div className="rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600">
                      <Editor
                        key={`preview-html-${selectedStep.id}`}
                        language="html"
                        value={selectedStep.preview_html || ""}
                        onChange={(value) =>
                          updateStep(selectedStep.id, {
                            preview_html: value ?? "",
                          })
                        }
                        theme="vs-dark"
                        height={220}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          wordWrap: "on",
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <label className="block">
                <span className="text-xs text-slate-500">
                  Hints for this step (optional). Learners reveal them one at a
                  time, so put the gentlest first and the answer last. Separate
                  hints with a line containing only ---
                </span>
                <textarea
                  rows={5}
                  value={selectedStep.hintsText || ""}
                  onChange={(e) =>
                    updateStep(selectedStep.id, { hintsText: e.target.value })
                  }
                  placeholder={"Use the <h1> tag.\n---\nAnswer:\n<h1>Welcome</h1>"}
                  className={`${INPUT} mt-1 font-mono`}
                />
              </label>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Checks - how we validate the learner&apos;s answer
                  </p>
                  <p className="text-xs text-slate-500">
                    The step is passed only when every check passes.
                    {isMarkup &&
                      " For HTML, spacing, line breaks and letter case are ignored."}
                  </p>
                </div>

                {selectedStep.checks.map((check) => {
                  const type = CHECK_TYPES.find((t) => t.value === check.type);
                  const result = testResults?.find((r) => r.id === check.id);
                  return (
                    <div
                      key={check.id}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2"
                    >
                      <div className="grid md:grid-cols-[1fr_220px_auto] gap-2">
                        <input
                          value={check.name}
                          onChange={(e) =>
                            updateCheck(check.id, { name: e.target.value })
                          }
                          placeholder="Message shown to learner, e.g. Add an h1 heading"
                          className={INPUT}
                        />
                        <select
                          value={check.type}
                          onChange={(e) =>
                            updateCheck(check.id, { type: e.target.value })
                          }
                          className={INPUT}
                        >
                          {checkTypes.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeCheck(check.id)}
                          className={`${BTN} !border-red-300 !text-red-600`}
                          title="Remove check"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={check.value}
                        onChange={(e) =>
                          updateCheck(check.id, { value: e.target.value })
                        }
                        placeholder={type?.placeholder}
                        className={`${INPUT} font-mono`}
                      />
                      {check.type === "output" && (
                        <textarea
                          rows={2}
                          value={check.input}
                          onChange={(e) =>
                            updateCheck(check.id, { input: e.target.value })
                          }
                          placeholder="Optional input given to the program (stdin)"
                          className={`${INPUT} font-mono`}
                        />
                      )}
                      <p className="text-xs text-slate-500">{type?.help}</p>
                      {check.type === "regex" &&
                        check.value &&
                        !isValidRegex(check.value) && (
                          <p className="text-xs text-red-600">
                            This is not a valid regex pattern.
                          </p>
                        )}
                      {result && (
                        <p
                          className={`text-xs font-semibold ${
                            result.passed === null
                              ? "text-slate-500"
                              : result.passed
                                ? "text-emerald-600"
                                : "text-red-600"
                          }`}
                        >
                          {result.passed === null
                            ? "Output checks can only be tested by running the code as a learner."
                            : result.passed
                              ? "Passes with the editor code above"
                              : "Does not pass with the editor code above"}
                        </p>
                      )}
                    </div>
                  );
                })}

                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => addCheck()} className={BTN}>
                    <Plus size={14} /> Add check
                  </button>
                  <button
                    type="button"
                    onClick={testChecks}
                    disabled={!selectedStep.checks.length}
                    className={BTN}
                    title="Run the checks against the code in the editor. Paste the solution in the editor to confirm it passes."
                  >
                    Test checks on editor code
                  </button>
                </div>

                {isMarkup && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">
                      Quick checks for {languageLabel(activeLanguage)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(activeLanguage === "css"
                        ? CSS_QUICK_CHECKS
                        : HTML_QUICK_CHECKS
                      ).map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => addCheck(preset)}
                          className="px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-600 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          + {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-8 text-center text-sm text-slate-500">
              No steps yet for <strong>{activeLanguage}</strong>. Click{" "}
              <strong>Add step</strong> to create the first one.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          3. General hints (optional)
        </h4>
        <p className="text-xs text-slate-500">
          Shown only for steps that have no hints of their own.
        </p>
        <textarea
          rows={4}
          value={hintsDraft}
          onChange={(e) => setHintsDraft(e.target.value)}
          className={INPUT}
          placeholder="One hint per line"
        />
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          4. Save
        </h4>
        {message && (
          <p
            className={`text-sm rounded-lg px-3 py-2 ${
              message.type === "error"
                ? "bg-red-50 text-red-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {message.text}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => saveExercise("Draft")}
            disabled={!canSave || saving}
            className="px-4 py-2 rounded bg-slate-900 text-white text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={() => saveExercise("Published")}
            disabled={!canSave || saving}
            className="px-4 py-2 rounded bg-emerald-600 text-white text-sm disabled:opacity-50"
          >
            Publish Exercise
          </button>
        </div>
      </section>
    </div>
  );
}
