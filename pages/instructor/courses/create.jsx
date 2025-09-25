import { useState } from "react";
import InstructorLayout from "@/components/partials/InstructorLayout";
import BaseApi from "@/lib/api/_base.api";
import toast from "react-hot-toast";
import Spinner from "@/components/icons/Spinner";
import { extractErrors } from "@/lib/services/errorsExtractor";
import { useRouter } from "next/router";
export default function Page() {
  const maxLength = 60;
  const router = useRouter();
  const [payload, setPayload] = useState({
    title: "",
  });
  const [errors, setErrors] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const maxLengthIndicator = (currentLength, maxLength) => {
    return `${currentLength}/${maxLength}`;
  };

  const handleOnChange = (e) => {
    setPayload({ ...payload, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/courses`,
        payload
      );
      router.push(`/instructor/courses/${response.data.data.uuid}/curriculum`);
      setIsLoading(false);
    } catch (error) {
      console.log("error", error);
      toast.error(
        error?.data?.message ||
          "An error occured creating the course. Please try again later."
      );
      setIsLoading(false);
      setErrors(error?.data?.errors);
    }
  };

  return (
    <InstructorLayout>
      <div className="text-center h-full">
        <h1 className="text-[40px] mb-[10px] text-center font-semibold">
          How about a working title?
        </h1>

        <p className="text-[20px] mb-[30px]">
          It's ok if you can't think of a good title now. You can change it
          later.
        </p>

        <div className="relative mt-5 h-full">
          <form onSubmit={handleSubmit}>
            <div className="inline-block relative min-w-[50%]">
              <input
                type="text"
                name="title"
                className={`${
                  errors?.title ? "border-red-500" : "border-gray-300"
                } w-full border  rounded-md p-3 pr-[50px]`}
                placeholder="E.g, Learn PHP Programming from Scratch"
                maxLength={maxLength}
                value={payload.title || ""}
                onChange={handleOnChange}
              />

              {errors?.title && (
                <p className="text-red-500 text-left text-[12px] mt-1">
                  {extractErrors(errors, "title")}
                </p>
              )}
              <span className="absolute right-[15px] top-[18px] text-gray-400 text-[12px]">
                {maxLengthIndicator(payload?.title?.length, maxLength)}
              </span>
            </div>

            <div className="fixed bottom-0 right-0 w-[calc(100%-325px)] p-4 bg-white divider-top flex justify-start">
              <button
                className={`${
                  isLoading
                    ? "!opacity-50 hover:bg-[#0056D2] cursor-not-allowed"
                    : ""
                } max-w-[230px] shadow-md bg-[#0056D2] w-full text-white font-semibold px-[30px] py-[10px] rounded-[50px] inline-flex justify-center items-center gap-[10px] text-[18px] text-center min-w-[150px] hover:opacity-90 cursor-pointer `}
              >
                {isLoading && (
                  <Spinner className="w-5 h-5 text-white animate-spin opacity-30" />
                )}
                {isLoading ? "Creating..." : "Create Course"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </InstructorLayout>
  );
}
