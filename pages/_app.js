import { useEffect } from "react";
import Layout from "@/components/partials/Layout";
import Seo from "@/components/partials/Seo";
import { clearStaleSession } from "@/lib/services/auth";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const check = () => clearStaleSession();
    check();
    window.addEventListener("focus", check);
    return () => window.removeEventListener("focus", check);
  }, []);

  return (
    <>
      <Seo />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}
