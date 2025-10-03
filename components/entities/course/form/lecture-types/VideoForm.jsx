"use client";
import BaseApi from "@/lib/api/_base.api";
import Image from "next/image";
import { useState } from "react";

export default function VideoForm({ onSave, onCancel, lecture }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null); // 👈 local preview URL
  const [uploadedVideo, setUploadedVideo] = useState(null); // 👈 from API after save
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile)); // show video preview
    setUploadedVideo(null); // reset any previously uploaded video
  };

  const handleOnUploadClick = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("curriculum_id", lecture.id);

    try {
      setLoading(true);
      const response = await BaseApi.post(
        process.env.NEXT_PUBLIC_API_URL + "/course-resources/videos",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("File uploaded successfully:", response.data.data);

      // Normalize uploaded video data
      const videoUrl = response.data?.url || response.data?.path || null;

      if (videoUrl) {
        setUploadedVideo(videoUrl);
        setPreview(null); // remove local preview once uploaded
      }

      // ✅ Pass updated video info back to parent
      if (onSave) {
        onSave({
          ...response.data.data.curriculum,
          asset: response.data.data.asset,
        });
      }

      // reset file input after success
      setFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="mb-2 block font-normal">Upload Video</label>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#F8FAFB] flex items-center justify-center">
          {uploadedVideo ? (
            <video
              src={uploadedVideo}
              controls
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
            size: 500MB.
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
            <span className="border rounded-[5px] p-[10px] w-full text-center">
              {file ? file.name : "No file chosen"}
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
          className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Save Video"}
        </button>
      </div>
    </div>
  );
}
