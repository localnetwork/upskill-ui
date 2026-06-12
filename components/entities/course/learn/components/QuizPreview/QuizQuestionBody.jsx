import { Check, X } from "lucide-react";

export default function QuizQuestionBody({
  currentQuestion,
  currentQuestionKey,
  currentAnswer,
  setCurrentAnswer,
}) {
  if (!currentQuestion) return null;

  return (
    <div className="max-w-[464px] py-[50px] mx-auto">
      <p className="text-xl font-headline font-bold text-[#475569] mb-2">
        {currentQuestion.prompt || "Question"}
      </p>

      {currentQuestion.type === "multiple_choice" && (
        <div className="space-y-2">
          {(currentQuestion.options || []).map((option, optionIndex) => {
            const isChecked = String(currentAnswer) === String(optionIndex);
            const inputId = `quiz-question-${currentQuestionKey}-option-${optionIndex}`;

            return (
              <div key={inputId} className="relative">
                <input
                  id={inputId}
                  className="hidden"
                  type="radio"
                  name={`quiz-question-${currentQuestionKey}`}
                  checked={isChecked}
                  onChange={() => setCurrentAnswer(String(optionIndex))}
                />

                <label
                  htmlFor={inputId}
                  className={`flex items-center gap-4 p-5 bg-surface rounded-[32px] cursor-pointer transition-all hover:bg-[#f8fafc] active:scale-[0.98] border ${
                    isChecked
                      ? "border-primary bg-[#f0f7ff] shadow-[0_4px_6px_-1px_rgb(0_86_210_/_0.1)]"
                      : "border-[#e2e8f0]"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isChecked ? "border-primary bg-primary" : "border-[#94a3b8]"
                    }`}
                  >
                    {isChecked && <span className="w-2.5 h-2.5 bg-white rounded-full" />}
                  </span>

                  <span className="text-on-surface font-medium">
                    {option.text || `Option ${optionIndex + 1}`}
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      )}

      {currentQuestion.type === "true_false" && (
        <div className="grid grid-cols-2 gap-4">
          <label
            className={`group flex flex-col items-center justify-center gap-4 p-8 border-2 rounded-[34px] transition-all cursor-pointer active:scale-95 ${
              String(currentAnswer) === "true" ? "border-primary" : "border-[#e2e8f0]"
            }`}
          >
            <input
              type="radio"
              name={`quiz-question-${currentQuestionKey}`}
              checked={String(currentAnswer) === "true"}
              onChange={() => setCurrentAnswer("true")}
              className="hidden"
            />

            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                String(currentAnswer) === "true"
                  ? "bg-primary text-white"
                  : "bg-[#f0f7ff] text-primary"
              }`}
            >
              <Check />
            </div>

            <span
              className={`font-bold transition-colors ${
                String(currentAnswer) === "true" ? "text-primary" : "text-[#475569]"
              }`}
            >
              True
            </span>
          </label>

          <label
            className={`group flex flex-col items-center justify-center gap-4 p-8 border-2 rounded-[34px] transition-all cursor-pointer active:scale-95 ${
              String(currentAnswer) === "false" ? "border-[#dc2626]" : "border-[#e2e8f0]"
            }`}
          >
            <input
              type="radio"
              name={`quiz-question-${currentQuestionKey}`}
              checked={String(currentAnswer) === "false"}
              onChange={() => setCurrentAnswer("false")}
              className="hidden"
            />

            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                String(currentAnswer) === "false"
                  ? "bg-[#dc2626] text-white"
                  : "bg-[#fee2e2] text-[#dc2626]"
              }`}
            >
              <X />
            </div>

            <span
              className={`font-bold transition-colors ${
                String(currentAnswer) === "false" ? "text-[#dc2626]" : "text-[#475569]"
              }`}
            >
              False
            </span>
          </label>
        </div>
      )}

      {(currentQuestion.type === "fill_in_the_blanks" ||
        currentQuestion.type === "short_answer") && (
        <input
          className="flex rounded-[32px] items-center gap-4 p-5 bg-surface border-2 w-full border-[#e8e8e8] transition-all hover:border-primary focus:outline-primary active:scale-[0.98]"
          placeholder="Your answer"
          value={currentAnswer || ""}
          onChange={(e) => setCurrentAnswer(e.target.value)}
        />
      )}
    </div>
  );
}
