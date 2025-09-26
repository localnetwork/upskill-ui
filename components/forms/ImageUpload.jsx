import BaseApi from "@/lib/api/_base.api";
import Image from "next/image";
import { useState } from "react";
export default function ImageUpload({
  value,
  onChange,
  label,
  name,
  description,
}) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    try {
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/media`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log("response", response.data);

      onChange(e);

      //   if (file) {
      //     setIsUploading(true);
      //     onChange(e);
      //   }
    } catch (error) {
      console.log("Error uploading file:", error);
      setIsUploading(false);
    }
  };

  return (
    <div>
      <label className="mb-2 block font-normal" htmlFor={name}>
        {label}
      </label>
      <div className="grid grid-cols-2">
        <div>
          <Image
            src="/placeholder-cover.webp"
            width={300}
            height={200}
            className="w-full"
            alt={`${label}-placeholder`}
          />
        </div>
        <div className="pl-[20px]">
          <p>{description}</p>
          <div className="mt-[10px]">
            <input
              accept="image/*"
              id={name}
              name={name}
              onChange={handleUpload}
              type="file"
              className="sr-only"
            />

            <label htmlFor={name} className="flex gap-[15px]">
              <span className="border border-[oklch(67.22%_0.0355_279.77deg)] rounded-[5px] p-[10px] w-full">
                No File Selected
              </span>

              <span className="cursor-pointer min-w-[150px] flex justify-center border border-[#3588FC] text-[#3588FC] font-semibold rounded-[5px] px-[20px] py-[10px] hover:bg-[#3588FC] hover:text-white">
                Upload file
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
