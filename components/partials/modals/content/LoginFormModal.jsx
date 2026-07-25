import BaseApi from "@/lib/api/_base.api";
import AUTHAPI from "@/lib/api/auth/request";
import Image from "next/image";
import persistentStore from "@/lib/store/persistentStore";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Spinner from "@/components/icons/Spinner";
import { extractErrors } from "@/lib/services/errorsExtractor";
import toast from "react-hot-toast";
import { EyeIcon, EyeOffIcon } from "lucide-react"; // 👁️ Eye icons
import Link from "next/link";
import Input from "@/components/forms/Input";
import Password from "@/components/forms/Password";
import modalState from "@/lib/store/modalState";
export default function LoginFormModal() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState(null);
  const [showPassword, setShowPassword] = useState(false); // 👁️ Toggle state
  const [payload, setPayload] = useState({});
  const modalInfo = modalState((state) => state.modalInfo);
  const [isFocused, setIsFocused] = useState(false);

  const headingText =
    modalInfo?.type === "LOGIN_ADD_TO_CART"
      ? "Log in to add this course to your cart"
      : "Log in to continue your learning journey";

  const onChange = (e) => {
    setPayload({ ...payload, [e.target.name]: e.target.value });
  };

  const onFocus = (e) => {
    setIsFocused({
      [e.target.name]: true,
    });
  };

  const modalClose = () => {
    modalState.setState({
      modalInfo: null,
    });
  };

  const onLogin = async (e) => {
    toast.dismiss();
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await AUTHAPI.login(payload);

      if (response?.data?.requires_2fa) {
        persistentStore.setState({
          preAuthToken: response?.data?.pre_auth_token,
        });
        toast.success("Enter your 2FA code");
        modalClose();
        router.push("/verify-2fa");
        return;
      }

      if (response?.data?.token && response?.data?.user) {
        persistentStore.setState({
          profile: response?.data?.user,
          token: response?.data?.token,
          preAuthToken: null,
        });
        modalClose();
        toast.success("Login successful!");
        window.location.href = "/";
        return;
      }

      toast.error("Unexpected response from server");
    } catch (error) {
      console.log("Error", error);
      setErrors(error?.data?.errors);
      if (error?.data?.message) toast.error(error.data.message);
      else toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (modalInfo) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    }

    // Cleanup function to ensure overflow is restored when component unmounts
    return () => {
      document.body.style.overflow = "auto";
      document.documentElement.style.overflow = "auto";
    };
  }, [modalInfo]);

  return (
    <>
      <h2 className="text-3xl font-bold mb-6">
        {headingText}
      </h2>
      {modalInfo?.message ? (
        <p className="text-sm text-slate-600 mb-5">{modalInfo.message}</p>
      ) : null}

      <form className="flex flex-col gap-y-[20px]" onSubmit={onLogin}>
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
          onClick={modalClose}
        >
          Sign up
        </Link>
      </div>
      <div className="bg-[#F6F7F9] px-[30px] py-[20px] text-center">
        <Link
          href="/forgot-password"
          className="text-[#0056D2] underline font-bold"
          onClick={modalClose}
        >
          Forgot your password?
        </Link>
      </div>
    </>
  );
}
