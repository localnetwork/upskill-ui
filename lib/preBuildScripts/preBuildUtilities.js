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

  // GET PRICE TIERS
  const priceTiersHandler = await axios.get(
    envVars.NEXT_PUBLIC_API_URL + "/course-price-tiers"
  );

  generateStaticJson("price-tiers.json", priceTiersHandler.data);
};
