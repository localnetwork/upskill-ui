import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta
          name="google-site-verification"
          content="YuVLUAGlJZWcM4bqQakgcn4Yay1qT4B9X-x6WDtpclg"
        />
        <meta name="theme-color" content="#0056D2" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
