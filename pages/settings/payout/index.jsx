"use client";

import { useState } from "react";

export default function Page() {
  const [loading, setLoading] = useState(false);

  const connectPayPal = () => {
    setLoading(true);

    const redirectUri = "http://127.0.0.1:3000/api/paypal/callback"; // Change to your actual callback URL

    const params = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
      response_type: "code",
      scope: "email",
      redirect_uri: redirectUri,
    });

    // ✅ Sandbox OAuth authorize URL (required flowEntry)
    const url = `https://www.sandbox.paypal.com/signin/authorize?flowEntry=static&${params.toString()}`;

    window.open(url, "paypal-connect", "width=500,height=700");

    // reset loading after popup opens
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900">Payout Method</h2>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          {/* PayPal Icon */}
          <div className="h-12 w-12 flex items-center justify-center rounded-full bg-blue-50">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 text-blue-600"
              fill="currentColor"
            >
              <path d="M7.5 3A4.5 4.5 0 003 7.5v9A4.5 4.5 0 007.5 21h9a4.5 4.5 0 004.5-4.5v-9A4.5 4.5 0 0016.5 3h-9Zm6.02 4.23c.93 0 1.67.25 2.2.75.54.5.8 1.18.8 2.05 0 .87-.23 1.65-.7 2.32-.47.67-1.13 1.19-1.98 1.55-.85.36-1.84.54-2.97.54h-.91L9.5 18H7.9l1.4-8.95h4.24Zm-1.1 4.95c.74 0 1.32-.2 1.75-.6.43-.4.64-.95.64-1.66 0-.42-.14-.75-.43-.98-.28-.23-.7-.35-1.25-.35H10.8l-.43 3.6h.95Z" />
            </svg>
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">PayPal</h3>

            <p className="mt-1 text-sm text-gray-600">
              Connect your PayPal account to receive instructor payouts. We’ll
              securely retrieve your verified PayPal email.
            </p>

            <button
              onClick={connectPayPal}
              disabled={loading}
              className={`mt-4 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition
                ${
                  loading
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Connecting…
                </>
              ) : (
                <>
                  <span>Connect PayPal</span>
                </>
              )}
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          You’ll be redirected to PayPal to log in securely. No PayPal
          credentials are stored on our platform.
        </p>
      </div>
    </div>
  );
}
