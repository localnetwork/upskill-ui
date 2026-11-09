import { useState } from "react";
import toast from "react-hot-toast";
import AUTHAPI from "@/lib/api/auth/request";
import OTPInput from "@/components/forms/OTPInput";
import persistentStore from "@/lib/store/persistentStore";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ChangeEmailModal({ currentEmail, onClose }) {
  const [step, setStep] = useState("email");
  const [newEmail, setNewEmail] = useState("");
  const [method, setMethod] = useState("email");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const requestCode = async (e) => {
    e?.preventDefault();
    const value = newEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(value)) {
      setError("Enter a valid email address");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      const res = await AUTHAPI.requestEmailChange(value);
      setNewEmail(value);
      setMethod(res?.data?.data?.method || "email");
      setCode("");
      setStep("code");
    } catch (err) {
      setError(err?.data?.message || "Unable to start the email change");
    } finally {
      setIsLoading(false);
    }
  };

  const confirm = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setError("");
    setIsLoading(true);
    try {
      const res = await AUTHAPI.confirmEmailChange({ newEmail, code });
      const updated = res?.data?.data;
      persistentStore.setState((state) => ({
        profile: { ...state.profile, ...(updated || {}), email: newEmail },
      }));
      toast.success("Email updated");
      onClose();
    } catch (err) {
      setCode("");
      setError(err?.data?.message || "Invalid or expired code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-2xl font-semibold">Change email</h2>
        <p className="mb-5 text-sm text-gray-600">
          Current email: <span className="font-medium">{currentEmail}</span>
        </p>

        {step === "email" ? (
          <form onSubmit={requestCode} className="flex flex-col gap-4">
            <div>
              <label htmlFor="newEmail" className="mb-2 block">
                New email
              </label>
              <input
                id="newEmail"
                type="email"
                autoFocus
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  setError("");
                }}
                className="w-full rounded-[5px] border border-[oklch(67.22%_0.0355_279.77deg)] p-[10px]"
                placeholder="you@example.com"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-[5px] bg-[#0056D2] px-5 py-2 font-semibold text-white disabled:opacity-60"
              >
                {isLoading ? "Sending..." : "Continue"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={confirm} className="flex flex-col gap-4">
            <p className="text-sm text-gray-700">
              {method === "totp"
                ? "Enter the 6-digit code from your authenticator app to change your email to "
                : `We sent a 6-digit code to ${currentEmail}. Enter it to change your email to `}
              <span className="font-medium">{newEmail}</span>.
            </p>
            <OTPInput value={code} onChange={setCode} disabled={isLoading} />
            {error && <p className="text-center text-sm text-red-500">{error}</p>}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setError("");
                }}
                className="px-4 py-2 underline"
              >
                Back
              </button>
              <div className="flex gap-3">
                {method === "email" && (
                  <button
                    type="button"
                    onClick={requestCode}
                    disabled={isLoading}
                    className="px-4 py-2 text-[#0056D2] underline"
                  >
                    Resend
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading || code.length !== 6}
                  className="rounded-[5px] bg-[#0056D2] px-5 py-2 font-semibold text-white disabled:opacity-60"
                >
                  {isLoading ? "Verifying..." : "Confirm"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
