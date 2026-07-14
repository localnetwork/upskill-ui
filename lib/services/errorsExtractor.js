export function extractErrors(errors, field) {
  if (!errors || typeof errors !== "object") return null;

  console.log("erroraaas", errors);

  // Support Zod errors format
  if (Array.isArray(errors)) {
    const issue = errors.find((error) => error.path?.[0] === field);

    return issue?.message || null;
  }

  // Support normal object format
  return errors[field] || null;
}
