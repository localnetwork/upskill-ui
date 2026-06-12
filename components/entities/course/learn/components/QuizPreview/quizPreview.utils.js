export function getQuestionKey(question, index) {
  return question?.id || `q-${index + 1}`;
}

export function formatCorrectAnswer(question, correctAnswer) {
  if (question?.type === "multiple_choice") {
    const indices = Array.isArray(correctAnswer) ? correctAnswer : [];
    return indices
      .map((index) => question?.options?.[index]?.text || `Option ${index + 1}`)
      .join(", ");
  }
  if (question?.type === "true_false") {
    return correctAnswer ? "True" : "False";
  }
  if (Array.isArray(correctAnswer)) {
    return correctAnswer.join(", ");
  }
  if (correctAnswer === null || correctAnswer === undefined) {
    return "N/A";
  }
  return String(correctAnswer);
}

export function formatSubmittedAnswer(question, submittedAnswer) {
  if (
    submittedAnswer === undefined ||
    submittedAnswer === null ||
    submittedAnswer === ""
  ) {
    return "No answer";
  }

  if (question?.type === "multiple_choice") {
    const index = Number(submittedAnswer);
    if (!Number.isNaN(index) && question?.options?.[index]?.text) {
      return question.options[index].text;
    }
  }

  if (question?.type === "true_false") {
    if (String(submittedAnswer) === "true") return "True";
    if (String(submittedAnswer) === "false") return "False";
  }

  return String(submittedAnswer);
}

export function formatDuration(seconds) {
  const value = Number(seconds || 0);
  return new Date(value * 1000).toISOString().substring(11, 19);
}
