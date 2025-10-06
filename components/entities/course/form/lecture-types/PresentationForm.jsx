"use client";
import { useState } from "react";

export default function PresentationForm({ onSave, onCancel }) {
  const [file, setFile] = useState(null);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Upload Presentation
      </label>
      <input
        type="file"
        accept=".pdf,.ppt,.pptx"
        onChange={(e) => setFile(e.target.files[0])}
        className="block w-full text-sm"
      />

      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave({ file })}
          disabled={!file}
          className="px-4 py-2 cursor-pointer flex items-center justify-center font-bold border-[2px] border-[#0056D2] hover:bg-[#0056D2] hover:text-white text-[#0056D2] rounded"
        >
          Save Presentation
        </button>
      </div>
    </div>
  );
}
