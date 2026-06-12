import {
  BookOpenCheck,
  CheckCircle,
  CircleX,
  Clock,
  Lightbulb,
  RefreshCcw,
} from "lucide-react";
import { formatDuration } from "./quizPreview.utils";

export default function QuizCompletionSummary({
  isPassed,
  metrics,
  onRetry,
  onShowReview,
}) {
  return (
    <>
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#EAF2FD] text-primary mb-6 animate-float">
          <BookOpenCheck className="text-3xl" />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-2">
          Keep Pushing Forward
        </h2>
        <h1 className="text-4xl font-extrabold tracking-tight text-[#475569] mb-2">
          {isPassed ? "Congratulations!" : "Not Yet Passed!"}
        </h1>
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl font-black text-[#475569]">
            {metrics.score || 0} / {metrics.maxScore || 0}
          </span>
          <span
            className={`${
              isPassed
                ? "bg-[#F8FAFC] text-primary"
                : "bg-[#F7DDDC] text-[#991b1b]"
            } px-3 py-1 text-xs font-black rounded-full uppercase tracking-tighter`}
          >
            {metrics.scorePercentage || 0}% SCORE
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-surface border border-[#e2e8f0] p-5 rounded-[32px] hover:shadow-xl transition-all duration-300 opacity-100 translate-y-0">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="text-[#475569] opacity-40" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#475569]">
              Total
            </span>
          </div>
          <div className="text-2xl font-bold text-[#475569]">
            {metrics.correctAnswers || 0}
          </div>
          <div className="text-[11px] font-bold text-[#475569]/60 uppercase">
            Correct
          </div>
        </div>

        <div className="bg-surface border border-[#e2e8f0] p-5 rounded-[32px] hover:shadow-xl transition-all duration-300 opacity-100 translate-y-0">
          <div className="flex items-center justify-between mb-3">
            <CircleX className="text-[#dc2626] opacity-40" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#475569]">
              Total
            </span>
          </div>
          <div className="text-2xl font-bold text-[#475569]">
            {metrics.incorrectAnswers || 0}
          </div>
          <div className="text-[11px] font-bold text-[#475569]/60 uppercase">
            Incorrect
          </div>
        </div>

        <div className="bg-surface border border-[#e2e8f0] p-5 rounded-[32px] hover:shadow-xl transition-all duration-300 opacity-100 translate-y-0">
          <div className="flex items-center justify-between mb-3">
            <Lightbulb className="text-[#ea580c] opacity-40" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#475569]">
              Usage
            </span>
          </div>
          <div className="text-2xl font-bold text-[#475569]">
            {metrics.hintsUsed || 0}
          </div>
          <div className="text-[11px] font-bold text-[#475569]/60 uppercase">
            Hints Used
          </div>
        </div>

        <div className="bg-surface border border-[#e2e8f0] p-5 rounded-[32px] hover:shadow-xl transition-all duration-300 opacity-100 translate-y-0">
          <div className="flex items-center justify-between mb-3">
            <Clock className="text-[#475569] opacity-40" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#475569]">
              Duration
            </span>
          </div>
          <div className="text-2xl font-bold text-[#475569]">
            {formatDuration(metrics.timeSpentSeconds)}
          </div>
          <div className="text-[11px] font-bold text-[#475569]/60 uppercase">
            Time Spent
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {!isPassed && (
          <button
            onClick={onRetry}
            className="w-full py-5 bg-primary text-white rounded-full font-bold flex items-center justify-center gap-3 shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
          >
            <RefreshCcw />
            Retry Quiz
          </button>
        )}

        <button
          onClick={onShowReview}
          className="w-full py-5 border-2 border-outline text-on-surface rounded-full font-bold hover:bg-surface-container-low active:scale-95 transition-all"
        >
          Review Answers
        </button>
      </div>
    </>
  );
}
