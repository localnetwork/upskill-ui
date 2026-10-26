import Seo from "./Seo";

// Kept for backwards compatibility; prefer using <Seo /> directly.
export default function Meta({ title, description, keywords }) {
  return <Seo title={title} description={description} keywords={keywords} />;
}
