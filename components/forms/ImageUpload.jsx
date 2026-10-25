"use client";

import BaseApi from "@/lib/api/_base.api";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import Spinner from "../icons/Spinner";

export default function ImageUpload({
  value,
  onChange,
  label,
  name,
  description,
  title,
  preview,
  returnPath = false,
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

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);

    setIsUploading(true);
    setProgress(0);

    try {
      const res = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/media`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
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
          value: returnPath
            ? (data?.path ?? "")
            : (data?.id ?? data?.path ?? data),
        },
      });
    } catch (err) {
      console.error(err);

      toast.error(
        err?.data?.message ||
          err?.response?.data?.message ||
          "An error occurred uploading the image.",
      );
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const openPicker = () => inputRef.current?.click();

  const previewPath =
    uploadedFile?.path || value?.path || preview || "/placeholder-cover.webp";

  const buttonText = uploadedFile ? "Change File" : "Upload File";

  const displayName =
    uploadedFileName ||
    uploadedFile?.title ||
    value?.title ||
    (uploadedFile?.path && "Existing File") ||
    "No File Selected";

  return (
    <div className="w-full min-w-0">
      <span className="mb-2 block font-normal">{label}</span>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-0">
        {/* Image preview */}
        <div className="relative min-w-0">
          {isUploading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
              <Spinner className="h-[30px] w-[30px]" />
            </div>
          )}

          <Image
            src={previewPath}
            width={300}
            height={200}
            className="aspect-[16/9] w-full border border-[oklch(86.72%_0.0192_282.72deg)] bg-black object-cover"
            alt={`${label || "Image"}-preview`}
            sizes="(max-width: 639px) 100vw, 50vw"
          />
        </div>

        {/* Description and upload controls */}
        <div className="min-w-0 sm:pl-[20px]">
          {description && (
            <p className="break-words text-sm sm:text-base">{description}</p>
          )}

          <div className="mt-[10px] min-w-0">
            <input
              id={idRef.current}
              name={name}
              type="file"
              accept="image/*"
              ref={inputRef}
              onChange={handleUpload}
              disabled={isUploading}
              className="sr-only"
            />

            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:gap-[15px]">
              <button
                type="button"
                onClick={openPicker}
                disabled={isUploading}
                className="min-w-0 flex-1 cursor-pointer"
              >
                <span className="block w-full overflow-hidden rounded-[5px] border p-[10px] text-center line-clamp-1">
                  {isUploading ? `Uploading... ${progress}%` : displayName}
                </span>
              </button>

              <button
                type="button"
                onClick={openPicker}
                disabled={isUploading}
                className={`flex w-full shrink-0 cursor-pointer items-center justify-center rounded-[5px] border border-[#3588FC] px-[20px] py-[10px] text-center font-semibold text-[#3588FC] hover:bg-[#3588FC] hover:text-white sm:w-auto sm:min-w-[150px] ${
                  isUploading ? "pointer-events-none opacity-60" : ""
                }`}
              >
                {buttonText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
