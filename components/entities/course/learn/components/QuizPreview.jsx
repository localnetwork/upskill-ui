import { useEffect, useMemo, useState } from "react";
import BaseApi from "@/lib/api/_base.api";
import QuizActionBar from "./QuizPreview/QuizActionBar";
import QuizCompletionSummary from "./QuizPreview/QuizCompletionSummary";
import QuizEmptyState from "./QuizPreview/QuizEmptyState";
import QuizLoadingState from "./QuizPreview/QuizLoadingState";
import QuizProgressHeader from "./QuizPreview/QuizProgressHeader";
import QuizQuestionBody from "./QuizPreview/QuizQuestionBody";
import QuizReviewPanel from "./QuizPreview/QuizReviewPanel";
import { getQuestionKey } from "./QuizPreview/quizPreview.utils";

export default function QuizPreview({ lecture, setCourse }) {
  const questions = useMemo(
    () =>
      Array.isArray(lecture?.asset?.questions) ? lecture.asset.questions : [],
    [lecture?.asset?.questions],
  );

  const [attempt, setAttempt] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [validationResult, setValidationResult] = useState(null);
  const [hintText, setHintText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [error, setError] = useState("");

  const currentQuestion = questions[currentIndex];
  const currentQuestionKey = getQuestionKey(currentQuestion, currentIndex);
  const currentResult =
    attempt?.state?.questionResults?.[currentQuestionKey] || null;
  const hintAlreadyUsed = Boolean(
    attempt?.state?.hintUsage?.[currentQuestionKey],
  );
  const feedbackResult = validationResult || currentResult;

  const progressPct =
    questions.length > 0
      ? Math.min(
          100,
          Math.round(
            ((attempt?.state?.metrics?.answeredQuestions || 0) /
              questions.length) *
              100,
          ),
        )
      : 0;

  const canSubmitAnswer = useMemo(() => {
    if (!currentQuestion || isSubmitting) return false;
    if (currentResult) return false;
    if (
      currentQuestion.type === "multiple_choice" ||
      currentQuestion.type === "true_false"
    ) {
      return (
        currentAnswer !== "" &&
        currentAnswer !== null &&
        currentAnswer !== undefined
      );
    }
    return String(currentAnswer || "").trim().length > 0;
  }, [currentQuestion, currentAnswer, isSubmitting, currentResult]);

  const canGoNext = Boolean(currentResult || validationResult);
  const metrics = attempt?.state?.metrics || {};
  const isCompleted = Boolean(attempt?.state?.completed);
  const isPassed = Boolean(attempt?.state?.passed);
  const passingScore = Number(attempt?.settings?.passingScore || 80);
  const attemptHistory = Array.isArray(attempt?.state?.attemptHistory)
    ? attempt.state.attemptHistory
    : [];

  const reviewEntries = useMemo(
    () =>
      questions.map((question, index) => {
        const key = getQuestionKey(question, index);
        return {
          question,
          key,
          result: attempt?.state?.questionResults?.[key],
          answer: attempt?.state?.answers?.[key],
          hintUsed: Boolean(attempt?.state?.hintUsage?.[key]),
        };
      }),
    [attempt, questions],
  );

  const loadAttempt = async () => {
    if (!lecture?.id) return;

    try {
      setIsLoading(true);
      setError("");
      const response = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/course-curriculums/${lecture.id}/quiz-attempt`,
      );
      const payload = response?.data?.data;
      setAttempt(payload);
      setCurrentIndex(Number(payload?.state?.currentQuestionIndex || 0));
    } catch (loadError) {
      console.error("Failed to load quiz attempt:", loadError);
      setError("Unable to load quiz attempt.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setValidationResult(null);
    setHintText("");
    setCurrentAnswer("");
    setShowReview(false);
    loadAttempt();
  }, [lecture?.id]);

  useEffect(() => {
    if (!attempt) return;
    const question = questions[currentIndex];
    const key = getQuestionKey(question, currentIndex);
    const savedAnswer = attempt?.state?.answers?.[key];
    setCurrentAnswer(savedAnswer ?? "");
    setValidationResult(attempt?.state?.questionResults?.[key] || null);
    setHintText("");
  }, [currentIndex, attempt, questions]);

  useEffect(() => {
    if (!attempt?.state?.passed) return;
    setCourse((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map((section) => ({
          ...section,
          curriculums: section.curriculums.map((curriculum) =>
            curriculum.id === lecture.id
              ? {
                  ...curriculum,
                  is_taken: true,
                  completed: true,
                  progress_pct: 100,
                }
              : curriculum,
          ),
        })),
      };
    });
  }, [attempt?.state?.passed, lecture?.id, setCourse]);

  useEffect(() => {
    if (!validationResult) {
      setShowValidation(false);
      return;
    }

    setShowValidation(true);
    const fadeTimer = setTimeout(() => {
      setShowValidation(false);
    }, 4500);

    return () => {
      clearTimeout(fadeTimer);
    };
  }, [validationResult]);

  const requestHint = async () => {
    if (!lecture?.id || !currentQuestion || hintAlreadyUsed || isHintLoading)
      return;

    try {
      setIsHintLoading(true);
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/course-curriculums/${lecture.id}/quiz-attempt/hint`,
        {
          questionIndex: currentIndex,
        },
      );
      setHintText(response?.data?.data?.hint || "");
      setAttempt((prev) => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));
        next.state.hintUsage[currentQuestionKey] = true;
        return next;
      });
    } catch (hintError) {
      console.error("Failed to load hint:", hintError);
    } finally {
      setIsHintLoading(false);
    }
  };

  const submitCurrentAnswer = async () => {
    if (!canSubmitAnswer || !lecture?.id) return;

    try {
      setIsSubmitting(true);
      setError("");
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/course-curriculums/${lecture.id}/quiz-attempt/validate`,
        {
          questionIndex: currentIndex,
          answer: currentAnswer,
        },
      );
      const payload = response?.data?.data;
      setValidationResult(payload?.validation || null);
      setAttempt((prev) => {
        if (!prev) return prev;
        const next = JSON.parse(JSON.stringify(prev));
        next.state.questionResults[currentQuestionKey] = payload?.validation;
        next.state.answers[currentQuestionKey] = currentAnswer;
        next.state.metrics = payload?.metrics || next.state.metrics;
        next.state.completed = payload?.completed;
        next.state.passed = payload?.passed;
        next.state.currentQuestionIndex =
          payload?.nextQuestionIndex ?? next.state.currentQuestionIndex;
        return next;
      });
    } catch (submitError) {
      console.error("Failed to validate answer:", submitError);
      setError(submitError?.data?.message || "Unable to validate your answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToNextQuestion = () => {
    if (!attempt?.state) return;
    const nextIndex = Number(
      attempt.state.currentQuestionIndex || currentIndex + 1,
    );
    setCurrentIndex(Math.min(nextIndex, Math.max(questions.length - 1, 0)));
  };

  const retryQuiz = async () => {
    if (!lecture?.id) return;
    try {
      setIsLoading(true);
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/course-curriculums/${lecture.id}/quiz-attempt/retry`,
      );
      const payload = response?.data?.data;
      setAttempt(payload);
      setCurrentIndex(0);
      setCurrentAnswer("");
      setHintText("");
      setValidationResult(null);
      setShowReview(false);
    } catch (retryError) {
      console.error("Failed to retry quiz:", retryError);
      setError(retryError?.data?.message || "Unable to restart quiz.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <QuizLoadingState />;
  if (!questions.length) return <QuizEmptyState title={lecture?.title} />;

  return (
    <div className="bg-white flex flex-col items-stretch justify-start overflow-y-auto w-full min-h-[600px] h-full shadow-md relative p-6">
      <div className="max-w-[840px] mx-auto space-y-5 w-full pb-28">
        {!isCompleted && !showReview && (
          <QuizProgressHeader
            title={lecture?.title}
            progressPct={progressPct}
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            passingScore={passingScore}
          />
        )}

        {!isCompleted && !showReview && currentQuestion && (
          <QuizQuestionBody
            currentQuestion={currentQuestion}
            currentQuestionKey={currentQuestionKey}
            currentAnswer={currentAnswer}
            setCurrentAnswer={setCurrentAnswer}
          />
        )}

        {isCompleted && !showReview && (
          <QuizCompletionSummary
            isPassed={isPassed}
            metrics={metrics}
            onRetry={retryQuiz}
            onShowReview={() => setShowReview(true)}
          />
        )}

        {showReview && (
          <QuizReviewPanel
            reviewEntries={reviewEntries}
            attemptHistory={attemptHistory}
            onCloseReview={() => setShowReview(false)}
          />
        )}

        {error && <div className="text-sm text-red-600">{error}</div>}
      </div>

      {!isCompleted && !showReview && (
        <QuizActionBar
          requestHint={requestHint}
          hintAlreadyUsed={hintAlreadyUsed}
          isHintLoading={isHintLoading}
          submitCurrentAnswer={submitCurrentAnswer}
          canSubmitAnswer={canSubmitAnswer}
          isSubmitting={isSubmitting}
          goToNextQuestion={goToNextQuestion}
          canGoNext={canGoNext}
          hintText={hintText}
          showValidation={showValidation}
          feedbackResult={feedbackResult}
          currentQuestion={currentQuestion}
        />
      )}
    </div>
  );
}
