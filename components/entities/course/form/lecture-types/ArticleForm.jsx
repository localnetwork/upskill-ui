"use client";
import { useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";
import { Save } from "lucide-react";

export default function ArticleForm({ onSave, onCancel, lecture }) {
  const [content, setContent] = useState(lecture?.content || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("Article content cannot be empty.");
      return;
    }

    setLoading(true);
    try {
      const response = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + `/course-resources/articles`,
        { content: content, curriculum_id: lecture?.id }
      );

      if (onSave) {
        onSave({
          ...response.data.data.curriculum,
          asset: response.data.data.asset,
        });
      }

      toast.success("Article saved successfully!");
    } catch (error) {
      toast.error("Failed to save article. Please try again.");
      console.error("Error saving article:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Article Content
      </label>

      <Editor
        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
        initialValue={lecture?.asset?.content || ""}
        value={content}
        onEditorChange={(newContent) => setContent(newContent)}
        init={{
          height: 300,
          menubar: false,
          plugins: [
            "advlist autolink lists link image charmap preview anchor",
            "searchreplace visualblocks code fullscreen",
            "insertdatetime media table code help wordcount",
          ],
          toolbar:
            "undo redo | formatselect | " +
            "bold italic underline | alignleft aligncenter " +
            "alignright alignjustify | bullist numlist outdent indent | " +
            "removeformat | help",
          content_style:
            "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
        }}
      />

      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!content.trim() || loading}
          className="px-4 py-2 cursor-pointer flex items-center justify-center font-bold border-[2px] border-[#0056D2] hover:bg-[#0056D2] hover:text-white text-[#0056D2] rounded"
        >
          <Save size={20} /> {loading ? "Saving..." : "Save Article"}
        </button>
      </div>
    </div>
  );
}
