import BaseApi from "@/lib/api/_base.api";
import AUTHAPI from "@/lib/api/auth/request";
import Image from "next/image";
import persistentStore from "@/lib/store/persistentStore";
import { useRouter } from "next/router";
import { useState } from "react";
import Spinner from "@/components/icons/Spinner";
import { extractErrors } from "@/lib/services/errorsExtractor";
import toast from "react-hot-toast";
import { EyeIcon, EyeOffIcon } from "lucide-react"; // 👁️ Icons

export default function Register() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState(null);

  // 👁️ Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onRegister = async (e) => {
    toast.dismiss();
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      username: e.target.username.value,
      email: e.target.email.value,
      password: e.target.password.value,
      confirm_password: e.target.confirm_password.value,
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

  return (
    <div className="bg-[#F5F5F7] min-h-[calc(100vh-92px)]">
      <div className="container py-[50px]">
        <div className="grid grid-cols-2 bg-white min-h-[500px] rounded-lg shadow border-[#ddd] border p-[30px] max-w-[1140px] mx-auto">
          {/* LEFT IMAGE */}
          <div className="pr-[50px] flex items-end">
            <Image src="/register.svg" alt="Login" width={1200} height={800} />
          </div>

          {/* RIGHT FORM */}
          <div className="py-[50px]">
            <h2 className="text-3xl font-bold mb-6">Create Your Account</h2>

            <form className="flex flex-col gap-y-[20px]" onSubmit={onRegister}>
              {/* USERNAME */}
              <div className="relative">
                <label className="absolute top-[8px] left-[10px] text-[12px] text-[#9a9999]">
                  Username
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
              </div>

              <div className="grid grid-cols-2 gap-[15px]">
                {/* FIRSTNAME */}
                <div className="relative">
                  <label className="absolute top-[8px] left-[10px] text-[12px] text-[#9a9999]">
                    Firstname
                  </label>
                  <input
                    type="text"
                    id="firstname"
                    name="firstname"
                    className={`border min-h-[50px] pt-[30px] border-gray-300 rounded-lg py-3 px-[10px] w-full bg-[#F5F5F7] ${
                      extractErrors(errors, "firstname")
                        ? "border-red-500 shadow-md shadow-red-200"
                        : ""
                    }`}
                  />
                  {extractErrors(errors, "firstname") && (
                    <p className="text-red-500 text-[12px] mt-1">
                      {extractErrors(errors, "firstname")}
                    </p>
                  )}
                </div>

                {/* LASTNAME */}
                <div className="relative">
                  <label className="absolute top-[8px] left-[10px] text-[12px] text-[#9a9999]">
                    Lastname
                  </label>
                  <input
                    type="text"
                    id="lastname"
                    name="lastname"
                    className={`border min-h-[50px] pt-[30px] border-gray-300 rounded-lg py-3 px-[10px] w-full bg-[#F5F5F7] ${
                      extractErrors(errors, "lastname")
                        ? "border-red-500 shadow-md shadow-red-200"
                        : ""
                    }`}
                  />
                  {extractErrors(errors, "lastname") && (
                    <p className="text-red-500 text-[12px] mt-1">
                      {extractErrors(errors, "lastname")}
                    </p>
                  )}
                </div>
              </div>

              {/* EMAIL */}
              <div className="relative">
                <label className="absolute top-[8px] left-[10px] text-[12px] text-[#9a9999]">
                  Email Address
                </label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  className={`border min-h-[50px] pt-[30px] border-gray-300 rounded-lg py-3 px-[10px] w-full bg-[#F5F5F7] ${
                    extractErrors(errors, "email")
                      ? "border-red-500 shadow-md shadow-red-200"
                      : ""
                  }`}
                />
                {extractErrors(errors, "email") && (
                  <p className="text-red-500 text-[12px] mt-1">
                    {extractErrors(errors, "email")}
                  </p>
                )}
              </div>

              {/* PASSWORD */}
              <div className="relative">
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
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="relative">
                <label className="absolute top-[8px] left-[10px] text-[12px] text-[#9a9999]">
                  Confirm Password
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm_password"
                  name="confirm_password"
                  className={`border min-h-[50px] pt-[30px] border-gray-300 rounded-lg py-3 px-[10px] w-full bg-[#F5F5F7] ${
                    extractErrors(errors, "confirm_password")
                      ? "border-red-500 shadow-md shadow-red-200"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute top-[18px] right-3 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon size={20} />
                  ) : (
                    <EyeIcon size={20} />
                  )}
                </button>
                {extractErrors(errors, "confirm_password") && (
                  <p className="text-red-500 text-[12px] mt-1">
                    {extractErrors(errors, "confirm_password")}
                  </p>
                )}
              </div>

              {/* SUBMIT */}
              <div>
                <button
                  type="submit"
                  className={`bg-[#0056D2] text-white font-semibold px-[30px] py-[10px] rounded-[50px] inline-flex justify-center items-center gap-[10px] text-[18px] text-center min-w-[150px] ${
                    isLoading ? "opacity-70" : "hover:opacity-90 cursor-pointer"
                  }`}
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Spinner className="w-5 h-5 text-white animate-spin opacity-30" />
                  )}
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
