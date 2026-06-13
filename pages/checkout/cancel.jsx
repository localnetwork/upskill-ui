import { CircleX } from "lucide-react";
import BaseApi from "@/lib/api/_base.api";
import { setContext } from "@/lib/api/interceptor";
import Link from "next/link";

export async function getServerSideProps(context) {
  const { query } = context;
  const { token } = query;
  setContext(context);

  if (!token) {
    return {
      props: {
        cancelled: false,
        orderId: null,
      },
    };
  }

  try {
    const response = await BaseApi.post(
      `${process.env.NEXT_PUBLIC_API_URL}/checkout/cancel`,
      { providerOrderId: token },
    );
    return {
      props: {
        cancelled: true,
        orderId: response?.data?.data?.order?.id || null,
      },
    };
  } catch (_error) {
    return {
      props: {
        cancelled: false,
        orderId: null,
      },
    };
  }
}

export default function Page({ cancelled, orderId }) {
  return (
    <div className="py-[50px] flex flex-col justify-center items-center bg-[#F6F6F6] min-h-[calc(100vh-100px)]">
      <div>
        <CircleX className="w-20 h-20 text-red-400" />
      </div>
      <h1 className="font-semibold text-[40px]">
        {cancelled ? "Your payment was cancelled." : "Unable to cancel this checkout."}
      </h1>
      <p className="text-[18px] mt-2 text-gray-600">
        {cancelled
          ? `Order ${orderId ? `#${orderId}` : ""} was marked as cancelled and items were returned to your cart.`
          : "This checkout may already be approved or completed in PayPal."}
      </p>

      <div className="flex justify-center mt-8">
        <Link
          href={cancelled ? "/cart" : "/checkout"}
          className="border-[#0056D2] border-2 px-[30px] rounded-md py-[10px] text-[#0056D2] font-semibold hover:bg-[#0056D2] hover:text-white transition"
        >
          {cancelled ? "Back to Cart" : "Back to Checkout"}
        </Link>
      </div>
    </div>
  );
}
