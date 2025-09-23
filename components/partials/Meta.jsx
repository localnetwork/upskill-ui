import Head from "next/head";
import { useRouter } from "next/router";
export default function Meta({ title, description, keywords }) {
  const router = useRouter();
  const findTitle =
    router.asPath === "/" ? "Upskill UI" : title + " - Upskill UI";
  const findDescription = description
    ? description
    : "Upskill UI - An affordable online learning platform.";

  return (
    <Head>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
      <title>{findTitle}</title>
      <meta name="description" content={findDescription} />
      <meta name="keywords" content={keywords} />
      <link rel="icon" href="/favicon.ico" />
    </Head>
  );
}
