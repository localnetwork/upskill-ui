"use client";

import BaseApi from "@/lib/api/_base.api";
import { Check, CheckCircle, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

import PAYOUTACCOUNTAPI from "@/lib/api/payout-accounts/request";

export default function Page() {
  const [loading, setLoading] = useState(false);
  // 🔹 SWR hook usage
  const {
    data: payoutAccounts,
    error,
    isLoading,
  } = PAYOUTACCOUNTAPI.getPayoutAccounts();

  const paypalAccount = payoutAccounts?.find(
    (acc) => acc.provider === "paypal",
  );
  const connectPayPal = () => {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

    if (!clientId) {
      alert("Missing PayPal Client ID");
      return;
    }

    setLoading(true);

    const redirectUri = "http://127.0.0.1:3000/api/paypal/callback";

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      scope:
        "openid profile email https://uri.paypal.com/services/paypalattributes",
      redirect_uri: redirectUri,
    });

    const url = `https://www.sandbox.paypal.com/signin/authorize?flowEntry=static&${params.toString()}`;

    // 🔹 Redirect instead of opening a popup
    window.location.href = url;
  };

  return (
    <div className="bg-[#F8FAFC] py-[100px] h-full">
      <div className="container space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Payout & Tax Settings
        </h2>

        <div className="rounded-lg p-6 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#dcecff] rounded-lg">
                <Wallet className="text-primary" size={25} />
              </div>
              <div>
                <div className="flex gap-1 mb-2 items-center">
                  <p className="font-bold">PayPal</p>
                  {paypalAccount?.is_default === "1" && (
                    <span className="ml-2 rounded-full text-[10px] bg-[#dcecff] text-primary px-[10px] py-[3px] font-semibold">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Connect your PayPal account to receive payouts
                </p>

                {paypalAccount?.provider_email && (
                  <p className="text-sm text-primary font-bold">
                    {paypalAccount?.provider_email}
                  </p>
                )}
              </div>
            </div>

            {paypalAccount?.provider_email && (
              <span className="rounded-full bg-primary p-1">
                <Check className="text-white" size={20} />
              </span>
            )}
          </div>

          <button
            onClick={connectPayPal}
            disabled={loading}
            className="w-full cursor-pointer max-w-[320px] py-4 bg-primary text-white font-bold rounded-full"
          >
            {loading ? (
              <>Redirecting...</>
            ) : (
              <>
                {paypalAccount?.provider_email
                  ? "Change Paypal Account"
                  : "Connect PayPal"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
