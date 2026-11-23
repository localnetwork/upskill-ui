import { useMemo, useRef, useState } from "react";
import { FileDown, Link as LinkIcon, Loader2, Plus, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import BaseApi from "@/lib/api/_base.api";
import { assetUrl } from "@/components/entities/course/assignment/FileUploader";

const API = process.env.NEXT_PUBLIC_API_URL || "";
const MAX_BYTES = 500 * 1024 * 1024;
const TABS = [
  { id: "file", label: "Downloadable File" },
  { id: "library", label: "Add from library" },
  { id: "external", label: "External Resource" },
  { id: "source", label: "Source Code" },
];

function formatSize(bytes) {
  const n = Number(bytes) || 0;
  if (n >= 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1024))} kB`;
}

const outlineBtn =
  "text-[12px] px-4 py-2 cursor-pointer flex items-center justify-center font-bold border-[2px] border-[#0056D2] hover:bg-[#0056D2] hover:text-white text-[#0056D2] rounded";

// Lists a lecture's downloadable resources and lets the instructor add or remove them.
export default function LectureResources({ lecture, allItems = [], onChange }) {
  const resources = Array.isArray(lecture?.resources) ? lecture.resources : [];
  const [adding, setAdding] = useState(false);
  const [tab, setTab] = useState("file");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null);
  const [fileName, setFileName] = useState("");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const inputRef = useRef(null);
  const base = `${API}/course-curriculums/${lecture.id}/resources`;

  const libraryItems = useMemo(
    () =>
      allItems
        .filter((item) => item?.id !== lecture.id)
        .flatMap((item) =>
          (item.resources || [])
            .filter((resource) => !resource.external)
            .map((resource) => ({ ...resource, lectureTitle: item.title })),
        ),
    [allItems, lecture.id],
  );

  const apply = (response) => {
    const updated = response?.data?.data;
    if (updated) onChange?.(updated);
  };

  const run = async (request, successMessage) => {
    setBusy(true);
    try {
      apply(await request());
      if (successMessage) toast.success(successMessage);
      return true;
    } catch (error) {
      toast.error(
        error?.response?.data?.message || error?.message || "Request failed",
      );
      return false;
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const closeAdd = () => {
    setAdding(false);
    setFileName("");
    setUrl("");
    setTitle("");
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error(`File must be under ${formatSize(MAX_BYTES)}`);
      return;
    }
    setFileName(file.name);
    const formData = new FormData();
    formData.append("file", file);
    setProgress(0);
    const ok = await run(
      () =>
        BaseApi.post(base, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
          },
        }),
      "Resource added",
    );
    if (ok) closeAdd();
    else setFileName("");
  };

  const handleExternal = async () => {
    const ok = await run(
      () => BaseApi.post(base, { url: url.trim(), title: title.trim() }),
      "Resource added",
    );
    if (ok) closeAdd();
  };

  const handleLibrary = async (mediaId) => {
    const ok = await run(
      () => BaseApi.post(base, { library_media_id: mediaId }),
      "Resource added",
    );
    if (ok) closeAdd();
  };

  const handleDelete = (mediaId) =>
    run(() => BaseApi.delete(`${base}/${mediaId}`), "Resource removed");

  if (adding) {
    return (
      <div className="mt-3 border border-slate-300 bg-white">
        <div className="flex items-center justify-between border-b border-slate-300">
          <div className="flex flex-wrap gap-4 px-4">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`-mb-px border-b-2 py-3 text-sm font-bold ${
                  tab === item.id
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={closeAdd}
            className="mr-3 flex items-center gap-1 text-sm font-bold text-slate-900"
          >
            Close <X size={16} />
          </button>
        </div>

        <div className="p-4">
          {(tab === "file" || tab === "source") && (
            <>
              <div className="flex items-stretch gap-3">
                <div className="flex flex-1 items-center border border-slate-300 px-3 py-2 text-slate-600">
                  {fileName || "No file selected"}
                  {progress !== null && (
                    <span className="ml-2 text-xs">{progress}%</span>
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFile}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                  className={`${outlineBtn} disabled:opacity-50`}
                >
                  {busy ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Select File"
                  )}
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                <b>Note</b>:{" "}
                {tab === "source"
                  ? "Upload a zip or source file students can download to follow along with the lecture."
                  : "A resource is for any type of document that can be used to help students in the lecture. This file is going to be seen as a lecture extra."}{" "}
                Make sure everything is legible and the file size is less than
                500 MB.
              </p>
            </>
          )}

          {tab === "library" &&
            (libraryItems.length ? (
              <ul className="divide-y divide-slate-200">
                {libraryItems.map((resource) => (
                  <li
                    key={resource.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {resource.name}{" "}
                      <span className="text-slate-500">
                        ({resource.lectureTitle})
                      </span>
                    </span>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleLibrary(resource.id)}
                      className={`${outlineBtn} disabled:opacity-50`}
                    >
                      Add
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">
                No resources have been uploaded to other lectures in this course
                yet.
              </p>
            ))}

          {tab === "external" && (
            <div className="space-y-3">
              <input
                type="text"
                value={title}
                maxLength={200}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full border border-slate-300 px-3 py-2 outline-none"
              />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full border border-slate-300 px-3 py-2 outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={busy || !url.trim() || !title.trim()}
                  onClick={handleExternal}
                  className={`${outlineBtn} disabled:opacity-50`}
                >
                  Add Link
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
      {resources.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-bold text-slate-900">
            Downloadable materials
          </h4>
          <ul className="space-y-2">
            {resources.map((resource) => (
              <li
                key={resource.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <a
                  href={assetUrl(resource.path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 items-center gap-2 hover:underline"
                >
                  {resource.external ? (
                    <LinkIcon size={16} className="shrink-0" />
                  ) : (
                    <FileDown size={16} className="shrink-0" />
                  )}
                  <span className="truncate">{resource.name}</span>
                  {!resource.external && (
                    <span className="shrink-0 text-slate-500">
                      ({formatSize(resource.size)})
                    </span>
                  )}
                </a>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleDelete(resource.id)}
                  title="Delete resource"
                  className="shrink-0 rounded p-1 hover:bg-gray-200 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={() => setAdding(true)}
        className={`${outlineBtn} w-fit`}
      >
        <Plus size={14} className="mr-1" /> Resources
      </button>
    </div>
  );
}
