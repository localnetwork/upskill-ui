import { formatCorrectAnswer, formatSubmittedAnswer } from "./quizPreview.utils";

export default function QuizReviewPanel({
  reviewEntries,
  attemptHistory,
  onCloseReview,
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <h4 className="text-lg font-semibold">Review Mode</h4>
        <button
          className="px-2 py-1 border rounded text-sm"
          onClick={onCloseReview}
        >
          Close Review
        </button>
      </div>

      {reviewEntries.map((entry, index) => (
        <div key={entry.key} className="border rounded p-3 text-sm">
          <p className="font-semibold mb-1">
            {index + 1}. {entry.question?.prompt || "Question"}
          </p>
          <p>
            Your answer:{" "}
            <strong>{formatSubmittedAnswer(entry.question, entry.answer)}</strong>
          </p>
          <p>
            Correct answer:{" "}
            <strong>
              {formatCorrectAnswer(entry.question, entry.result?.correctAnswer)}
            </strong>
          </p>
          <p>Result: {entry.result?.isCorrect ? "Correct" : "Incorrect"}</p>
          <p>Hint used: {entry.hintUsed ? "Yes" : "No"}</p>
          <p>{entry.result?.explanation || "No explanation available."}</p>
        </div>
      ))}

      {attemptHistory.length > 0 && (
        <div className="border rounded p-3 text-sm">
          <p className="font-semibold mb-2">Attempt History</p>
          <div className="space-y-1">
            {attemptHistory.map((history, index) => (
              <p key={`attempt-${index}`}>
                Attempt #{history.attemptNumber}:{" "}
                {history.passed ? "Passed" : "Failed"} -{" "}
                {history.scorePercentage}% ({history.correctAnswers} correct,{" "}
                {history.incorrectAnswers} incorrect, {history.hintsUsed} hints)
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
