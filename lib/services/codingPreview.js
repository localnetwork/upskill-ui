export const MARKUP_LANGUAGES = ["html", "css"];

export const DEFAULT_CSS_PREVIEW_HTML = `<h1>Welcome to my page</h1>
<p class="intro">Edit the CSS on the left to style this page.</p>
<a href="#" class="button">Click me</a>
<ul>
  <li>First item</li>
  <li>Second item</li>
  <li>Third item</li>
</ul>`;

// Builds the iframe document: HTML renders as-is, CSS is applied to the exercise's sample HTML.
export function buildPreviewDocument(language, code, previewHtml) {
  const source = String(code || "");
  if (language !== "css") return source;
  const body = String(previewHtml || "").trim() || DEFAULT_CSS_PREVIEW_HTML;
  const safeCss = source.replace(/<\/style/gi, "<\\/style");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${safeCss}</style></head><body>${body}</body></html>`;
}
