const PASSWORD_MIN_LENGTH_ISSUE = {
  origin: "string",
  code: "too_small",
  minimum: 8,
  inclusive: true,
  path: ["password"],
  message: "Password must be at least 8 characters",
};

export const validatePasswordInline = (password) => {
  if (typeof password !== "string" || password.length < 8) {
    return [{ ...PASSWORD_MIN_LENGTH_ISSUE }];
  }

  return null;
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
