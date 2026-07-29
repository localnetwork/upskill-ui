import { useState } from "react";
import InstructorLayout from "@/components/partials/InstructorLayout";
import BaseApi from "@/lib/api/_base.api";
import toast from "react-hot-toast";
import Spinner from "@/components/icons/Spinner";
import { extractErrors } from "@/lib/services/errorsExtractor";
import { useRouter } from "next/router";
import CategoryPicker, { getMergedCategoryIds } from "@/components/forms/CategoryPicker";
export default function Page() {
  const maxLength = 60;
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [payload, setPayload] = useState({
    title: "",
    category_ids: [],
  });
  const [errors, setErrors] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const maxLengthIndicator = (currentLength, maxLength) => {
    return `${currentLength}/${maxLength}`;
  };

  const handleOnChange = (e) => {
    setPayload({ ...payload, [e.target.name]: e.target.value });
  };

  const isTitleStepValid = String(payload.title || "").trim().length >= 3;
  const isCategoryStepValid = getMergedCategoryIds(payload.category_ids).length > 0;

  const handleNextStep = () => {
    if (!isTitleStepValid) {
      toast.error("Please add a course title with at least 3 characters.");
      return;
    }
    setStep(2);
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isCategoryStepValid) {
      toast.error("Please choose at least one category.");
      return;
    }

    setIsLoading(true);

    const submitPayload = {
      title: String(payload.title || "").trim(),
      category_ids: getMergedCategoryIds(payload.category_ids),
    };

    try {
      const response = await BaseApi.post(
        `${process.env.NEXT_PUBLIC_API_URL}/courses`,
        submitPayload,
      );
      router.push(`/instructor/courses/${response.data.data.slug}/curriculum`);
      setIsLoading(false);
    } catch (error) {
      toast.error(
        error?.data?.message ||
          "An error occured creating the course. Please try again later.",
      );
      setIsLoading(false);
      setErrors(error?.data?.details?.issues);
    }
  };

  return (
    <InstructorLayout>
      <div className="text-center h-full">
        <h1 className="text-[40px] mb-[10px] text-center font-semibold">
          {step === 1 ? "How about a working title?" : "Choose your category"}
        </h1>

        <p className="text-[20px] mb-[30px]">
          {step === 1
            ? "It's ok if you can't think of a good title now. You can change it later."
            : "Pick the category that best fits your course, then choose the most relevant child category."}
        </p>
        <p className="text-[14px] text-[#64748b] mb-[25px]">
          Step {step} of 2
        </p>

        <div className="relative mt-5 h-full">
          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <div className="inline-block relative min-w-[50%]">
                <input
                  type="text"
                  name="title"
                  className={`${
                    extractErrors(errors, "title")
                      ? "border-red-500"
                      : "border-gray-300"
                  } w-full border rounded-md p-3 pr-[50px]`}
                  placeholder="E.g, Learn PHP Programming from Scratch"
                  maxLength={maxLength}
                  value={payload.title || ""}
                  onChange={handleOnChange}
                />

                {extractErrors(errors, "title") && (
                  <p className="text-red-500 text-left text-[12px] mt-1">
                    {extractErrors(errors, "title")}
                  </p>
                )}
                <span className="absolute right-[15px] top-[18px] text-gray-400 text-[12px]">
                  {maxLengthIndicator(payload?.title?.length, maxLength)}
                </span>
              </div>
            ) : (
              <div className="mx-auto w-full max-w-4xl text-left">
                <CategoryPicker
                  label="Course Category"
                  name="category_ids"
                  value={payload.category_ids}
                  onChange={(selected) =>
                    setPayload((prev) => ({ ...prev, category_ids: selected }))
                  }
                  error={
                    extractErrors(errors, "category_ids") ||
                    extractErrors(errors, "categoryId") ||
                    extractErrors(errors, "category_id")
                  }
                  showIcons
                />
              </div>
            )}

            <div className="fixed bottom-0 right-0 w-[calc(100%-325px)] p-4 bg-white divider-top flex justify-start">
              {step === 2 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="max-w-[180px] mr-3 border border-[#cbd5e1] bg-white w-full text-[#334155] font-semibold px-[30px] py-[10px] rounded-[50px] inline-flex justify-center items-center gap-[10px] text-[16px] text-center min-w-[120px] hover:bg-[#f8fafc]"
                >
                  Back
                </button>
              )}

              {step === 1 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={`${
                    !isTitleStepValid
                      ? "!opacity-50 cursor-not-allowed hover:bg-[#0056D2]"
                      : ""
                  } max-w-[230px] shadow-md bg-[#0056D2] w-full text-white font-semibold px-[30px] py-[10px] rounded-[50px] inline-flex justify-center items-center gap-[10px] text-[18px] text-center min-w-[150px] hover:opacity-90`}
                  disabled={!isTitleStepValid}
                >
                  Next
                </button>
              ) : (
                <button
                  className={`${
                    isLoading || !isCategoryStepValid
                      ? "!opacity-50 hover:bg-[#0056D2] cursor-not-allowed"
                      : ""
                  } max-w-[230px] shadow-md bg-[#0056D2] w-full text-white font-semibold px-[30px] py-[10px] rounded-[50px] inline-flex justify-center items-center gap-[10px] text-[18px] text-center min-w-[150px] hover:opacity-90 cursor-pointer`}
                  disabled={isLoading || !isCategoryStepValid}
                >
                  {isLoading && (
                    <Spinner className="w-5 h-5 text-white animate-spin opacity-30" />
                  )}
                  {isLoading ? "Creating..." : "Create Course"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </InstructorLayout>
  );
}
