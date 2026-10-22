"use client";

import BaseApi from "@/lib/api/_base.api";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import Spinner from "../icons/Spinner";

export default function PromoVideo({
  value,
  onChange,
  label,
  name,
  description,
  title,
  preview,
  courseManagement,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFile, setUploadedFile] = useState(value || null);
  const inputRef = useRef(null);

  const idRef = useRef(
    name
      ? `${name}-${Math.random().toString(36).slice(2, 9)}`
      : `file-${Math.random().toString(36).slice(2, 9)}`,
  );

  useEffect(() => {
    setUploadedFile(value || null);
  }, [value]);

  const handleUpload = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    if (!courseManagement?.uuid) {
      toast.error("Course information is missing.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("promo_video", file);
    formData.append("title", file.name);
    formData.append("course_uuid", courseManagement.uuid);

    setIsUploading(true);
    setProgress(0);

    try {
      const res = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseManagement.uuid}/promo-video`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (evt) => {
            if (evt.total) {
              setProgress(Math.round((evt.loaded / evt.total) * 100));
            }
          },
        },
      );

      const data = res.data;

      setUploadedFileName(file.name);
      setUploadedFile(data);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      onChange?.({
        target: {
          name,
          value: data?.id ?? data?.path ?? data,
        },
      });
    } catch (err) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ||
          err?.data?.message ||
          "An error occurred uploading the video.",
      );
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const previewPath =
    uploadedFile?.path || value?.path || preview || "/placeholder-cover.webp";

  const isImage = /\.(webp|jpe?g|png|gif|avif|svg)(\?.*)?$/i.test(previewPath);

  const buttonText = uploadedFile ? "Change File" : "Upload File";

  const displayName =
    uploadedFileName ||
    uploadedFile?.title ||
    value?.title ||
    (uploadedFile?.path && "Existing File") ||
    "No File Selected";

  return (
    <div className="w-full min-w-0">
      {/* Label */}
      {label && (
        <label
          className="mb-2 block text-sm font-normal sm:text-base"
          htmlFor={idRef.current}
        >
          {label}
        </label>
      )}

      {/* Responsive preview and upload controls */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:gap-5 lg:gap-6">
        {/* Preview */}
        <div className="relative min-w-0 overflow-hidden rounded-md">
          {isImage ? (
            <Image
              src={previewPath}
              width={300}
              height={200}
              alt={`${label || "Promotional video"} preview`}
              className="aspect-video h-auto w-full border border-[oklch(86.72%_0.0192_282.72deg)] bg-black object-cover"
              unoptimized={previewPath.startsWith("http")}
            />
          ) : (
            <video
              src={previewPath}
              controls
              preload="metadata"
              className="aspect-video h-auto w-full border border-[oklch(86.72%_0.0192_282.72deg)] bg-black object-contain"
            >
              Your browser does not support the video element.
            </video>
          )}

          {isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70">
              <Spinner className="h-7 w-7 sm:h-[30px] sm:w-[30px]" />
              <span className="text-xs font-medium text-gray-700 sm:text-sm">
                Uploading {progress}%
              </span>
            </div>
          )}
        </div>

        {/* Description and file controls */}
        <div className="flex min-w-0 flex-col justify-center">
          {description && (
            <p className="break-words text-sm leading-relaxed text-gray-600 sm:text-base">
              {description}
            </p>
          )}

          <input
            id={idRef.current}
            name={name}
            type="file"
            accept="video/*"
            ref={inputRef}
            onChange={handleUpload}
            disabled={isUploading}
            className="sr-only"
          />

          <div className="mt-3 flex min-w-0 flex-col gap-2 sm:mt-4 lg:flex-row">
            {/* File name */}
            <div
              className="flex min-h-11 min-w-0 flex-1 items-center rounded-md border px-3 py-2 text-sm sm:text-base"
              title={displayName}
            >
              <span className="truncate">
                {isUploading ? `Uploading... ${progress}%` : displayName}
              </span>
            </div>

            {/* Upload button */}
            <label
              htmlFor={idRef.current}
              aria-disabled={isUploading}
              className={`inline-flex min-h-11 w-full items-center justify-center rounded-md border border-[#3588FC] px-4 py-2 text-sm font-semibold text-[#3588FC] transition-colors sm:text-base lg:w-auto lg:min-w-[130px] ${
                isUploading
                  ? "cursor-not-allowed opacity-50"
                  : "cursor-pointer hover:bg-[#3588FC] hover:text-white"
              }`}
            >
              {buttonText}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
