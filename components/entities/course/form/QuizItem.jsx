"use client";
import { useMemo, useState } from "react";
import BaseApi from "@/lib/api/_base.api";
import Select from "@/components/forms/Select";
import {
  Lightbulb,
  ListChecks,
  Minus,
  Space,
  ToggleLeft,
  Trash,
} from "lucide-react";
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
    hint: "",
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
        const allFilled = options.every((option) =>
          String(option?.text || "").trim(),
        );
        return hasEnough && hasCorrect && allFilled;
      }
      if (
        question.type === "fill_in_the_blanks" ||
        question.type === "short_answer"
      ) {
        const answers = Array.isArray(question.acceptedAnswers)
          ? question.acceptedAnswers
          : [];
        return answers.some((answer) => String(answer || "").trim());
      }
      return true;
    });
  }, [questions]);

  const updateQuestion = (id, patch) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === id ? { ...question, ...patch } : question,
      ),
    );
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
    <div className="bg-surface rounded-lg border border-outline shadow-sm overflow-hidden">
      <div className="flex justify-between items-center p-5 border-b border-outline flex justify-between items-center bg-primary-container/30">
        <p className="font-semibold">Quiz content</p>
        <button onClick={onClose}>✕</button>
      </div>

      <div className="p-5 grid grid-cols-2 gap-2">
        <button
          className="flex items-center gap-2 px-4 py-3 rounded-DEFAULT border border-outline bg-surface text-on-surface-variant text-xs font-bold hover:border-primary transition-all"
          onClick={() => addQuestion("multiple_choice")}
        >
          <ListChecks size={16} /> Multiple Choice
        </button>
        <button
          className="flex items-center gap-2 px-4 py-3 rounded-DEFAULT border border-outline bg-surface text-on-surface-variant text-xs font-bold hover:border-primary transition-all"
          onClick={() => addQuestion("fill_in_the_blanks")}
        >
          <Space size={16} /> Fill in the Blanks
        </button>
        <button
          className="flex items-center gap-2 px-4 py-3 rounded-DEFAULT border border-outline bg-surface text-on-surface-variant text-xs font-bold hover:border-primary transition-all"
          onClick={() => addQuestion("true_false")}
        >
          <ToggleLeft size={16} /> True / False
        </button>
        <button
          className="flex items-center gap-2 px-4 py-3 rounded-DEFAULT border border-outline bg-surface text-on-surface-variant text-xs font-bold hover:border-primary transition-all"
          onClick={() => addQuestion("short_answer")}
        >
          <Lightbulb size={16} /> Short Answer
        </button>
      </div>
      {questions.length > 0 && (
        <div className="px-5 space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="border rounded p-3 space-y-3">
              <div className="flex justify-between items-center">
                <p className="font-semibold text-sm">Question {index + 1}</p>
                <button
                  className="flex items-center gap-2 text-red-600 text-sm"
                  onClick={() => removeQuestion(question.id)}
                >
                  <Trash size={16} /> Remove
                </button>
              </div>

              <Select
                value={question.type}
                onChange={(e) =>
                  updateQuestion(question.id, createQuestion(e.target.value))
                }
                className="border rounded p-2 text-sm"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="fill_in_the_blanks">Fill in the Blanks</option>
                <option value="true_false">True / False</option>
                <option value="short_answer">Short Answer</option>
              </Select>

              <textarea
                value={question.prompt}
                onChange={(e) =>
                  updateQuestion(question.id, { prompt: e.target.value })
                }
                className="w-full bg-[#f8fafc] border border-[#ddd] rounded-sm p-4 text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-medium resize-none "
                placeholder="Question prompt"
              />

              <textarea
                value={question.hint || ""}
                onChange={(e) =>
                  updateQuestion(question.id, { hint: e.target.value })
                }
                className="w-full bg-[#f8fafc] border border-[#ddd] rounded-sm p-4 text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-medium resize-none "
                placeholder="Hint (optional, shown when learner clicks Hint)"
              />

              <textarea
                value={question.explanation || ""}
                onChange={(e) =>
                  updateQuestion(question.id, { explanation: e.target.value })
                }
                className="w-full bg-[#f8fafc] border border-[#ddd] rounded-sm p-4 text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-medium resize-none "
                placeholder="Explanation (optional, shown after validation)"
              />

              {question.type === "multiple_choice" && (
                <div className="space-y-2">
                  {(question.options || []).map((option, optionIndex) => (
                    <div
                      key={`${question.id}-option-${optionIndex}`}
                      className="flex items-center gap-3 p-3 bg-white border border-outline rounded-DEFAULT hover:shadow-sm transition-all group/opt"
                    >
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded-full"
                        checked={Boolean(option.isCorrect)}
                        onChange={(e) => {
                          const options = [...(question.options || [])];
                          options[optionIndex] = {
                            ...options[optionIndex],
                            isCorrect: e.target.checked,
                          };
                          updateQuestion(question.id, { options });
                        }}
                      />
                      <input
                        type="text"
                        value={option.text || ""}
                        className="w-full outline-none text-on-surface placeholder-on-surface-variant/50 transition-all text-sm font-medium resize-none "
                        placeholder={`Option ${optionIndex + 1}`}
                        onChange={(e) => {
                          const options = [...(question.options || [])];
                          options[optionIndex] = {
                            ...options[optionIndex],
                            text: e.target.value,
                          };
                          updateQuestion(question.id, { options });
                        }}
                      />
                    </div>
                  ))}
                  <button
                    className="w-full py-3 border-2 border-dashed border-outline text-on-surface-variant text-sm font-bold rounded-sm hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2 cursor-pointer"
                    onClick={() =>
                      updateQuestion(question.id, {
                        options: [
                          ...(question.options || []),
                          { text: "", isCorrect: false },
                        ],
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
                      onChange={() =>
                        updateQuestion(question.id, { correctAnswer: true })
                      }
                    />
                    True
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={question.correctAnswer === false}
                      onChange={() =>
                        updateQuestion(question.id, { correctAnswer: false })
                      }
                    />
                    False
                  </label>
                </div>
              )}

              {(question.type === "fill_in_the_blanks" ||
                question.type === "short_answer") && (
                <div className="space-y-2">
                  {(question.acceptedAnswers || []).map(
                    (answer, answerIndex) => (
                      <input
                        key={`${question.id}-answer-${answerIndex}`}
                        type="text"
                        value={answer || ""}
                        className="w-full bg-[#f8fafc] border border-[#ddd] rounded-sm p-4 text-on-surface placeholder-on-surface-variant/50 focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-sm font-medium resize-none "
                        placeholder={`Accepted answer ${answerIndex + 1}`}
                        onChange={(e) => {
                          const acceptedAnswers = [
                            ...(question.acceptedAnswers || []),
                          ];
                          acceptedAnswers[answerIndex] = e.target.value;
                          updateQuestion(question.id, { acceptedAnswers });
                        }}
                      />
                    ),
                  )}
                  <button
                    className="px-2 py-1 border rounded text-xs"
                    onClick={() =>
                      updateQuestion(question.id, {
                        acceptedAnswers: [
                          ...(question.acceptedAnswers || []),
                          "",
                        ],
                      })
                    }
                  >
                    + Add accepted answer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
        >
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
