import AUTHAPI from "@/lib/api/auth/request";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import toast from "react-hot-toast";
import Spinner from "@/components/icons/Spinner";

export default function ResetPassword() {
  const router = useRouter();
  const token = String(router.query.token || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    toast.dismiss();

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      await AUTHAPI.resetPassword(token, password);
      toast.success("Password updated. You can now log in.");
      router.push("/login");
    } catch (err) {
      toast.error(
        err?.data?.message || "This reset link is invalid or has expired.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "border-[#4b4c54] border-[1px] rounded-lg min-h-[60px] py-3 px-[20px] w-full focus:outline-[#3588FC]";

  return (
    <div className="min-h-[calc(100vh-92px)]">
      <div className="container py-[50px]">
        <div className="mx-auto max-w-[480px]">
          <h2 className="text-3xl font-bold mb-4">Set a new password</h2>
          <p className="text-[#4b4c54] mb-8">
            Choose a new password for your account.
          </p>

          {router.isReady && !token ? (
            <p className="text-red-500">
              This reset link is invalid. Please{" "}
              <Link href="/forgot-password" className="underline font-bold">
                request a new one
              </Link>
              .
            </p>
          ) : (
            <form className="flex flex-col gap-y-[20px]" onSubmit={onSubmit}>
              <input
                type="password"
                placeholder="New password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
              />
              {error && <p className="text-red-500 text-[12px]">{error}</p>}

              <button
                type="submit"
                disabled={isLoading || !token}
                className={`shadow-md bg-[#0056D2] w-full text-white font-semibold px-[30px] py-[10px] rounded-[8px] inline-flex justify-center items-center gap-[10px] text-[18px] ${
                  isLoading ? "opacity-70" : "hover:opacity-90 cursor-pointer"
                }`}
              >
                {isLoading && (
                  <Spinner className="w-5 h-5 text-white animate-spin opacity-30" />
                )}
                Reset password
              </button>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link href="/login" className="text-[#0056D2] underline font-bold">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
