export async function getServerSideProps(context) {
  const token = String(context?.query?.token || "").trim();
  const payerId = String(context?.query?.PayerID || "").trim();

  if (!token) {
    return {
      redirect: {
        destination: "/checkout",
        permanent: false,
      },
    };
  }

  const destination = payerId
    ? `/checkout/payments/${encodeURIComponent(token)}?PayerID=${encodeURIComponent(payerId)}`
    : `/checkout/payments/${encodeURIComponent(token)}`;

  return {
    redirect: {
      destination,
      permanent: false,
    },
  };
}

export default function CheckoutPaymentsEntry() {
  return null;
}
