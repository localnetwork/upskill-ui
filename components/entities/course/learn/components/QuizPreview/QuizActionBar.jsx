import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Lightbulb,
  LightbulbOff,
} from "lucide-react";
import { MOTIVATION_MESSAGES } from "./quizPreview.constants";
import { formatCorrectAnswer } from "./quizPreview.utils";
import { Tooltip } from "react-tooltip";

export default function QuizActionBar({
  requestHint,
  hintAlreadyUsed,
  isHintLoading,
  submitCurrentAnswer,
  canSubmitAnswer,
  isSubmitting,
  goToNextQuestion,
  canGoNext,
  hintText,
  showValidation,
  feedbackResult,
  currentQuestion,
}) {
  return (
    <div className="mt-10 mx-[-24px] z-[10] sticky bottom-0 left-0 w-full pt-6 bg-surface/90 backdrop-blur-xl border-t border-[#e2e8f0]/50 z-50">
      <div className="max-w-[464px] mx-auto flex flex-wrap items-center gap-2">
        <button
          onClick={requestHint}
          disabled={hintAlreadyUsed || isHintLoading}
          className="w-14 h-14 flex items-center justify-center rounded-full border border-[#e2e8f0] text-[#475569] hover:bg-surface-container-low transition-colors active:scale-90"
        >
          {hintAlreadyUsed ? (
            <LightbulbOff className="text-gray-400" />
          ) : (
            <Lightbulb />
          )}
        </button>

        <button
          onClick={submitCurrentAnswer}
          disabled={!canSubmitAnswer}
          className={`flex-1 ${!canSubmitAnswer ? "opacity-50" : ""} h-14 bg-primary text-white rounded-full font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-95 transition-all group`}
        >
          {isSubmitting ? "Validating..." : "Submit Answer"}
          <ArrowRight className="transition-transform group-hover:translate-x-1" />
        </button>

        <button
          name="next-question"
          onClick={goToNextQuestion}
          disabled={!canGoNext}
          data-tooltip-id="tooltip-next-question"
          data-tooltip-content="Proceed to Next Question"
          className={`flex-1 h-14 max-w-[70px] bg-primary text-white rounded-full font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all group ${
            !canGoNext ? "opacity-50 cursor-not-allowed" : "active:scale-95"
          }`}
        >
          <ArrowRight className="inline-block mr-1" />
        </button>

        <Tooltip
          id="tooltip-next-question"
          place="top"
          className="bg-gray-700 text-white text-xs rounded py-1 px-2"
        />
      </div>

      {hintText && (
        <div className="border-l-4 border-amber-400 bg-amber-50 p-3 text-sm">
          <p className="font-semibold">Hint</p>
          <p>{hintText}</p>
        </div>
      )}

      {showValidation && feedbackResult && (
        <div
          className={`rounded-[32px] mt-5 p-5 mb-4 transition-all duration-500 opacity-100 translate-y-0 ${
            feedbackResult.isCorrect
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            {feedbackResult.isCorrect ? (
              <CircleCheck className="text-green-600" />
            ) : (
              <CircleAlert className="text-red-600" />
            )}

            <h4
              className={`font-headline font-bold uppercase tracking-wider text-sm ${
                feedbackResult.isCorrect ? "text-green-700" : "text-red-600"
              }`}
            >
              {feedbackResult.isCorrect ? "Correct!" : "Incorrect"}
            </h4>
          </div>

          <div className="space-y-3">
            <p className="text-sm">
              Correct answer:{" "}
              <span className="font-bold">
                {formatCorrectAnswer(
                  currentQuestion,
                  feedbackResult.correctAnswer,
                )}
              </span>
            </p>

            <div
              className={`p-3 rounded border ${
                feedbackResult.isCorrect
                  ? "bg-green-50 border-green-200"
                  : "bg-white/50 border-slate-300/30"
              }`}
            >
              <p className="text-xs leading-relaxed">
                {feedbackResult.explanation ||
                  "Review the concept and continue."}
              </p>

              {feedbackResult.isCorrect && (
                <p className="mt-2 text-green-700 font-medium">
                  {
                    MOTIVATION_MESSAGES[
                      Math.floor(Math.random() * MOTIVATION_MESSAGES.length)
                    ]
                  }
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
