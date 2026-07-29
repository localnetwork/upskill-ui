const dotenv = require("dotenv");
const fs = require("fs");
const https = require("https");
const axios = require("axios").default;
module.exports.preBuildDevelopment = async () => {
  dotenv.config();
  // Convert the environment variables to a JSON object
  const envVars = {};
  for (const key in process.env) {
    envVars[key] = process.env[key];
  }

  const generateStaticJson = (filename, newData) => {
    const staticPath = "./lib/preBuildScripts/static/";
    const filePath = staticPath + filename;

    // Attempt to read the existing data
    let existingData;
    try {
      existingData = fs.readFileSync(filePath, "utf8");
    } catch (error) {
      existingData = null;
    }

    // If no existing data or data is different, write the new data
    if (existingData !== JSON.stringify(newData)) {
      console.log(`Generated new json file for \x1b[32m${filename}\x1b[0m`);
      fs.writeFileSync(filePath, JSON.stringify(newData));
    } else {
      console.log(`Skipping file write in \x1b[33m${filename}\x1b[0m.`);
    }
  };

  const buildCategoryTree = (rows = []) => {
    // Already-tree payload from backend (`/categories?tree=true`)
    if (
      Array.isArray(rows) &&
      rows.length > 0 &&
      Array.isArray(rows[0]?.children)
    ) {
      const normalizeTree = (items = []) =>
        items.map((item) => ({
          id: item.id,
          title: item.name || item.title,
          slug: item.slug,
          parentId: item.parentId || item.parent_id || null,
          topics: Array.isArray(item.topics) ? item.topics : [],
          children: normalizeTree(item.children || []),
        }));
      return normalizeTree(rows);
    }

    // Flat payload fallback
    const normalized = rows.map((item) => ({
      id: item.id,
      title: item.name || item.title,
      slug: item.slug,
      parentId: item.parentId || item.parent_id || null,
      topics: Array.isArray(item.topics) ? item.topics : [],
      children: [],
    }));

    const byId = new Map(normalized.map((item) => [item.id, item]));
    const roots = [];

    for (const item of normalized) {
      if (item.parentId && byId.has(item.parentId)) {
        byId.get(item.parentId).children.push(item);
      } else {
        roots.push(item);
      }
    }

    return roots;
  };

  const fetchAllTags = async () => {
    const allTags = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      // eslint-disable-next-line no-await-in-loop
      const response = await axios.get(
        envVars.NEXT_PUBLIC_API_URL + "/tags",
        {
          params: {
            page,
            limit: 200,
            nocache: true,
          },
        },
      );

      const rows = Array.isArray(response?.data?.data) ? response.data.data : [];
      const pagination = response?.data?.pagination || response?.data?.meta || {};
      totalPages = Number(pagination.total_pages || pagination.totalPages || 1);

      allTags.push(...rows);
      page += 1;
    }

    return allTags;
  };

  const attachTopicsToCategoryTree = (tree = [], tags = []) => {
    const byCategoryId = new Map();
    for (const tag of tags) {
      const categoryId = tag?.categoryId || tag?.category_id || null;
      if (!categoryId) continue;
      if (!byCategoryId.has(categoryId)) byCategoryId.set(categoryId, []);
      byCategoryId.get(categoryId).push({
        id: tag.id,
        title: tag.title || tag.name || "",
        slug: tag.slug || "",
        course_count: Number(tag.course_count || 0),
      });
    }

    const normalizeNode = (node) => ({
      ...node,
      topics: (byCategoryId.get(node.id) || []).sort((a, b) => {
        if (b.course_count !== a.course_count) return b.course_count - a.course_count;
        return String(a.title).localeCompare(String(b.title));
      }),
      children: (node.children || []).map(normalizeNode),
    });

    return tree.map(normalizeNode);
  };

  // GET PRICE TIERS
  const priceTiersHandler = await axios.get(
    envVars.NEXT_PUBLIC_API_URL + "/course-price-tiers",
  );

  const categoriesHandler = await axios.get(
    envVars.NEXT_PUBLIC_API_URL + "/categories?tree=true",
  );
  const tags = await fetchAllTags();

  generateStaticJson(
    "price-tiers.json",
    Array.isArray(priceTiersHandler.data)
      ? priceTiersHandler.data
      : priceTiersHandler.data?.data || [],
  );
  generateStaticJson(
    "categories.json",
    attachTopicsToCategoryTree(
      buildCategoryTree(categoriesHandler.data?.data || []),
      tags,
    ),
  );
};
