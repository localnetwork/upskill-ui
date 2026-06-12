export default function QuizEmptyState({ title }) {
  return (
    <div className="bg-white overflow-y-auto w-full h-[600px] flex flex-column justify-center items-center shadow-md absolute top-0 left-0 p-6">
      <div className="max-w-[780px] mx-auto">
        <h3 className="text-2xl font-semibold">{title || "Quiz"}</h3>
        <p className="text-gray-600 mt-2">No quiz questions are available yet.</p>
      </div>
    </div>
  );
}
