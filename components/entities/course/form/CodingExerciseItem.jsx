"use client";
import { useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import BaseApi from "@/lib/api/_base.api";

const AVAILABLE_LANGUAGES = [
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
      starter_code: {},
      expected_output: {},
      languages: [],
    };
  }

  try {
    if (typeof value === "object") {
      return value;
    }
    return JSON.parse(value);
  } catch (_error) {
    return {
      starter_code: {},
      expected_output: {},
      languages: [],
    };
  }
}

export default function CodingExerciseItem({ exercise, onClose, onSave }) {
  const parsedAsset = parseStarterCode(exercise?.asset?.starter_code ? exercise.asset : null);
  const initialLanguages = Array.isArray(exercise?.asset?.languages) && exercise.asset.languages.length
    ? exercise.asset.languages
    : Array.isArray(parsedAsset.languages) && parsedAsset.languages.length
      ? parsedAsset.languages
      : ["javascript"];

  const [instructions, setInstructions] = useState(exercise?.asset?.instructions || "");
  const [languages, setLanguages] = useState(initialLanguages);
  const [activeLanguage, setActiveLanguage] = useState(initialLanguages[0]);
  const [starterCodeByLanguage, setStarterCodeByLanguage] = useState(
    parsedAsset.starter_code || {},
  );
  const [expectedOutputByLanguage, setExpectedOutputByLanguage] = useState(
    parsedAsset.expected_output || {},
  );
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(
    () => Boolean(String(instructions || "").trim()) && languages.length > 0,
    [instructions, languages],
  );

  const toggleLanguage = (language) => {
    setLanguages((prev) => {
      const exists = prev.includes(language);
      if (exists && prev.length === 1) return prev;
      const next = exists ? prev.filter((item) => item !== language) : [...prev, language];
      if (!next.includes(activeLanguage)) {
        setActiveLanguage(next[0]);
      }
      return next;
    });
  };

  const saveExercise = async () => {
    if (!canSave) return;

    try {
      setSaving(true);
      const response = await BaseApi.put(
        `${process.env.NEXT_PUBLIC_API_URL}/course-curriculums/${exercise.id}`,
        {
          title: exercise.title,
          description: exercise.curriculum_description || "",
          codingInstructions: instructions,
          codingStarterCode: {
            languages,
            starter_code: starterCodeByLanguage,
            expected_output: expectedOutputByLanguage,
          },
        },
      );
      onSave?.(response?.data?.data);
    } catch (error) {
      console.error("Error saving coding exercise:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border p-4 rounded bg-white shadow space-y-4">
      <div className="flex justify-between items-center">
        <p className="font-semibold">Coding exercise content</p>
        <button onClick={onClose} className="text-gray-500 hover:text-black">
          ✕
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Instructions</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Describe the task, input/output rules, and evaluation criteria."
          rows={4}
          className="w-full border rounded p-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Supported languages</label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_LANGUAGES.map((language) => (
            <button
              key={language}
              onClick={() => toggleLanguage(language)}
              className={`px-2 py-1 border rounded text-sm ${languages.includes(language) ? "bg-[#0056D2] text-white border-[#0056D2]" : "bg-white text-gray-700"}`}
            >
              {language}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {languages.map((language) => (
          <button
            key={language}
            onClick={() => setActiveLanguage(language)}
            className={`px-2 py-1 border rounded text-sm ${activeLanguage === language ? "bg-black text-white" : "bg-white text-gray-700"}`}
          >
            {language}
          </button>
        ))}
      </div>

      <div className="border rounded overflow-hidden">
        <Editor
          height="280px"
          language={activeLanguage}
          value={starterCodeByLanguage[activeLanguage] || ""}
          onChange={(val) =>
            setStarterCodeByLanguage((prev) => ({
              ...prev,
              [activeLanguage]: val ?? "",
            }))
          }
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Expected output for {activeLanguage} (optional)
        </label>
        <textarea
          rows={2}
          className="w-full border rounded p-2 text-sm font-mono"
          value={expectedOutputByLanguage[activeLanguage] || ""}
          onChange={(e) =>
            setExpectedOutputByLanguage((prev) => ({
              ...prev,
              [activeLanguage]: e.target.value,
            }))
          }
          placeholder="Expected output"
        />
      </div>

      <div className="flex justify-end gap-3 border-t pt-3">
        <button
          onClick={onClose}
          className="px-4 py-1 border rounded text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={saveExercise}
          disabled={!canSave || saving}
          className={`px-4 py-1 rounded text-white ${
            canSave && !saving
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {saving ? "Saving..." : "Save Coding Exercise"}
        </button>
      </div>
    </div>
  );
}
