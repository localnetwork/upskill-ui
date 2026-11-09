const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fieldValidators = {
  username: (v, { loose } = {}) => {
    const value = (v || "").trim();
    if (!value) return loose ? "Username or email is required" : "Username is required";
    if (!loose && value.length < 3) return "Username must be at least 3 characters";
    if (!loose && value.length > 40) return "Username must be at most 40 characters";
    if (!loose && /\s/.test(value)) return "Username cannot contain spaces";
    if (!loose && !/^[a-zA-Z0-9._-]+$/.test(value))
      return "Use only letters, numbers, dots, underscores and hyphens";
    return null;
  },
  email: (v) => {
    const value = (v || "").trim();
    if (!value) return "Email is required";
    if (!EMAIL_REGEX.test(value)) return "Enter a valid email address";
    return null;
  },
  fullName: (v) => {
    const value = (v || "").trim();
    if (!value) return "Full name is required";
    if (value.length < 2) return "Full name must be at least 2 characters";
    return null;
  },
};

const LOGIN_FIELDS = ["username"];
const REGISTER_FIELDS = ["fullName", "email"];

// Returns an error message for one field, or null.
export const validateAuthField = (form, field, values = {}) => {
  const loose = form === "login";
  return fieldValidators[field]?.(values[field], { loose, values }) || null;
};

// Returns an object of { field: message } for every invalid field, or null.
export const validateAuthForm = (form, values = {}) => {
  const fields = form === "login" ? LOGIN_FIELDS : REGISTER_FIELDS;
  const result = {};
  fields.forEach((field) => {
    const message = validateAuthField(form, field, values);
    if (message) result[field] = message;
  });
  return Object.keys(result).length ? result : null;
};

export const validateEmailInline = (email) => {
  if (!email || !email.trim()) {
    return [
      {
        origin: "string",
        code: "too_small",
        minimum: 1,
        inclusive: true,
        path: ["email"],
        message: "Email is required",
      },
    ];
  }

  return null;
};
