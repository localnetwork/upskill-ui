import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import Spinner from "@/components/icons/Spinner";

const RESEND_SECONDS = 30;

// Code entry step shared by register and login.
export default function EmailCodeStep({
  title = "Check your inbox",
  email,
  purposeText,
  isLoading,
  onSubmit,
  onResend,
  onBack,
  submitLabel = "Verify",
}) {
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const submit = (e) => {
    e.preventDefault();
    if (code.length === 6 && !isLoading) onSubmit(code);
  };

  const resend = async () => {
    setCode("");
    const ok = await onResend();
    if (ok !== false) setCooldown(RESEND_SECONDS);
  };

  return (
    <form
      className="mx-auto flex w-full max-w-md flex-col gap-y-6 text-center"
      onSubmit={submit}
    >
      <h1 className="text-3xl font-bold text-[#2a2b3f] sm:text-4xl">{title}</h1>

      <p className="text-base leading-7 text-gray-700">
        Enter the 6-digit code we sent to{" "}
        <span className="font-bold text-[#2a2b3f]">{email}</span>{" "}
        {purposeText}
      </p>

      <label className="relative block text-left">
        <span
          className={`pointer-events-none absolute left-4 transition-all ${
            code
              ? "top-2 text-xs font-semibold text-gray-600"
              : "top-1/2 -translate-y-1/2 text-sm font-bold text-[#2a2b3f]"
          }`}
        >
          6-digit code
        </span>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          value={code}
          disabled={isLoading}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="h-[70px] w-full rounded-lg border border-gray-300 bg-[#f4f5f7] px-4 pr-12 pt-5 text-lg font-semibold tracking-[0.35em] text-[#2a2b3f] outline-none focus:border-[#0056D2] focus:bg-white"
        />
        <Lock className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2a2b3f]" />
      </label>

      <button
        type="submit"
        disabled={isLoading || code.length !== 6}
        className="inline-flex h-[54px] w-full items-center justify-center gap-2 rounded-lg bg-[#0056D2] px-5 text-lg font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading && <Spinner className="h-5 w-5 animate-spin text-white" />}
        {submitLabel}
      </button>

      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || isLoading}
          className="border-b border-[#0056D2] pb-0.5 font-bold text-[#0056D2] disabled:cursor-not-allowed disabled:border-transparent disabled:text-gray-400"
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="text-sm text-gray-500 hover:underline"
        >
          Back
        </button>
      </div>
    </form>
  );
}
