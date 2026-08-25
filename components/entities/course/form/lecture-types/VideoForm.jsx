"use client";
import BaseApi from "@/lib/api/_base.api";
import SecureVideo from "@/components/video-players/SecureVideo";
import { Save } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function VideoForm({ onSave, onCancel, lecture }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null); // 👈 local preview URL
  const [videoUploaded, setVideoUploaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setVideoUploaded(false);
    setProgress(0);
    setIsProcessing(false);

    const previewUrl = URL.createObjectURL(selectedFile);
    setPreview(previewUrl);

    // ✅ create a hidden video element to extract duration
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

  const handleOnUploadClick = async () => {
    if (!file) return;
    if (Number(file.size || 0) > 200 * 1024 * 1024) {
      window.alert(
        "This upload flow supports up to 200MB. Please use a smaller file or implement tus/resumable upload for larger videos.",
      );
      return;
    }

    try {
      setLoading(true);
      setProgress(0);
      setIsProcessing(false);
      const durationSeconds = Number(file.duration || 0);
      const directUploadResponse = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/course-resources/videos/direct-upload-url",
        {
          curriculum_id: lecture.id,
          duration: durationSeconds > 0 ? Math.ceil(durationSeconds) : 3600,
          file_name: file.name,
        },
      );
      const uploadUrl = String(
        directUploadResponse?.data?.data?.upload_url || "",
      ).trim();
      const uid = String(directUploadResponse?.data?.data?.uid || "").trim();
      if (!uploadUrl || !uid) {
        throw new Error("Missing Cloudflare direct upload URL or uid");
      }

      const cloudflareFormData = new FormData();
      cloudflareFormData.append("file", file);
      let uploadedToCloudflare = false;
      try {
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          body: cloudflareFormData,
        });
        if (!uploadResponse.ok) {
          throw new Error(
            `Cloudflare upload failed with status ${uploadResponse.status}`,
          );
        }
        uploadedToCloudflare = true;
      } catch (_directUploadError) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("curriculum_id", lecture.id);
        if (durationSeconds > 0) {
          formData.append("duration", Math.ceil(durationSeconds));
        }

        const fallbackResponse = await BaseApi.post(
          process.env.NEXT_PUBLIC_API_URL + "/course-resources/videos",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        console.log(
          "Direct upload was blocked (likely CORS); fallback upload succeeded:",
          fallbackResponse.data.data,
        );
        setVideoUploaded(true);
        setPreview(null);
        if (onSave) {
          onSave({
            ...fallbackResponse.data.data.curriculum,
            asset: fallbackResponse.data.data.asset,
          });
        }
        setFile(null);
        return;
      }

      if (!uploadedToCloudflare) {
        throw new Error("Cloudflare direct upload did not complete");
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

      setVideoUploaded(true);
      setPreview(null);

      if (onSave) {
        onSave({
          ...response.data.data.curriculum,
          asset: response.data.data.asset,
        });
      }

      setFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setLoading(false);
      setProgress(0);
      setIsProcessing(false);
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
            Upload your video file here. Accepted formats: MP4, AVI, MOV. Max
            size: 200MB.
          </p>
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
                    : `Uploading... ${progress}%`
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
          {loading ? "Uploading..." : "Save Video"}
        </button>
      </div>
    </div>
  );
}
