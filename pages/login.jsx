import BaseApi from "@/lib/api/_base.api";
import AUTHAPI from "@/lib/api/auth/request";
import Image from "next/image";
import persistentStore from "@/lib/store/persistentStore";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import Spinner from "@/components/icons/Spinner";
import { extractErrors } from "@/lib/services/errorsExtractor";
import toast from "react-hot-toast";
import Link from "next/link";
import Input from "@/components/forms/Input";
import Password from "@/components/forms/Password";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import {
  validateAuthField,
  validateAuthForm,
} from "@/lib/services/authInlineValidation";

export default function Login({ googleClientId }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState(null);
  const [payload, setPayload] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, values, isTouched = touched) => {
    if (!isTouched[name]) return;
    setFieldErrors((prev) => ({
      ...prev,
      [name]: validateAuthField("login", name, values),
    }));
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    const values = { ...payload, [name]: value };
    setPayload(values);
    setErrors(null);
    validateField(name, values);
  };

  const onBlur = (e) => {
    const { name } = e.target;
    const nextTouched = { ...touched, [name]: true };
    setTouched(nextTouched);
    validateField(name, payload, nextTouched);
  };

  const errorFor = (field) =>
    fieldErrors[field] || extractErrors(errors, field);

  const onFocus = (e) => {
    // Preserve compatibility with your existing form components.
  };

  const onLogin = async (e) => {
    e.preventDefault();
    toast.dismiss();

    const inlineErrors = validateAuthForm("login", payload);

    if (inlineErrors) {
      setFieldErrors(inlineErrors);
      setTouched({ username: true, password: true });
      return;
    }

    setFieldErrors({});
    setErrors(null);
    setIsLoading(true);

    try {
      const response = await AUTHAPI.login(payload);

      if (response?.data?.requires_2fa) {
        toast.success("Enter your 2FA code");

        persistentStore.setState({
          preAuthToken: response.data.pre_auth_token,
        });

        router.push("/verify-2fa");
        return;
      }

      if (response?.data?.token && response?.data?.user) {
        persistentStore.setState({
          profile: response.data.user,
          token: response.data.token,
          preAuthToken: null,
        });

        toast.success("Login successful!");
        window.location.href = "/";
        return;
      }

      toast.error("Unexpected response from server");
    } catch (error) {
      console.error("Login error:", error);
      setErrors(error?.data?.errors);

      toast.error(error?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleCredential = useCallback(
    async (idToken) => {
      toast.dismiss();
      setIsLoading(true);

      try {
        const response = await AUTHAPI.googleAuth({
          idToken,
          intent: "login",
        });

        if (response?.data?.requires_2fa) {
          toast.success("Enter your 2FA code");

          persistentStore.setState({
            preAuthToken: response.data.pre_auth_token,
          });

          router.push("/verify-2fa");
          return;
        }

        if (response?.data?.token && response?.data?.user) {
          persistentStore.setState({
            profile: response.data.user,
            token: response.data.token,
            preAuthToken: null,
          });

          toast.success("Login successful!");
          window.location.href = "/";
          return;
        }

        toast.error("Unexpected response from server");
      } catch (error) {
        toast.error(
          error?.data?.message || "Google login failed. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [router],
  );

  return (
    <main className="min-h-[calc(100vh-92px)] w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-8 lg:gap-14">
          {/* LEFT ILLUSTRATION */}
          <div className="hidden items-center justify-center md:flex">
            <div className="relative w-full max-w-xl">
              <Image
                src="/desktop-illustration.webp"
                alt="Login illustration"
                width={1200}
                height={800}
                priority
                className="h-auto w-full object-contain"
                sizes="(min-width: 1024px) 50vw, 45vw"
              />
            </div>
          </div>

          {/* RIGHT FORM */}
          <div className="mx-auto w-full max-w-lg py-2 sm:py-4 md:max-w-none md:py-6 lg:py-10">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl lg:text-4xl">
                Log in to continue your learning journey
              </h1>

              <p className="mt-3 text-sm leading-6 text-gray-500 sm:text-base">
                Welcome back! Enter your credentials to continue learning.
              </p>
            </div>

            <form
              className="flex flex-col gap-y-5 sm:gap-y-6"
              onSubmit={onLogin}
            >
              <Input
                id="username"
                name="username"
                label="Username or Email"
                value={payload.username || ""}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                error={errorFor("username")}
              />

              <Password
                id="password"
                name="password"
                label="Password"
                value={payload.password || ""}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                error={errorFor("password")}
              />

              <button
                type="submit"
                className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0056D2] px-5 py-3 text-base font-semibold text-white shadow-md transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0056D2] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 sm:text-lg ${
                  isLoading ? "cursor-not-allowed" : "cursor-pointer"
                }`}
                disabled={isLoading}
              >
                {isLoading && (
                  <Spinner className="h-5 w-5 animate-spin text-white" />
                )}
                {isLoading ? "Please wait..." : "Login"}
              </button>
            </form>

            {/* DIVIDER */}
            <div className="my-7 flex items-center gap-4 sm:my-8">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400 sm:text-sm">
                OR CONTINUE WITH
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* GOOGLE AUTH */}
            <div className="w-full">
              <GoogleAuthButton
                clientId={googleClientId}
                onCredential={onGoogleCredential}
                disabled={isLoading}
                label="Continue with Google"
                buttonText="signin_with"
                className="w-full"
                style={{ width: "100%" }}
              />
            </div>

            {/* ACCOUNT LINKS */}
            <div className="mt-7 overflow-hidden rounded-lg border border-gray-200 sm:mt-8">
              <div className="bg-[#F6F7F9] px-4 py-5 text-center sm:px-6">
                <p className="text-sm leading-6 text-gray-700 sm:text-base">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="font-bold text-[#0056D2] underline underline-offset-2 hover:text-blue-800"
                  >
                    Sign up
                  </Link>
                </p>
              </div>

              <div className="border-t border-gray-200 bg-white px-4 py-4 text-center sm:px-6">
                <Link
                  href="/forgot-password"
                  className="inline-block text-sm font-semibold text-[#0056D2] underline underline-offset-2 hover:text-blue-800 sm:text-base"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export async function getServerSideProps() {
  return {
    props: {
      googleClientId:
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        process.env.GOOGLE_CLIENT_ID ||
        "",
    },
  };
}
