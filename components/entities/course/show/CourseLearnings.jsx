import { Check, CheckCircle } from "lucide-react";

export default function CourseLearnings({ course }) {
  const learnings = course?.goals?.what_you_will_learn_data || [];

  // split array into two halves
  const middle = Math.ceil(learnings.length / 2);
  const col1 = learnings.slice(0, middle);
  const col2 = learnings.slice(middle);

  return (
    <div className="grid grid-cols-2 gap-6 text-[14px]">
      {/* first column */}
      <div className="flex flex-col gap-3">
        {col1.map((goal, index) => (
          <div key={index} className="flex items-start gap-2">
            <Check className="" size={20} />
            <p className="font-light">{goal}</p>
          </div>
        ))}
      </div>

      {/* second column */}
      <div className="flex flex-col gap-3">
        {col2.map((goal, index) => (
          <div key={index} className="flex items-start gap-2">
            <Check className="" size={20} />
            <p className="font-light">{goal}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
