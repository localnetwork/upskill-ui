import { getSiteUrl } from "@/lib/seo";

export async function getServerSideProps({ res }) {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /cart",
    "Disallow: /checkout",
    "Disallow: /profile",
    "Disallow: /settings",
    "Disallow: /messages",
    "Disallow: /notifications",
    "Disallow: /my-",
    "Disallow: /instructor",
    "Disallow: /admin",
    "Disallow: /employee-dashboard",
    "Disallow: /share/",
    "Disallow: /*/learn",
    "Disallow: /*?*",
    "",
    `Sitemap: ${getSiteUrl()}/sitemap.xml`,
    "",
  ].join("\n");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=86400");
  res.write(body);
  res.end();
  return { props: {} };
}

export default function Robots() {
  return null;
}
