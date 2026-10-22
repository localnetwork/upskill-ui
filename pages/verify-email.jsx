import AUTHAPI from "@/lib/api/auth/request";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function VerifyEmail() {
  const router = useRouter();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!router.isReady) return;
    const token = String(router.query.token || "");
    if (!token) {
      setStatus("error");
      setMessage("This verification link is invalid.");
      return;
    }

    let cancelled = false;
    AUTHAPI.verifyEmail(token)
      .then(() => {
        if (!cancelled) setStatus("success");
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          err?.data?.message ||
            "This verification link is invalid or has already been used.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [router.isReady, router.query.token]);

  return (
    <div className="min-h-[calc(100vh-92px)]">
      <div className="container py-[80px]">
        <div className="mx-auto max-w-[480px] text-center">
          {status === "loading" && (
            <p className="text-[#4b4c54]">Verifying your email...</p>
          )}
          {status === "success" && (
            <>
              <h2 className="text-3xl font-bold mb-4">Email verified</h2>
              <p className="text-[#4b4c54] mb-8">
                Thanks! Your email address has been confirmed.
              </p>
              <Link
                href="/"
                className="inline-block bg-[#0056D2] text-white font-semibold px-[30px] py-[10px] rounded-[8px]"
              >
                Continue
              </Link>
            </>
          )}
          {status === "error" && (
            <>
              <h2 className="text-3xl font-bold mb-4">Verification failed</h2>
              <p className="text-red-500 mb-8">{message}</p>
              <Link href="/login" className="text-[#0056D2] underline font-bold">
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
