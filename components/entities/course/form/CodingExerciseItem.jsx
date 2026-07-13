"use client";

import { useMemo, useState } from "react";
import BaseApi from "@/lib/api/_base.api";

const AVAILABLE_LANGUAGES = [
  "html",
  "javascript",
  "typescript",
  "python",
  "java",
  "php",
  "go",
  "csharp",
];

function parseStarterCode(value) {
  if (!value) {
    return {
      languages: ["html"],
      hints: [],
      step_challenges: {},
      metadata: {},
    };
  }

  try {
    if (typeof value === "object") return value;
    return JSON.parse(value);
  } catch (_error) {
    return {
      languages: ["html"],
      hints: [],
      step_challenges: {},
      metadata: {},
    };
  }
}

function parseMultilineList(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createEmptyStep(stepNumber = 1) {
  return {
    id: `step-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: `Step ${stepNumber}`,
    step_number: stepNumber,
    instruction: "",
    starter_code: "",
    validation_mode: "CODE_INCLUDES",
    expected_output: "",
    input: "",
    comparison_mode: "EXACT",
  };
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
  const parsedAsset = parseStarterCode(exercise?.asset || null);
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
  const [stepChallengesByLanguage, setStepChallengesByLanguage] = useState(
    parsedAsset.step_challenges &&
      typeof parsedAsset.step_challenges === "object"
      ? parsedAsset.step_challenges
      : {},
  );
  const [saving, setSaving] = useState(false);

  const currentSteps = useMemo(
    () =>
      Array.isArray(stepChallengesByLanguage[activeLanguage])
        ? [...stepChallengesByLanguage[activeLanguage]].sort(
            (a, b) => Number(a?.step_number || 0) - Number(b?.step_number || 0),
          )
        : [],
    [stepChallengesByLanguage, activeLanguage],
  );

  const canSave = Boolean(title.trim()) && languages.length > 0;

  const toggleLanguage = (language) => {
    setLanguages((prev) => {
      const exists = prev.includes(language);
      if (exists && prev.length === 1) return prev;
      const next = exists
        ? prev.filter((item) => item !== language)
        : [...prev, language];
      if (!next.includes(activeLanguage)) {
        setActiveLanguage(next[0]);
      }
      return next;
    });
  };

  const addStep = () => {
    setStepChallengesByLanguage((prev) => {
      const current = Array.isArray(prev[activeLanguage])
        ? prev[activeLanguage]
        : [];
      return {
        ...prev,
        [activeLanguage]: [...current, createEmptyStep(current.length + 1)],
      };
    });
  };

  const updateStep = (id, patch) => {
    setStepChallengesByLanguage((prev) => ({
      ...prev,
      [activeLanguage]: (prev[activeLanguage] || []).map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  };

  const deleteStep = (id) => {
    setStepChallengesByLanguage((prev) => {
      const remaining = (prev[activeLanguage] || []).filter(
        (item) => item.id !== id,
      );
      const normalized = remaining.map((item, index) => ({
        ...item,
        step_number: index + 1,
        title: item.title || `Step ${index + 1}`,
      }));
      return {
        ...prev,
        [activeLanguage]: normalized,
      };
    });
  };

  const saveExercise = async (status = "Draft") => {
    if (!canSave) return;
    try {
      setSaving(true);
      const codingStarterCode = buildMinimalCodingPayload({
        languages,
        hintsDraft,
        stepChallengesByLanguage,
        status,
      });
      const firstStep = currentSteps[0];
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
    } catch (error) {
      console.error("Error saving step challenge:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative rounded-2xl border border-slate-200/70 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Step-by-Step Coding Builder
          </p>
          <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {title || "Untitled Step Challenge"}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Minimal FreeCodeCamp-like authoring flow.
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800"
        >
          Close
        </button>
      </div>

      <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          1. Basic Info
        </h4>
        <label className="block">
          <span className="text-xs text-slate-500">Exercise Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
          />
        </label>
        <div>
          <p className="text-xs text-slate-500 mb-2">Languages</p>
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
                {language}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            2. Step Builder ({activeLanguage})
          </h4>
          <button
            type="button"
            onClick={addStep}
            className="px-3 py-1 rounded border text-xs"
          >
            Add Step
          </button>
        </div>

        {currentSteps.length ? (
          <div className="space-y-3">
            {currentSteps.map((step, index) => (
              <div
                key={step.id}
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2 bg-white dark:bg-slate-900"
              >
                <div className="grid md:grid-cols-4 gap-2">
                  <input
                    value={step.title || ""}
                    onChange={(e) =>
                      updateStep(step.id, { title: e.target.value })
                    }
                    className="rounded border px-2 py-1 text-xs bg-white dark:bg-slate-900"
                    placeholder={`Step ${index + 1} title`}
                  />
                  <input
                    type="number"
                    min={1}
                    value={Number(step.step_number || index + 1)}
                    onChange={(e) =>
                      updateStep(step.id, {
                        step_number: Number(e.target.value || index + 1),
                      })
                    }
                    className="rounded border px-2 py-1 text-xs bg-white dark:bg-slate-900"
                  />
                  <select
                    value={step.validation_mode || "CODE_INCLUDES"}
                    onChange={(e) =>
                      updateStep(step.id, { validation_mode: e.target.value })
                    }
                    className="rounded border px-2 py-1 text-xs bg-white dark:bg-slate-900"
                  >
                    <option value="CODE_INCLUDES">Code Includes</option>
                    <option value="EXACT_CODE">Exact Code</option>
                    <option value="RUN_OUTPUT">Run Output</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => deleteStep(step.id)}
                    className="rounded border border-red-300 text-red-600 px-2 py-1 text-xs"
                  >
                    Delete
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={step.instruction || ""}
                  onChange={(e) =>
                    updateStep(step.id, { instruction: e.target.value })
                  }
                  placeholder='Instruction (e.g. "Find line 1 and type Welcome to freeCodeCamp")'
                  className="w-full rounded border px-2 py-1 text-xs bg-white dark:bg-slate-900"
                />
                <textarea
                  rows={4}
                  value={step.starter_code || ""}
                  onChange={(e) =>
                    updateStep(step.id, { starter_code: e.target.value })
                  }
                  placeholder="Starter code for this step"
                  className="w-full rounded border px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900"
                />
                <div className="grid md:grid-cols-3 gap-2">
                  <textarea
                    rows={2}
                    value={step.expected_output || ""}
                    onChange={(e) =>
                      updateStep(step.id, { expected_output: e.target.value })
                    }
                    placeholder="Expected value"
                    className="w-full rounded border px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900"
                  />
                  <textarea
                    rows={2}
                    value={step.input || ""}
                    onChange={(e) =>
                      updateStep(step.id, { input: e.target.value })
                    }
                    placeholder="Optional stdin input"
                    className="w-full rounded border px-2 py-1 text-xs font-mono bg-white dark:bg-slate-900"
                  />
                  <select
                    value={step.comparison_mode || "EXACT"}
                    onChange={(e) =>
                      updateStep(step.id, { comparison_mode: e.target.value })
                    }
                    className="rounded border px-2 py-1 text-xs bg-white dark:bg-slate-900"
                  >
                    <option value="EXACT">Exact</option>
                    <option value="INCLUDES">Includes</option>
                    <option value="REGEX">Regex</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            No steps yet for <strong>{activeLanguage}</strong>.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          3. Hints
        </h4>
        <textarea
          rows={5}
          value={hintsDraft}
          onChange={(e) => setHintsDraft(e.target.value)}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-3 text-sm"
          placeholder={"Hint 1\nHint 2\nHint 3"}
        />
      </section>

      <section className="rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          4. Publish
        </h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => saveExercise("Draft")}
            disabled={!canSave || saving}
            className="px-4 py-2 rounded bg-slate-900 text-white text-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button
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
