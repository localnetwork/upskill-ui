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
import Check from "@/components/icons/Check";

export default function Register() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState(null);

  // 👁️ Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState("3"); // default Student

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
      role: e.target.role.value,
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
            <h2 className="text-3xl font-bold mb-[30px]">
              Create Your Account
            </h2>

            <form className="flex flex-col gap-y-[20px]" onSubmit={onRegister}>
              {/* ROLE SELECTION */}
              <div className="relative">
                <label className="text-[#9a9999] text-center w-full mb-2 block">
                  Are you a
                </label>

                <div className="grid grid-cols-2 gap-[15px] mt-6 border-[#ddd] pb-[30px] mb-[30px] border-b">
                  {/* ✅ STUDENT */}
                  <div className="relative">
                    <label
                      htmlFor="role-student"
                      className={`${
                        selectedRole === "3"
                          ? "border-[#3588FC] shadow-md shadow-gray-200"
                          : "border-[#ddd]"
                      } cursor-pointer w-full text-left block select-none p-[10px] rounded-lg border-[2px]  hover:shadow-md hover:shadow-gray-200`}
                    >
                      <div className="flex flex-wrap bg-[#F5F5F7] py-[20px] px-[20px] rounded-lg relative">
                        <div className="w-[70px] mx-auto">
                          <Image
                            src="/student.svg"
                            alt="Student"
                            width={50}
                            height={50}
                            className="h-[100px]"
                          />
                        </div>
                        <div className="w-full text-center mt-3 text-black">
                          <span className="font-bold">Student</span>
                          <p className="text-[12px] text-gray-600 mt-1">
                            I am a student looking to learn new skills.
                          </p>

                          <input
                            type="radio"
                            id="role-student"
                            name="role"
                            value="3"
                            checked={selectedRole === "3"}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="absolute opacity-0 cursor-pointer"
                          />
                        </div>

                        {/* ✅ Show only if selected */}
                        {selectedRole === "3" && (
                          <div className="absolute top-[20px] right-[20px] w-[50px] flex items-center justify-end">
                            <span className="rounded-full p-[5px] border-[#3588FC] bg-[#3588FC] border-[3px] w-[30px] h-[30px] inline-flex items-center justify-center">
                              <Check className="text-white w-[20px]" />
                            </span>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* ✅ TEACHER */}
                  <div className="relative">
                    <label
                      htmlFor="role-teacher"
                      className={`${
                        selectedRole === "2"
                          ? "border-[#3588FC] shadow-md shadow-gray-200"
                          : "border-[#ddd]"
                      } cursor-pointer w-full text-left block select-none p-[10px] rounded-lg border-[2px]  hover:shadow-md hover:shadow-gray-200`}
                    >
                      <div className="flex flex-wrap bg-[#F5F5F7] py-[20px] px-[20px] rounded-lg relative">
                        <div className="w-[70px] mx-auto">
                          <Image
                            src="/teacher.svg"
                            alt="Teacher"
                            width={50}
                            height={50}
                            className="h-[100px]"
                          />
                        </div>
                        <div className="w-full text-center mt-3 text-black">
                          <span className="font-bold">Teacher</span>
                          <p className="text-[12px] text-gray-600 mt-1">
                            I am a teacher looking to share knowledge.
                          </p>

                          <input
                            type="radio"
                            id="role-teacher"
                            name="role"
                            value="2"
                            checked={selectedRole === "2"}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="absolute opacity-0 cursor-pointer"
                          />
                        </div>

                        {/* ✅ Show only if selected */}
                        {selectedRole === "2" && (
                          <div className="absolute top-[20px] right-[20px] w-[50px] flex items-center justify-end">
                            <span className="rounded-full p-[5px] border-[#3588FC] bg-[#3588FC] border-[3px] w-[30px] h-[30px] inline-flex items-center justify-center">
                              <Check className="text-white w-[20px]" />
                            </span>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>

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
