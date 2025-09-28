import { useState, useEffect } from "react";

export default function QuizItem({ quiz, onClose }) {
  const [step, setStep] = useState("selectType"); // "selectType" | "multipleChoice" | "fillInTheBlanks"
  const [question, setQuestion] = useState("");
  const [blanks, setBlanks] = useState([]);
  const [errors, setErrors] = useState([]);

  const MAX_BLANK_LENGTH = 50; // example max length for each blank

  // Update blanks based on number of "__" in question
  useEffect(() => {
    const count = (question.match(/__/g) || []).length;
    setBlanks((prev) => {
      const newBlanks = Array(count).fill("");
      // keep previous values if possible
      prev.forEach((val, i) => {
        if (i < count) newBlanks[i] = val;
      });
      return newBlanks;
    });
  }, [question]);

  const updateBlank = (index, value) => {
    const newBlanks = [...blanks];
    newBlanks[index] = value;
    setBlanks(newBlanks);

    // validate length
    const newErrors = [...errors];
    if (value.length > MAX_BLANK_LENGTH) {
      newErrors[index] = `Answer exceeds ${MAX_BLANK_LENGTH} characters`;
    } else {
      newErrors[index] = null;
    }
    setErrors(newErrors);
  };

  return (
    <div className="border p-3 rounded bg-white space-y-4">
      {/* Header */}
      {step === "selectType" && (
        <>
          <div className="flex justify-between">
            <p className="font-semibold">
              Unpublished Quiz:{" "}
              <span className="font-normal">{quiz.title}</span>
            </p>
            <button onClick={onClose}>✕</button>
          </div>

          <p className="font-semibold">Select question type</p>
          <div className="flex gap-4">
            <button
              className="border w-40 h-24 flex flex-col items-center justify-center hover:bg-gray-50"
              onClick={() => setStep("multipleChoice")}
            >
              <span className="text-2xl">❓</span>
              <span className="text-sm mt-2">Multiple Choice</span>
            </button>
            <button
              className="border w-40 h-24 flex flex-col items-center justify-center hover:bg-gray-50"
              onClick={() => setStep("fillInTheBlanks")}
            >
              <span className="text-2xl">✏️</span>
              <span className="text-sm mt-2">Fill in the Blanks</span>
            </button>
          </div>
        </>
      )}

      {/* Multiple Choice */}
      {step === "multipleChoice" && (
        <>
          <div className="flex justify-between">
            <p className="font-semibold">
              Unpublished Quiz:{" "}
              <span className="font-normal">{quiz.title}</span>
            </p>
            <button onClick={() => setStep("selectType")}>Back</button>
          </div>

          <div>
            <label className="font-semibold block mb-1">Question</label>
            <textarea
              className="border rounded w-full p-2"
              placeholder="Type your question here..."
            />
          </div>

          <div className="space-y-4">
            <p className="font-semibold">Answers</p>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded p-3 space-y-2">
                <div className="flex gap-2 items-center">
                  <input type="radio" name="answer" />
                  <input
                    type="text"
                    className="flex-1 border-b p-1 outline-none"
                    placeholder="Add an answer"
                  />
                </div>
                <textarea
                  className="border rounded w-full p-2 text-sm"
                  placeholder="Explain why this is or isn't the best answer."
                  maxLength={600}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Fill in the Blanks */}
      {step === "fillInTheBlanks" && (
        <>
          <div className="flex justify-between">
            <p className="font-semibold">
              Unpublished Quiz:{" "}
              <span className="font-normal">{quiz.title}</span>
            </p>
            <button onClick={() => setStep("selectType")}>Back</button>
          </div>

          <div>
            <label className="font-semibold block mb-1">Question</label>
            <textarea
              className="border rounded w-full p-2"
              placeholder="Type your sentence with blanks using __"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div className="space-y-4 mt-2">
            <p className="font-semibold">Blanks</p>
            {blanks.length === 0 && (
              <p className="text-gray-500">No blanks detected.</p>
            )}
            {blanks.map((blank, i) => (
              <div key={i} className="border rounded p-3 space-y-2">
                <input
                  type="text"
                  value={blank}
                  onChange={(e) => updateBlank(i, e.target.value)}
                  placeholder={`Blank #${i + 1} answer`}
                  className="w-full border-b p-1 outline-none"
                />
                {errors[i] && (
                  <p className="text-red-500 text-sm">{errors[i]}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
