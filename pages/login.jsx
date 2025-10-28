import BaseApi from "@/lib/api/_base.api";
import AUTHAPI from "@/lib/api/auth/request";
import Image from "next/image";
import persistentStore from "@/lib/store/persistentStore";
import { useRouter } from "next/router";
import { useState } from "react";
import Spinner from "@/components/icons/Spinner";
import { extractErrors } from "@/lib/services/errorsExtractor";
import toast from "react-hot-toast";
import { EyeIcon, EyeOffIcon } from "lucide-react"; // 👁️ Eye icons
import Link from "next/link";
import Input from "@/components/forms/Input";
import Password from "@/components/forms/Password";

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState(null);
  const [showPassword, setShowPassword] = useState(false); // 👁️ Toggle state
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

  const onLogin = async (e) => {
    toast.dismiss();
    e.preventDefault();
    setIsLoading(true);

    // const payload = {
    //   username: e.target.username.value,
    //   password: e.target.password.value,
    // };

    try {
      const response = await AUTHAPI.login(payload);
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

  return (
    <div className="min-h-[calc(100vh-92px)]">
      <div className="container py-[50px]">
        <div className="grid grid-cols-2 max-w-[1140px] mx-auto">
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
          <div className="py-[50px]">
            <h2 className="text-3xl font-bold mb-6">
              Log in to continue your learning journey
            </h2>

            <form className="flex flex-col gap-y-[20px]" onSubmit={onLogin}>
              {/* USERNAME / EMAIL */}
              {/* <div className="relative">
                <label className="absolute top-[8px] left-[10px] text-[12px] text-[#9a9999]">
                  Username or Email
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className={`border min-h-[50px] pt-[30px] border-gray-300 rounded-lg py-3 px-[10px] w-full bg-[#F5F5F7] ${
                    extractErrors(errors, "username")
                      ? "border-red-500 shadow-md shadow-red-200"
                      : ""
                  }`}
                />
                {extractErrors(errors, "username") && (
                  <p className="text-red-500 text-[12px] mt-1">
                    {extractErrors(errors, "username")}
                  </p>
                )}
              </div> */}
              <Input
                id="username"
                name="username"
                label="Username or Email"
                value={payload.username || ""}
                onChange={onChange}
                onFocus={onFocus}
                error={extractErrors(errors, "username")}
              />

              {/* PASSWORD with Eye Icon */}

              <Password
                id="password"
                name="password"
                label="Password"
                value={payload.password || ""}
                onChange={onChange}
                onFocus={onFocus}
                error={extractErrors(errors, "password")}
              />
              {/* <div className="relative">
                <label className="absolute top-[8px] left-[10px] text-[12px] text-[#9a9999]">
                  Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className={`border min-h-[50px] pt-[30px] border-gray-300 rounded-lg py-3 px-[10px] w-full bg-[#F5F5F7] ${
                    extractErrors(errors, "password")
                      ? "border-red-500 shadow-md shadow-red-200"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute top-[18px] right-3 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOffIcon size={20} />
                  ) : (
                    <EyeIcon size={20} />
                  )}
                </button>
                {extractErrors(errors, "password") && (
                  <p className="text-red-500 text-[12px] mt-1">
                    {extractErrors(errors, "password")}
                  </p>
                )}
              </div> */}

              {/* SUBMIT BUTTON */}
              <div>
                <button
                  type="submit"
                  className={`shadow-md bg-[#0056D2] w-full text-white font-semibold px-[30px] py-[10px] rounded-[8px] inline-flex justify-center items-center gap-[10px] text-[18px] text-center min-w-[150px] hover:opacity-90 cursor-pointer ${
                    isLoading ? "opacity-70" : "hover:opacity-90 cursor-pointer"
                  }`}
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Spinner className="w-5 h-5 text-white animate-spin opacity-30" />
                  )}
                  Login
                </button>
              </div>
            </form>

            <div className="divider border-b border-[2px] border-[#f5f5f5] my-[40px]" />

            <div className="bg-[#F6F7F9] font-light text-[18px] px-[30px] py-[20px] mt-[20px] text-center border-b border-[#ddd]">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-[#0056D2] underline font-bold"
              >
                Sign up
              </Link>
            </div>
            <div className="bg-[#F6F7F9] px-[30px] py-[20px] text-center">
              <Link
                href="/forgot-password"
                className="text-[#0056D2] underline font-bold"
              >
                Forgot your password?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
