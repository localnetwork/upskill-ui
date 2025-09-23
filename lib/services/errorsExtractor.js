export function extractErrors(errors, field) {
  if (!errors || typeof errors !== "object") return null;
  return errors[field] || null; // return the message if it exists
}
