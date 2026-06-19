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
  const [isRedirectingToPayPal, setIsRedirectingToPayPal] = useState(false);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);
  const [checkoutData, setCheckoutData] = useState(data || null);
  const [checkoutState, setCheckoutState] = useState(statusState);
  const token = useMemo(
    () => String(router?.query?.token || ""),
    [router?.query?.token],
  );

  const order = checkoutData?.order;

  const orderLines = order?.items || [];
  const state = checkoutData?.state || checkoutState;
  const approvalUrl = checkoutData?.approvalUrl || null;
  const paypalStatus = String(checkoutData?.paypalStatus || "").toUpperCase();
  const isPaid = state === "PAID";
  const isInvalid = state === "INVALID";
  const isFailed = state === "FAILED";
  const isPending = !isPaid && !isInvalid && !isFailed;
  const isUnpaidOrder = isPending && paypalStatus === "CREATED";
  const canCancelCheckout = Boolean(
    checkoutData?.canCancelCheckout ?? (isPending && !isPaid),
  );
  const canCompletePayment = Boolean(
    (checkoutData?.canCompletePayment ?? isUnpaidOrder) && approvalUrl,
  );
  const getOrderItemCoverImage = (item) =>
    item?.course?.media?.[0]?.storagePath || "/placeholder-cover.webp";
  const getOrderItemTitle = (item) =>
    item?.course?.title || item?.title || item?.courseId || "Course";
  const getOrderItemAuthor = (item) => {
    const educator = item?.course?.educator || {};
    const fullName =
      `${educator?.firstName || ""} ${educator?.lastName || ""}`.trim();
    return fullName || educator?.username || "Instructor";
  };

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

  const handleContinueToPayPal = () => {
    if (!approvalUrl || typeof window === "undefined") return;
    setIsRedirectingToPayPal(true);
    window.location.assign(approvalUrl);
  };

  const handleCancelCheckoutOrder = async () => {
    if (!token || !canCancelCheckout || isCancellingOrder) return;
    setIsCancellingOrder(true);
    router.push(`/checkout/cancel?token=${encodeURIComponent(token)}`);
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
              : isUnpaidOrder
                ? "Payment not completed yet"
                : "Finalizing your order..."}
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
              {isUnpaidOrder
                ? "Your order is created but still unpaid. Complete payment on PayPal to finish this order."
                : "We are waiting for payment confirmation from PayPal."}
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
            {canCompletePayment ? (
              <button
                onClick={handleContinueToPayPal}
                disabled={isRedirectingToPayPal}
                className={`${isRedirectingToPayPal ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} mt-4 bg-[#0056D2] px-4 py-2 rounded-md text-white font-semibold hover:bg-[#1d6de0] transition`}
              >
                {isRedirectingToPayPal
                  ? "Redirecting to PayPal..."
                  : "Complete payment on PayPal"}
              </button>
            ) : null}
            {canCancelCheckout ? (
              <button
                onClick={handleCancelCheckoutOrder}
                disabled={isCancellingOrder}
                className={`${isCancellingOrder ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} mt-3 ml-2 bg-white border border-[#d97706] text-[#d97706] px-4 py-2 rounded-md font-semibold hover:bg-[#fff7ed] transition`}
              >
                {isCancellingOrder ? "Cancelling order..." : "Cancel order and return items to cart"}
              </button>
            ) : null}
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
                      src={getOrderItemCoverImage(item)}
                      width={50}
                      height={30}
                      alt={getOrderItemTitle(item)}
                      className="w-[70px] h-[50px] object-cover rounded-md border-[1px] border-[oklch(86.72%_0.0192_282.72deg)]"
                    />
                    <div className="ml-2 flex flex-col">
                      <span>{getOrderItemTitle(item)}</span>
                      <span className="text-[12px] text-gray-500">
                        By {getOrderItemAuthor(item)}
                      </span>
                    </div>
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
          href={isPaid ? "/my-courses/learning" : "/cart"}
          className="border-[#0056D2] border-2 px-[30px] rounded-md py-[10px] text-[#0056D2] font-semibold hover:bg-[#0056D2] hover:text-white transition"
        >
          {isPaid ? "Go to your learning" : "Back to cart"}
        </Link>
      </div>
    </div>
  );
}
