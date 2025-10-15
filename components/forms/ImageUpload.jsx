"use client";
import BaseApi from "@/lib/api/_base.api";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import Spinner from "../icons/Spinner";

export default function ImageUpload({
  value, // e.g. { id, path, title } from DB
  onChange,
  label,
  name,
  description,
  title,
  preview,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [uploadedFile, setUploadedFile] = useState(value || null);
  const inputRef = useRef(null);

  const idRef = useRef(
    name
      ? `${name}-${Math.random().toString(36).slice(2, 9)}`
      : `file-${Math.random().toString(36).slice(2, 9)}`
  );

  const handleUpload = async (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    // ✅ Use the file name as title
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
            if (evt.lengthComputable) {
              setProgress(Math.round((evt.loaded / evt.total) * 100));
            }
          },
        }
      );

      const data = res.data;
      setUploadedFileName(file.name);
      setUploadedFile(data);
      if (inputRef.current) inputRef.current.value = "";

      onChange?.({
        target: {
          name,
          value: data?.id ?? data?.path ?? data,
        },
      });
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "An error occurred uploading the image."
      );
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const apiDomain = process.env.NEXT_PUBLIC_API_DOMAIN || "";

  // const previewPath = uploadedFile?.path
  //   ? apiDomain + uploadedFile.path
  //   : value?.path
  //     ? apiDomain + value.path
  //     : preview
  //       ? apiDomain + preview
  //       : "/placeholder-cover.webp";

  const previewPath = uploadedFile?.path
    ? apiDomain + uploadedFile.path
    : value?.path
      ? apiDomain + value.path
      : "/placeholder-cover.webp";

  const buttonText = uploadedFile ? "Change File" : "Upload File";
  const displayName =
    uploadedFileName ||
    uploadedFile?.title ||
    value.title ||
    (uploadedFile?.path && "Existing File") ||
    "No File Selected";
  return (
    <div>
      <label className="mb-2 block font-normal" htmlFor={idRef.current}>
        {label}
      </label>

      <div className="grid grid-cols-2">
        <div className="relative">
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Spinner className="w-[30px] h-[30px]" />
            </div>
          )}
          <Image
            src={previewPath}
            width={300}
            height={200}
            className="w-full object-cover aspect-[16/9] border border-[oklch(86.72%_0.0192_282.72deg)] bg-black"
            alt={`${label}-preview`}
          />
        </div>

        <div className="pl-[20px]">
          <p>{description}</p>
          <div className="mt-[10px]">
            <input
              id={idRef.current}
              name={name}
              type="file"
              accept="image/*"
              ref={inputRef}
              onChange={handleUpload}
              className="sr-only"
            />

            <label htmlFor={idRef.current} className="flex gap-[15px]">
              <span className="border rounded-[5px] p-[10px] w-full text-center line-clamp-1">
                {isUploading ? `Uploading... ${progress}%` : displayName}
              </span>

              <span className="cursor-pointer min-w-[150px] flex justify-center border border-[#3588FC] text-[#3588FC] font-semibold rounded-[5px] px-[20px] py-[10px] hover:bg-[#3588FC] hover:text-white">
                {buttonText}
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
