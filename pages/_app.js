import Layout from "@/components/partials/Layout";
import Seo from "@/components/partials/Seo";
import "@/styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Seo />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}
