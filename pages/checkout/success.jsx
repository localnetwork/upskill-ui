import BaseApi from "@/lib/api/_base.api";
import { setContext } from "@/lib/api/interceptor";
import { AlertCircle, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { parseCookies } from "nookies";
import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { getAuthTokenFromCookieMap } from "@/lib/services/authToken";

export async function getServerSideProps(context) {
  const { query } = context;
  const { token } = query;
  setContext(context);

  if (!token) {
    return {
      props: {
        data: null,
        statusState: "INVALID",
        errorMessage: "Missing payment token.",
      },
    };
  }

  try {
    const res = await BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/checkout/status/${encodeURIComponent(token)}`,
    );

    return {
      props: {
        data: res?.data?.data || null,
        statusState: res?.data?.data?.state || "PENDING",
        errorMessage: null,
      },
    };
  } catch (error) {
    const statusCode = Number(error?.status || 0);
    const isInvalidToken =
      statusCode === 400 ||
      statusCode === 404 ||
      /payment not found/i.test(String(error?.data?.message || ""));

    return {
      props: {
        data: null,
        statusState: isInvalidToken ? "INVALID" : "PENDING",
        errorMessage: isInvalidToken
          ? "Invalid checkout token."
          : "We could not verify your payment status right now.",
      },
    };
  }
}

export default function Page({ data, statusState }) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [checkoutData, setCheckoutData] = useState(data || null);
  const [checkoutState, setCheckoutState] = useState(statusState);
  const token = useMemo(
    () => String(router?.query?.token || ""),
    [router?.query?.token],
  );

  const order = checkoutData?.order;
  const orderLines = order?.items || [];
  const state = checkoutData?.state || checkoutState;
  const isPaid = state === "PAID";
  const isInvalid = state === "INVALID";
  const isFailed = state === "FAILED";
  const isPending = !isPaid && !isInvalid && !isFailed;

  const fetchStatus = async () => {
    if (!token) return;
    try {
      const response = await BaseApi.get(
        `${process.env.NEXT_PUBLIC_API_URL}/checkout/status/${encodeURIComponent(token)}`,
      );
      const nextData = response?.data?.data || null;

      console.log("response", response);
      setCheckoutData(nextData);
      setCheckoutState(nextData?.state || "PENDING");
    } catch (error) {
      const statusCode = Number(error?.status || 0);
      if (statusCode === 400 || statusCode === 404) {
        setCheckoutData(null);
        setCheckoutState("INVALID");
        return;
      }
      setCheckoutState((prev) => (prev === "PAID" ? prev : "PENDING"));
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStatus();
    setIsRefreshing(false);
  };

  useEffect(() => {
    setCheckoutData(data || null);
    setCheckoutState(statusState);
  }, [data, statusState]);

  useEffect(() => {
    if (!token) return;
    const cookies = parseCookies();
    const authToken = getAuthTokenFromCookieMap(cookies);
    if (!authToken) return;

    const socketBaseUrl = String(process.env.NEXT_PUBLIC_API_URL || "").replace(
      /\/api\/?$/,
      "",
    );
    const socket = io(socketBaseUrl, {
      transports: ["websocket"],
      auth: { token: authToken },
    });

    const onCheckoutStatus = (payload = {}) => {
      if (String(payload?.providerOrderId || "") !== token) return;
      fetchStatus();
    };

    socket.on("checkout:status", onCheckoutStatus);

    return () => {
      socket.off("checkout:status", onCheckoutStatus);
      socket.disconnect();
    };
  }, [token]);

  return (
    <div className="py-[50px] flex flex-col justify-center items-center bg-[#F6F6F6] min-h-[calc(100vh-100px)]">
      <div>
        {isPaid ? (
          <CheckCircle className="w-20 h-20 text-[#0056D2]" />
        ) : (
          <AlertCircle className="w-20 h-20 text-[#d97706]" />
        )}
      </div>
      <h1 className="font-semibold text-[40px]">
        {isPaid
          ? "Thank you for your purchase!"
          : isInvalid
            ? "Invalid checkout token"
            : isFailed
              ? "Payment was not completed"
              : "Payment received. Finalizing your order..."}
      </h1>
      <p className="text-[20px] mt-2">
        {isInvalid
          ? `Token: ${router?.query?.token || "N/A"}`
          : `Your order ID is: #${order?.id || router?.query?.order_id || "processing"}`}
      </p>

      <div className="bg-white shadow-md mt-5 rounded-lg p-[30px] w-full max-w-[600px]">
        <h2 className="font-semibold text-[24px] mb-4">
          {isPaid ? "Order Summary" : "Order Status"}
        </h2>
        {isPending ? (
          <>
            <p className="text-[15px] text-gray-600">
              We are waiting for payment confirmation from PayPal.
            </p>
            <div className="text-[14px] text-gray-700 mt-3">
              <div>
                Payment Status: {checkoutData?.paymentStatus || "CREATED"}
              </div>
              <div>Order Status: {checkoutData?.orderStatus || "CREATED"}</div>
              <div>
                PayPal Status: {checkoutData?.paypalStatus || "UNKNOWN"}
              </div>
            </div>
            {/* <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`${isRefreshing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} mt-4 border border-[#0056D2] px-4 py-2 rounded-md text-[#0056D2] font-semibold hover:bg-[#0056D2] hover:text-white transition`}
            >
              {isRefreshing ? "Refreshing..." : "Refresh status"}
            </button> */}
          </>
        ) : isPaid ? (
          <>
            <div className="flex flex-col gap-[15px]">
              {orderLines?.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between border-b border-[#ddd] py-2 pb-[20px]"
                >
                  <div className="flex items-center">
                    <Image
                      src={"/placeholder-cover.webp"}
                      width={50}
                      height={30}
                      alt={item?.courseId}
                      className="w-[70px] h-[50px] object-cover rounded-md border-[1px] border-[oklch(86.72%_0.0192_282.72deg)]"
                    />
                    <span className="ml-2">{item?.courseId}</span>
                  </div>
                  <span>₱{item.totalAmount}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-semibold text-[18px] mt-4">
              <span>Total:</span>
              <span>₱{order?.totalAmount}</span>
            </div>
          </>
        ) : (
          <p className="text-[15px] text-gray-600">
            This transaction could not be verified. Please try again.
          </p>
        )}
      </div>

      <div className="flex justify-center mt-8">
        <Link
          href={isInvalid ? "/cart" : "/my-courses/learning"}
          className="border-[#0056D2] border-2 px-[30px] rounded-md py-[10px] text-[#0056D2] font-semibold hover:bg-[#0056D2] hover:text-white transition"
        >
          {isInvalid ? "Back to cart" : "Go to your learning"}
        </Link>
      </div>
    </div>
  );
}
