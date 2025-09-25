import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function UserResendNotif() {
  const COOLDOWN = 60; // seconds
  const [timeLeft, setTimeLeft] = useState(0);

  const handleResend = () => {
    if (timeLeft > 0) return; // prevent click during cooldown

    toast.dismiss();
    // 🔹 Your resend verification logic here
    console.log("Resend verification clicked");
    toast.success("Verification email resent!");
    setTimeLeft(COOLDOWN);
  };

  // countdown effect
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  return (
    <div className="bg-red-500 text-white text-center py-2 text-sm select-none">
      Please verify your email to access all features.{" "}
      <span
        className={`underline cursor-pointer ${
          timeLeft > 0 ? "opacity-50 pointer-events-none" : ""
        }`}
        onClick={handleResend}
      >
        {timeLeft > 0
          ? `Resend available in ${timeLeft}s`
          : "Click here to resend verification."}
      </span>
    </div>
  );
}
