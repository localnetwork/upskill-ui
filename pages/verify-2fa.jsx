import { useState } from "react";
import { useRouter } from "next/router";
import persistentStore from "@/lib/store/persistentStore";
import AUTHAPI from "@/lib/api/auth/request";
import toast from "react-hot-toast";
import Spinner from "@/components/icons/Spinner";
import Link from "next/link";

export default function Verify2FA() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showBackupCodeInput, setShowBackupCodeInput] = useState(false);

  const onVerify = async (e) => {
    e.preventDefault();
    toast.dismiss();
    setIsLoading(true);

    try {
      const preAuthToken = persistentStore.getState().preAuthToken;

      if (!preAuthToken) {
        toast.error("Session expired. Please log in again.");
        router.push("/login");
        setIsLoading(false);
        return;
      }

      if (!code || code.length < 6) {
        toast.error("Please enter a valid code.");
        setIsLoading(false);
        return;
      }

      const payload = {
        pre_auth_token: preAuthToken,
        code: code,
      };

      console.log("Sending 2FA verification payload");

      const response = await AUTHAPI.verify2FA(payload);

      if (
        response?.data?.status === "success" &&
        response?.data?.token &&
        response?.data?.user
      ) {
        persistentStore.setState({
          token: response.data.token,
          profile: response.data.user,
          preAuthToken: null,
        });

        toast.success(response.data.message || "2FA verification successful!");
        router.push("/");
      } else {
        toast.error("Unexpected response. Please try again.");
      }
    } catch (error) {
      console.error("2FA verification error:", error);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (error?.data?.errors) {
        Object.entries(error.data.errors).forEach(([field, messages]) => {
          const message = Array.isArray(messages) ? messages[0] : messages;
          toast.error(String(message));
        });
      } else if (error?.data?.message) {
        toast.error(error.data.message);
      } else if (error?.response?.status === 422) {
        toast.error("Invalid verification code. Please try again.");
      } else {
        toast.error("Verification failed. Please try again.");
      }

      if (newAttempts >= 3) {
        toast.error("Too many failed attempts. Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupCodeToggle = () => {
    setShowBackupCodeInput(!showBackupCodeInput);
    setCode("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white rounded-lg shadow-lg p-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {showBackupCodeInput
              ? "Enter one of your backup codes"
              : "Enter the 6-digit code from your authenticator app"}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={onVerify}>
          <div>
            <label htmlFor="code" className="sr-only">
              {showBackupCodeInput ? "Backup Code" : "2FA Code"}
            </label>
            <div className="relative">
              <input
                id="code"
                name="code"
                type="text"
                inputMode={showBackupCodeInput ? "text" : "numeric"}
                maxLength={showBackupCodeInput ? "10" : "6"}
                placeholder={showBackupCodeInput ? "XXXXXXXX" : "000000"}
                value={code}
                onChange={(e) => {
                  const value = showBackupCodeInput
                    ? e.target.value.toUpperCase()
                    : e.target.value.replace(/\D/g, "");
                  setCode(value);
                }}
                className="appearance-none rounded-md relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm text-center text-2xl tracking-widest font-mono"
                disabled={isLoading}
                autoFocus
              />
            </div>
            <p className="mt-2 text-center text-xs text-gray-500">
              {showBackupCodeInput
                ? "Enter backup code"
                : `${code.length}/6 digits entered`}
            </p>
          </div>

          <button
            type="submit"
            disabled={
              isLoading ||
              (showBackupCodeInput ? code.length < 6 : code.length !== 6)
            }
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Spinner className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </div>
            ) : (
              <span>Verify Code</span>
            )}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <button
              type="button"
              onClick={handleBackupCodeToggle}
              className="px-2 bg-white text-gray-500 hover:text-gray-700 text-xs"
            >
              {showBackupCodeInput
                ? "Use authenticator code"
                : "Use backup code"}
            </button>
          </div>
        </div>

        <div className="space-y-3 text-center">
          {attempts > 0 && (
            <p className="text-sm text-orange-600 font-medium">
              Attempts: {attempts}/3
            </p>
          )}
          <Link
            href="/login"
            className="inline-block text-sm text-blue-600 hover:text-blue-500 underline font-medium"
          >
            ← Back to Login
          </Link>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">💡 Tip:</span> Make sure your device
            time is synced. If codes don't work, try a backup code.
          </p>
        </div>
      </div>
    </div>
  );
}
