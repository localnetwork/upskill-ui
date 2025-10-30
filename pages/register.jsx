import BaseApi from "@/lib/api/_base.api";
import AUTHAPI from "@/lib/api/auth/request";
import Image from "next/image";
import persistentStore from "@/lib/store/persistentStore";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Spinner from "@/components/icons/Spinner";
import { extractErrors } from "@/lib/services/errorsExtractor";
import toast from "react-hot-toast";
import { EyeIcon, EyeOffIcon } from "lucide-react"; // 👁️ Icons
import Check from "@/components/icons/Check";
import Input from "@/components/forms/Input";
import Password from "@/components/forms/Password";
import Link from "next/link";

export default function Register() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState(null);

  // 👁️ Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("3"); // default Student
  const [payload, setPayload] = useState({});

  const [isFocused, setIsFocused] = useState(false);

  const onChange = (e) => {
    setPayload({ ...payload, [e.target.name]: e.target.value });
  };

  const onFocus = (e) => {
    setIsFocused({
      [e.target.name]: true,
    });
  };

  const onRegister = async (e) => {
    toast.dismiss();
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      username: e.target.username.value,
      email: e.target.email.value,
      password: e.target.password.value,
      confirm_password: e.target.confirm_password.value,
      firstname: e.target.firstname.value,
      lastname: e.target.lastname.value,
      role: router?.query?.mode === "instructor" ? "2" : "3",
    };

    try {
      const response = await AUTHAPI.register(payload);
      persistentStore.setState({ profile: response?.data?.user });
      router.push("/");
    } catch (error) {
      console.log("Error", error);
      setErrors(error?.data?.errors);
      if (error?.data?.message) toast.error(error.data.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!router.isReady) return;

    if (
      !router.query.mode ||
      (router.query.mode !== "instructor" && router.query.mode !== "student")
    ) {
      router.replace("/register?mode=student");
    }
  }, [router.isReady, router.query.mode]);

  return (
    <div className="min-h-[calc(100vh-92px)] py-[30px]">
      <div className="container py-[50px]">
        <div className="grid grid-cols-2 min-h-[500px] rounded-lg max-w-[1140px] mx-auto">
          {/* LEFT IMAGE */}
          <div className="pr-[50px] flex flex-col pt-[100px]">
            <Image
              src="/desktop-illustration.webp"
              alt="Login"
              width={1200}
              height={800}
            />
          </div>

          {/* RIGHT FORM */}
          <div className="">
            {router.query.mode == "student" && (
              <div className="pb-[50px]">
                <h1 className="pb-[10px] font-medium text-[40px] text-[#2a2b3f]">
                  Create an account
                </h1>
                <p className="text-[16px] font-light text-gray-600">
                  Start your learning journey today and unlock your potential
                  with expert-led courses.
                </p>
              </div>
            )}

            {router.query.mode == "instructor" && (
              <div className="pb-[50px]">
                <h1 className="pb-[10px] font-medium text-[40px] text-[#2a2b3f] ">
                  Become a Upskill Instructor
                </h1>
                <p className="text-[16px] font-light text-gray-600">
                  Discover a supportive community of online instructors. Get
                  instant access to all course creation resources.
                </p>
              </div>
            )}

            <form className="flex flex-col gap-y-[20px]" onSubmit={onRegister}>
              <div className="grid gap-[15px]">
                {/* USERNAME */}
                <Input
                  id="username"
                  name="username"
                  label="Username"
                  value={payload.username || ""}
                  onChange={onChange}
                  onFocus={onFocus}
                  error={extractErrors(errors, "username")}
                />

                <Input
                  id="email"
                  name="email"
                  label="Email"
                  value={payload.email || ""}
                  onChange={onChange}
                  onFocus={onFocus}
                  error={extractErrors(errors, "email")}
                />

                <Input
                  id="firstname"
                  name="firstname"
                  label="First Name"
                  value={payload.firstname || ""}
                  onChange={onChange}
                  onFocus={onFocus}
                  error={extractErrors(errors, "firstname")}
                />

                <Input
                  id="lastname"
                  name="lastname"
                  label="Last Name"
                  value={payload.lastname || ""}
                  onChange={onChange}
                  onFocus={onFocus}
                  error={extractErrors(errors, "lastname")}
                />

                <Password
                  id="password"
                  name="password"
                  label="Password"
                  value={payload.password || ""}
                  onChange={onChange}
                  onFocus={onFocus}
                  error={extractErrors(errors, "password")}
                />
                <Password
                  id="confirm_password"
                  name="confirm_password"
                  label="Confirm Password"
                  value={payload.confirm_password || ""}
                  onChange={onChange}
                  onFocus={onFocus}
                  error={extractErrors(errors, "confirm_password")}
                />
              </div>

              {/* SUBMIT */}
              <div>
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
                  Continue
                </button>
              </div>
            </form>

            <div className="divider border-b border-[2px] border-[#f5f5f5] my-[40px]" />

            <p className="text-[14px] text-center">
              By signing up, you agree to our{" "}
              <Link href="/terms" className="text-[#0056D2] underline">
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[#0056D2] underline">
                Privacy Policy
              </Link>
              .
            </p>

            <div className="bg-[#F6F7F9] font-light text-[18px] px-[30px] py-[20px] rounded-[10px] mt-[50px] text-center">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#0056D2] underline font-bold"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
