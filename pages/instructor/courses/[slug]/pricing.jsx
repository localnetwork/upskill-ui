import CourseManagementLayout from "@/components/partials/CourseManagementLayout";
import BaseApi from "@/lib/api/_base.api";
import priceTiers from "@/lib/preBuildScripts/static/price-tiers";
import { setContext } from "@/lib/api/interceptor";
import { useState } from "react";
import { toast } from "react-hot-toast"; // ✅ make sure you have this imported
import { extractErrors } from "@/lib/services/errorsExtractor";
export async function getServerSideProps(context) {
  const { slug } = context.params;

  setContext(context);

  let course = null;
  try {
    const response = await BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/courses/${slug}`
    );
    course = response?.data?.data;
  } catch (error) {
    console.error("Error fetching course:", error);
    return { notFound: true };
  }

  return {
    props: { course },
  };
}

export default function Pricing({ course }) {
  const [payload, setPayload] = useState({});
  const [errors, setErrors] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Build payload synchronously
    const formData = new FormData(e.target);
    const newPayload = {};
    formData.forEach((value, key) => {
      newPayload[key] = value;
    });

    setPayload(newPayload);

    try {
      const response = await BaseApi.put(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${course.uuid}/pricing`,
        newPayload
      );
      console.log("Pricing saved successfully:", response.data);
      toast.success("Pricing saved successfully");
      setErrors(null);
    } catch (error) {
      console.error("Error submitting pricing:", error);
      setErrors(error?.data?.errors);
    }
  };

  console.log("course", course?.price_tier?.id);

  return (
    <CourseManagementLayout course={course} activeTab="pricing" title="Pricing">
      <p className="font-semibold">Set a price for your course</p>
      <p>
        Please select the currency and the price tier for your course. If you’d
        like to offer your <br /> course for free, it must have a total video
        length of less than 2 hours. Also, courses <br /> with practice tests
        cannot be free.
      </p>

      <div className="flex flex-wrap">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[400px] flex flex-col gap-[15px] mt-[20px]"
        >
          <div>
            <label
              className="font-semibold inline-block mb-2"
              htmlFor="price_tier"
            >
              Price Tier
            </label>
            <select
              className={`border ${
                errors && extractErrors(errors, "price_tier")
                  ? "border-red-500"
                  : "border-[oklch(67.22%_0.0355_279.77deg)]"
              } rounded-[5px] p-[10px] w-full`}
              name="price_tier"
              id="price_tier"
              defaultValue={course?.price_tier?.id || ""}
            >
              <option value="" disabled>
                Select a price tier
              </option>
              {priceTiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  PHP {tier.price} ({tier.title})
                </option>
              ))}
            </select>

            {extractErrors(errors, "price_tier") && (
              <div className="text-red-500 text-sm mt-1">
                {extractErrors(errors, "price_tier")}
              </div>
            )}
          </div>

          <div className="mt-2">
            <button
              type="submit"
              className="bg-[#0056D2] cursor-pointer flex items-center justify-center min-w-[200px] font-semibold text-white px-[30px] py-[10px] rounded-[5px] hover:bg-[#1d6de0]"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </CourseManagementLayout>
  );
}
