import AUTHAPI from "@/lib/api/auth/request";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import Spinner from "@/components/icons/Spinner";
import Input from "@/components/forms/Input";
import { extractErrors } from "@/lib/services/errorsExtractor";

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState(null);
  const [payload, setPayload] = useState({ email: "" });

  const onChange = (e) => {
    setPayload((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    toast.dismiss();
    setIsLoading(true);
    setErrors(null);

    try {
      await AUTHAPI.forgotPassword(payload.email);
      toast.success("If your email is registered, a reset link has been sent.");
    } catch (error) {
      setErrors(error?.data?.errors || null);
      toast.error(error?.data?.message || "Failed to request password reset.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-92px)]">
      <div className="container py-[50px]">
        <div className="grid grid-cols-2 max-w-[1140px] mx-auto">
          <div className="pr-[50px] flex flex-col pt-[100px]">
            <Image
              src="/desktop-illustration.webp"
              alt="Forgot password"
              width={1200}
              height={800}
            />
          </div>

          <div className="py-[50px]">
            <h2 className="text-3xl font-bold mb-4">Forgot your password?</h2>
            <p className="text-[#4b4c54] mb-8">
              Enter your email and we&apos;ll send instructions to reset it.
            </p>

            <form className="flex flex-col gap-y-[20px]" onSubmit={onSubmit}>
              <Input
                id="email"
                name="email"
                label="Email"
                value={payload.email}
                onChange={onChange}
                error={extractErrors(errors, "email")}
              />

              <button
                type="submit"
                className={`shadow-md bg-[#0056D2] w-full text-white font-semibold px-[30px] py-[10px] rounded-[8px] inline-flex justify-center items-center gap-[10px] text-[18px] text-center min-w-[150px] ${
                  isLoading ? "opacity-70" : "hover:opacity-90 cursor-pointer"
                }`}
                disabled={isLoading}
              >
                {isLoading && (
                  <Spinner className="w-5 h-5 text-white animate-spin opacity-30" />
                )}
                Send reset link
              </button>
            </form>

            <div className="divider border-b border-[2px] border-[#f5f5f5] my-[40px]" />

            <div className="bg-[#F6F7F9] font-light text-[18px] px-[30px] py-[20px] text-center">
              Remember your password?{" "}
              <Link href="/login" className="text-[#0056D2] underline font-bold">
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
