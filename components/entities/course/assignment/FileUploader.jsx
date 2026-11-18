import { useRef, useState } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";

const API = process.env.NEXT_PUBLIC_API_URL || "";

export function assetUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API.replace(/\/api\/?$/, "")}${path}`;
}

function formatSize(bytes) {
  const n = Number(bytes) || 0;
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} KB`;
}

// Uploads one file for an assignment and reports the stored file back.
export default function FileUploader({
  lessonId,
  value,
  onChange,
  accept,
  maxBytes = 500 * 1024 * 1024,
  label = "Select File",
  showPreview = false,
}) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > maxBytes) {
      toast.error(`File must be under ${formatSize(maxBytes)}`);
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setProgress(0);
    try {
      const response = await BaseApi.post(
        `${API}/course-curriculums/${lessonId}/assignment/files`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
          },
        },
      );
      onChange(response?.data?.data || null);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error?.message || "Upload failed",
      );
    } finally {
      setProgress(null);
    }
  };

  return (
    <div className="space-y-3">
      {value ? (
        <div className="space-y-2">
          {showPreview ? (
            <video
              src={assetUrl(value.path)}
              controls
              className="max-h-64 w-full rounded bg-black"
            />
          ) : null}
          <div className="flex items-center justify-between gap-3 rounded border border-slate-200 px-3 py-2 text-[14px]">
            <div className="min-w-0">
              <p className="truncate font-medium">{value.name || "File"}</p>
              <p className="text-[12px] text-slate-500">
                {formatSize(value.size)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="font-semibold text-primary"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => onChange(null)}
                aria-label="Remove file"
                className="text-slate-500 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
          className="inline-flex items-center gap-2 rounded border border-slate-900 px-4 py-2 text-[14px] font-bold text-slate-900 hover:bg-slate-50 disabled:opacity-60"
        >
          {progress !== null ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          {label}
        </button>
      )}
      {progress !== null ? (
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
