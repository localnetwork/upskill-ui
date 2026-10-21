"use client";
import BaseApi from "@/lib/api/_base.api";
import SecureVideo from "@/components/video-players/SecureVideo";
import { Save } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  TUS_INIT_FAILED,
  uploadVideoResumable,
} from "@/lib/services/resumableVideoUpload";

const LEGACY_UPLOAD_MAX_BYTES = 200 * 1024 * 1024;

const STATUS_LABELS = {
  starting: "Preparing upload...",
  resuming: "Resuming upload...",
  waiting: "Connection lost. Waiting to resume...",
};

export default function VideoForm({ onSave, onCancel, lecture }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null); // ðŸ‘ˆ local preview URL
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const pendingUpload = lecture?.upload?.status === "UPLOADING" ? lecture.upload : null;
  const [serverOffsetPercent, setServerOffsetPercent] = useState(null);
  const abortRef = useRef(null);

  // Warn before closing the tab mid-upload and pause cleanly on unmount.
  useEffect(() => {
    if (!loading) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [loading]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Ask Cloudflare how much of the interrupted upload it already has.
  useEffect(() => {
    if (!pendingUpload?.upload_url) return undefined;
    let cancelled = false;
    fetch(pendingUpload.upload_url, {
      method: "HEAD",
      headers: { "Tus-Resumable": "1.0.0" },
    })
      .then((res) => {
        const offset = Number(res.headers.get("Upload-Offset"));
        const length = Number(res.headers.get("Upload-Length"));
        if (!cancelled && length > 0 && offset >= 0) {
          setServerOffsetPercent(Math.min(100, Math.round((offset / length) * 100)));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pendingUpload?.upload_url]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setVideoUploaded(false);
    setProgress(0);
    setIsProcessing(false);

    const previewUrl = URL.createObjectURL(selectedFile);
    setPreview(previewUrl);

    // âœ… create a hidden video element to extract duration
    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    tempVideo.src = previewUrl;

    tempVideo.onloadedmetadata = () => {
      window.URL.revokeObjectURL(tempVideo.src); // cleanup
      const duration = tempVideo.duration; // seconds (float)
      console.log("Video duration (seconds):", duration);

      // If you want to include this duration in formData
      setFile((prevFile) => {
        // attach duration manually
        prevFile.duration = duration;
        return prevFile;
      });
    };
  };

  const finishWithResult = (data) => {
    setVideoUploaded(true);
    setPreview(null);
    onSave?.({ ...data.curriculum, asset: data.asset });
    setFile(null);
  };

  const handlePauseUpload = () => {
    abortRef.current?.abort();
  };

  const handleOnUploadClick = async () => {
    if (!file) return;

    const controller = new AbortController();
    abortRef.current = controller;
    const durationSeconds = Number(file.duration || 0);

    try {
      setLoading(true);
      setProgress(0);
      setIsProcessing(false);
      setUploadStatus("starting");

      let uid;
      try {
        ({ uid } = await uploadVideoResumable({
          file,
          lectureId: lecture.id,
          durationSeconds,
          signal: controller.signal,
          onProgress: setProgress,
          onStatus: setUploadStatus,
        }));
      } catch (uploadError) {
        if (uploadError?.name === "AbortError") {
          toast("Upload paused. Choose the same file and save again to continue where it left off.");
          return;
        }
        if (
          uploadError?.code === TUS_INIT_FAILED &&
          Number(file.size || 0) <= LEGACY_UPLOAD_MAX_BYTES
        ) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("curriculum_id", lecture.id);
          if (durationSeconds > 0) {
            formData.append("duration", Math.ceil(durationSeconds));
          }
          const fallbackResponse = await BaseApi.post(
            process.env.NEXT_PUBLIC_API_URL + "/course-resources/videos",
            formData,
            { headers: { "Content-Type": "multipart/form-data" } },
          );
          finishWithResult(fallbackResponse.data.data);
          return;
        }
        throw uploadError;
      }

      setProgress(95);
      setIsProcessing(true);

      const response = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/course-resources/videos/complete",
        {
          curriculum_id: lecture.id,
          uid,
          duration: durationSeconds > 0 ? Math.ceil(durationSeconds) : 0,
          original_name: file.name,
          mime_type: file.type || "video/mp4",
          size_in_bytes: Number(file.size || 0),
        },
      );

      console.log("File uploaded successfully:", response.data.data);
      finishWithResult(response.data.data);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(
        error?.data?.message ||
          error?.message ||
          "Upload failed. Choose the same file and save again to continue.",
      );
    } finally {
      abortRef.current = null;
      setLoading(false);
      setProgress(0);
      setIsProcessing(false);
      setUploadStatus("");
    }
  };

  return (
    <div className="space-y-3">
      <label className="mb-2 block font-normal">Upload Video</label>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#F8FAFB] flex items-center justify-center">
          {videoUploaded ? (
            <SecureVideo
              lessonId={lecture.id}
              src={lecture?.asset?.path || lecture?.videoUrl || ""}
              className="w-full h-[200px] object-cover"
            />
          ) : preview ? (
            <video
              src={preview}
              controls
              className="w-full h-[200px] object-cover"
            />
          ) : (
            <Image
              src="/placeholder-cover.webp"
              alt="Video Placeholder"
              width={150}
              height={100}
              className="w-full"
            />
          )}
        </div>
        <div>
          <p>
            Upload your video file here. Accepted formats: MP4, AVI, MOV.
            Uploads are resumable: if your connection drops, the upload
            continues where it left off.
          </p>
          {pendingUpload && !loading ? (
            <p className="mt-1 text-[13px] text-emerald-700">
              Upload in progress: {pendingUpload.file_name}
              {serverOffsetPercent !== null ? ` (${serverOffsetPercent}% sent)` : ""}.
              {file &&
              (file.name !== pendingUpload.file_name ||
                file.size !== pendingUpload.size_in_bytes)
                ? " The selected file is different; saving will start a new upload."
                : " Choose the same file again and click Resume Upload to continue where it stopped."}
            </p>
          ) : null}
          <label
            htmlFor="video-file"
            className="mt-2 flex gap-2 cursor-pointer"
          >
            <input
              id="video-file"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <span className="border rounded-[5px] p-[10px] w-full text-center max-w-[calc(100%-48px)]">
              <span className="line-clamp-1 block">
                {loading
                  ? isProcessing
                    ? "Processing video..."
                    : STATUS_LABELS[uploadStatus] || `Uploading... ${progress}%`
                  : file
                    ? file.name
                    : "No file chosen"}
              </span>
              {loading && (
                <span className="mt-2 block h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <span
                    className="block h-full rounded-full bg-[#3588FC] transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </span>
              )}
            </span>

            <span className="cursor-pointer min-w-[150px] flex justify-center border border-[#3588FC] text-[#3588FC] font-semibold rounded-[5px] px-[20px] py-[10px] hover:bg-[#3588FC] hover:text-white">
              Choose file
            </span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {loading && !isProcessing ? (
          <button
            onClick={handlePauseUpload}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
          >
            Pause
          </button>
        ) : null}
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded"
        >
          Cancel
        </button>
        <button
          onClick={handleOnUploadClick}
          disabled={!file || loading}
          className="px-4 py-2 cursor-pointer flex items-center justify-center font-bold border-[2px] border-[#0056D2] hover:bg-[#0056D2] hover:text-white text-[#0056D2] rounded"
        >
          <Save size={20} />
          {loading ? "Uploading..." : pendingUpload ? "Resume Upload" : "Save Video"}
        </button>
      </div>
    </div>
  );
}
