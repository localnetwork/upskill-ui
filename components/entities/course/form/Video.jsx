"use client";
export default function Video({ selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`border rounded p-4 text-center hover:border-purple-600 transition ${
        selected ? "border-purple-600 bg-purple-50" : ""
      }`}
    >
      <div className="text-2xl mb-2">🎬</div>
      <div className="font-medium">Video</div>
    </button>
  );
}
