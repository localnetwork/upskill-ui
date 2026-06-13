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

  // GET PRICE TIERS
  const priceTiersHandler = await axios.get(
    envVars.NEXT_PUBLIC_API_URL + "/course-price-tiers",
  );

  const categoriesHandler = await axios.get(
    envVars.NEXT_PUBLIC_API_URL + "/categories?tree=true",
  );

  generateStaticJson(
    "price-tiers.json",
    Array.isArray(priceTiersHandler.data)
      ? priceTiersHandler.data
      : priceTiersHandler.data?.data || [],
  );
  generateStaticJson(
    "categories.json",
    buildCategoryTree(categoriesHandler.data?.data || []),
  );
};
