"use client";
import { useState } from "react";

export default function ArticleForm({ onSave, onCancel }) {
  const [content, setContent] = useState("");

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Article Content
      </label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        placeholder="Write your article here..."
        className="w-full rounded border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
      />

      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave({ content })}
          disabled={!content.trim()}
          className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
        >
          Save Article
        </button>
      </div>
    </div>
  );
}
