"use client";
import { useMemo, useState } from "react";
import BaseApi from "@/lib/api/_base.api";

function createQuestion(type = "multiple_choice") {
  return {
    id: `q-${Date.now()}-${Math.round(Math.random() * 10000)}`,
    type,
    prompt: "",
    options:
      type === "multiple_choice"
        ? [
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
          ]
        : [],
    acceptedAnswers:
      type === "fill_in_the_blanks" || type === "short_answer" ? [""] : [],
    correctAnswer: type === "true_false" ? true : null,
    explanation: "",
  };
}

function normalizeQuestions(input) {
  if (!Array.isArray(input)) return [];
  return input.map((item) => ({
    ...createQuestion(item?.type || "multiple_choice"),
    ...item,
  }));
}

export default function QuizItem({ quiz, onClose, onSave }) {
  const [questions, setQuestions] = useState(
    normalizeQuestions(quiz?.asset?.questions || []),
  );
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => {
    if (!questions.length) return false;
    return questions.every((question) => {
      if (!String(question.prompt || "").trim()) return false;
      if (question.type === "multiple_choice") {
        const options = Array.isArray(question.options) ? question.options : [];
        const hasEnough = options.length >= 2;
        const hasCorrect = options.some((option) => option?.isCorrect);
        const allFilled = options.every((option) => String(option?.text || "").trim());
        return hasEnough && hasCorrect && allFilled;
      }
      if (question.type === "fill_in_the_blanks" || question.type === "short_answer") {
        const answers = Array.isArray(question.acceptedAnswers)
          ? question.acceptedAnswers
          : [];
        return answers.some((answer) => String(answer || "").trim());
      }
      return true;
    });
  }, [questions]);

  const updateQuestion = (id, patch) => {
    setQuestions((prev) => prev.map((question) => (question.id === id ? { ...question, ...patch } : question)));
  };

  const addQuestion = (type) => {
    setQuestions((prev) => [...prev, createQuestion(type)]);
  };

  const removeQuestion = (id) => {
    setQuestions((prev) => prev.filter((question) => question.id !== id));
  };

  const saveQuiz = async () => {
    if (!canSave) return;

    try {
      setSaving(true);
      const response = await BaseApi.put(
        `${process.env.NEXT_PUBLIC_API_URL}/course-curriculums/${quiz.id}`,
        {
          title: quiz.title,
          description: quiz.curriculum_description || "",
          quizQuestions: { questions },
        },
      );
      onSave?.(response?.data?.data);
    } catch (error) {
      console.error("Error saving quiz:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border p-4 rounded bg-white space-y-4">
      <div className="flex justify-between items-center">
        <p className="font-semibold">Quiz content</p>
        <button onClick={onClose}>✕</button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="px-2 py-1 border rounded text-sm" onClick={() => addQuestion("multiple_choice")}>
          + Multiple Choice
        </button>
        <button className="px-2 py-1 border rounded text-sm" onClick={() => addQuestion("fill_in_the_blanks")}>
          + Fill in the Blanks
        </button>
        <button className="px-2 py-1 border rounded text-sm" onClick={() => addQuestion("true_false")}>
          + True / False
        </button>
        <button className="px-2 py-1 border rounded text-sm" onClick={() => addQuestion("short_answer")}>
          + Short Answer
        </button>
      </div>

      {questions.map((question, index) => (
        <div key={question.id} className="border rounded p-3 space-y-3">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-sm">Question {index + 1}</p>
            <button className="text-red-600 text-sm" onClick={() => removeQuestion(question.id)}>
              Remove
            </button>
          </div>

          <select
            value={question.type}
            onChange={(e) => updateQuestion(question.id, createQuestion(e.target.value))}
            className="border rounded p-2 text-sm"
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="fill_in_the_blanks">Fill in the Blanks</option>
            <option value="true_false">True / False</option>
            <option value="short_answer">Short Answer</option>
          </select>

          <textarea
            value={question.prompt}
            onChange={(e) => updateQuestion(question.id, { prompt: e.target.value })}
            className="border rounded w-full p-2 text-sm"
            placeholder="Question prompt"
          />

          {question.type === "multiple_choice" && (
            <div className="space-y-2">
              {(question.options || []).map((option, optionIndex) => (
                <div key={`${question.id}-option-${optionIndex}`} className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(option.isCorrect)}
                    onChange={(e) => {
                      const options = [...(question.options || [])];
                      options[optionIndex] = { ...options[optionIndex], isCorrect: e.target.checked };
                      updateQuestion(question.id, { options });
                    }}
                  />
                  <input
                    type="text"
                    value={option.text || ""}
                    className="border rounded w-full p-2 text-sm"
                    placeholder={`Option ${optionIndex + 1}`}
                    onChange={(e) => {
                      const options = [...(question.options || [])];
                      options[optionIndex] = { ...options[optionIndex], text: e.target.value };
                      updateQuestion(question.id, { options });
                    }}
                  />
                </div>
              ))}
              <button
                className="px-2 py-1 border rounded text-xs"
                onClick={() =>
                  updateQuestion(question.id, {
                    options: [...(question.options || []), { text: "", isCorrect: false }],
                  })
                }
              >
                + Add option
              </button>
            </div>
          )}

          {question.type === "true_false" && (
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={question.correctAnswer === true}
                  onChange={() => updateQuestion(question.id, { correctAnswer: true })}
                />
                True
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={question.correctAnswer === false}
                  onChange={() => updateQuestion(question.id, { correctAnswer: false })}
                />
                False
              </label>
            </div>
          )}

          {(question.type === "fill_in_the_blanks" || question.type === "short_answer") && (
            <div className="space-y-2">
              {(question.acceptedAnswers || []).map((answer, answerIndex) => (
                <input
                  key={`${question.id}-answer-${answerIndex}`}
                  type="text"
                  value={answer || ""}
                  className="border rounded w-full p-2 text-sm"
                  placeholder={`Accepted answer ${answerIndex + 1}`}
                  onChange={(e) => {
                    const acceptedAnswers = [...(question.acceptedAnswers || [])];
                    acceptedAnswers[answerIndex] = e.target.value;
                    updateQuestion(question.id, { acceptedAnswers });
                  }}
                />
              ))}
              <button
                className="px-2 py-1 border rounded text-xs"
                onClick={() =>
                  updateQuestion(question.id, {
                    acceptedAnswers: [...(question.acceptedAnswers || []), ""],
                  })
                }
              >
                + Add accepted answer
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded">
          Cancel
        </button>
        <button
          onClick={saveQuiz}
          disabled={!canSave || saving}
          className="px-4 py-2 cursor-pointer font-bold border-[2px] border-[#0056D2] hover:bg-[#0056D2] hover:text-white text-[#0056D2] rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Quiz"}
        </button>
      </div>
    </div>
  );
}
