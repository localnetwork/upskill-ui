import BaseApi from "@/lib/api/_base.api";
import { setContext } from "@/lib/api/interceptor";

export async function getServerSideProps(context) {
  const rawCode = context?.params?.code;
  const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;
  const normalizedCode = String(code || "").trim();

  if (!normalizedCode) {
    return { notFound: true };
  }

  setContext(context);

  try {
    const response = await BaseApi.get(
      `${process.env.NEXT_PUBLIC_API_URL}/share/${encodeURIComponent(normalizedCode)}`,
    );
    const targetPath = response?.data?.data?.target_path;

    if (!targetPath) {
      return { notFound: true };
    }

    return {
      redirect: {
        destination: targetPath,
        permanent: false,
      },
    };
  } catch (error) {
    if (error?.status === 404) {
      return { notFound: true };
    }
    return {
      redirect: {
        destination: "/courses",
        permanent: false,
      },
    };
  }
}

export default function ShareRedirectPage() {
  return null;
}
