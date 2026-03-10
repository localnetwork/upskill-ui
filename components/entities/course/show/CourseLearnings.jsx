import { Check, CheckCircle } from "lucide-react";

export default function CourseLearnings({ course }) {
  const learnings = course?.goals?.what_you_will_learn_data || [];

  // split array into two halves
  const middle = Math.ceil(learnings.length / 2);
  const col1 = learnings.slice(0, middle);
  const col2 = learnings.slice(middle);

  return (
    <div class="grid md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-gray-100">
      {col1.map((goal, index) => (
        <div key={index} className="flex items-start gap-2">
          <Check class="text-[#2563eb]" />
          <span class="text-sm font-medium">{goal}</span>
        </div>
      ))}
      {col2.map((goal, index) => (
        <div key={index} className="flex items-start gap-2">
          <Check class="text-[#2563eb]" />
          <span class="text-sm font-medium">{goal}</span>
        </div>
      ))}
    </div>
  );
}
