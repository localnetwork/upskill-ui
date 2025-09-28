import { useState } from "react";
import LectureContentSelector from "./LectureContentSelector";
import QuizItem from "./QuizItem";
import CodingExerciseItem from "./CodingExerciseItem";

export default function CourseItem({ item }) {
  const [open, setOpen] = useState(false);
  const isLecture = item.type === "lecture";
  const isQuiz = item.type === "quiz";
  const isCoding = item.type.replace(" ", "_") === "coding_exercise";

  return (
    <div className="border p-2 rounded mb-2 bg-gray-50">
      <div
        className="flex justify-between cursor-pointer"
        onClick={() => {
          if (isLecture || isQuiz || isCoding) setOpen(!open);
        }}
      >
        <span>
          {item.type.toUpperCase()} – {item.title}
        </span>
        {(isLecture || isQuiz || isCoding) && (
          <span className="text-sm text-purple-600">Select content</span>
        )}
      </div>

      {open && isLecture && (
        <div className="mt-3">
          <LectureContentSelector
            lectureTitle={item.title}
            onClose={() => setOpen(false)}
          />
        </div>
      )}

      {open && isQuiz && (
        <div className="mt-3">
          <QuizItem quiz={item} onClose={() => setOpen(false)} />
        </div>
      )}

      {open && isCoding && (
        <div className="mt-3">
          <CodingExerciseItem exercise={item} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
