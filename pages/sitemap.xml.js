import { absoluteUrl } from "@/lib/seo";

const API = process.env.NEXT_PUBLIC_API_URL;

async function getJson(path) {
  try {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (_error) {
    return null;
  }
}

async function getAllPages(path, maxPages = 50) {
  const rows = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const separator = path.includes("?") ? "&" : "?";
    const json = await getJson(`${path}${separator}limit=100&page=${page}`);
    const data = Array.isArray(json?.data) ? json.data : [];
    rows.push(...data);
    if (page >= Number(json?.meta?.totalPages || 1) || !data.length) break;
  }
  return rows;
}

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function flattenCategories(nodes, acc = []) {
  for (const node of nodes || []) {
    if (node?.slug) acc.push(node);
    flattenCategories(node.children, acc);
  }
  return acc;
}

function buildXml(entries) {
  const seen = new Set();
  const body = entries
    .filter((entry) => {
      if (seen.has(entry.loc)) return false;
      seen.add(entry.loc);
      return true;
    })
    .map(
      (entry) =>
        `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${
          entry.lastmod
            ? `\n    <lastmod>${new Date(entry.lastmod).toISOString()}</lastmod>`
            : ""
        }${entry.changefreq ? `\n    <changefreq>${entry.changefreq}</changefreq>` : ""}${
          entry.priority ? `\n    <priority>${entry.priority}</priority>` : ""
        }\n  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export async function getServerSideProps({ res }) {
  const [courses, categoryTree, topics] = await Promise.all([
    getAllPages("/courses"),
    getJson("/categories?tree=true"),
    getAllPages("/tags"),
  ]);

  const entries = [
    { loc: absoluteUrl("/"), changefreq: "daily", priority: "1.0" },
    { loc: absoluteUrl("/courses"), changefreq: "daily", priority: "0.9" },
    { loc: absoluteUrl("/about"), changefreq: "monthly", priority: "0.4" },
    { loc: absoluteUrl("/privacy-policy"), changefreq: "yearly", priority: "0.2" },
    {
      loc: absoluteUrl("/terms-conditions"),
      changefreq: "yearly",
      priority: "0.2",
    },
  ];

  flattenCategories(categoryTree?.data).forEach((category) =>
    entries.push({
      loc: absoluteUrl(`/categories/${category.slug}`),
      changefreq: "weekly",
      priority: "0.7",
    }),
  );

  topics
    .filter((topic) => topic?.slug && Number(topic.course_count || 0) > 0)
    .forEach((topic) =>
      entries.push({
        loc: absoluteUrl(`/topics/${topic.slug}`),
        lastmod: topic.updatedAt,
        changefreq: "weekly",
        priority: "0.6",
      }),
    );

  const instructors = new Set();
  courses.forEach((course) => {
    if (!course?.slug) return;
    entries.push({
      loc: absoluteUrl(`/courses/${course.slug}`),
      lastmod: course.updatedAt || course.updated_at,
      changefreq: "weekly",
      priority: "0.8",
    });
    const username = course.author?.data?.username;
    if (username) instructors.add(username);
  });

  instructors.forEach((username) =>
    entries.push({
      loc: absoluteUrl(`/user/${username}`),
      changefreq: "weekly",
      priority: "0.5",
    }),
  );

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400",
  );
  res.write(buildXml(entries));
  res.end();

  return { props: {} };
}

export default function Sitemap() {
  return null;
}
