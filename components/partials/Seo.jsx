import Head from "next/head";
import { useRouter } from "next/router";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  absoluteUrl,
  isNoindexPath,
  truncate,
} from "@/lib/seo";

export default function Seo({
  title,
  description,
  keywords,
  image,
  path,
  type = "website",
  noindex,
  jsonLd,
}) {
  const router = useRouter();
  const pathname = String(router.asPath || "/").split(/[?#]/)[0] || "/";
  const canonical = absoluteUrl(path || pathname);
  const fullTitle =
    !title || title === SITE_NAME
      ? `${SITE_NAME} - Learn in-demand skills online`
      : String(title).startsWith(SITE_NAME)
        ? title
        : `${title} | ${SITE_NAME}`;
  const metaDescription = truncate(description || DEFAULT_DESCRIPTION, 160);
  const ogImage = absoluteUrl(image || DEFAULT_OG_IMAGE);
  const hidden = noindex ?? isNoindexPath(router.pathname);
  const jsonLdItems = (Array.isArray(jsonLd) ? jsonLd : [jsonLd]).filter(
    Boolean,
  );

  return (
    <Head>
      <title key="title">{fullTitle}</title>
      <meta name="description" content={metaDescription} key="description" />
      {keywords ? (
        <meta
          name="keywords"
          content={Array.isArray(keywords) ? keywords.join(", ") : keywords}
          key="keywords"
        />
      ) : null}
      <meta
        name="robots"
        content={hidden ? "noindex, nofollow" : "index, follow, max-image-preview:large"}
        key="robots"
      />
      <link rel="canonical" href={canonical} key="canonical" />

      <meta property="og:site_name" content={SITE_NAME} key="og:site_name" />
      <meta property="og:type" content={type} key="og:type" />
      <meta property="og:title" content={fullTitle} key="og:title" />
      <meta
        property="og:description"
        content={metaDescription}
        key="og:description"
      />
      <meta property="og:url" content={canonical} key="og:url" />
      <meta property="og:image" content={ogImage} key="og:image" />

      <meta
        name="twitter:card"
        content="summary_large_image"
        key="twitter:card"
      />
      <meta name="twitter:title" content={fullTitle} key="twitter:title" />
      <meta
        name="twitter:description"
        content={metaDescription}
        key="twitter:description"
      />
      <meta name="twitter:image" content={ogImage} key="twitter:image" />

      {jsonLdItems.map((item, index) => (
        <script
          key={`jsonld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </Head>
  );
}
