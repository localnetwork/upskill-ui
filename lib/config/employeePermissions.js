// Each section is visible when the user holds at least one of its permissions.
export const EMPLOYEE_SECTIONS = [
  {
    key: "overview",
    label: "Overview",
    permissions: null,
  },
  {
    key: "courses",
    label: "Course Review",
    permissions: ["courses.list", "courses.review", "courses.approve", "courses.reject"],
  },
  {
    key: "users",
    label: "Users",
    permissions: ["users.view", "users.suspend", "users.manage"],
  },
  {
    key: "categories",
    label: "Categories",
    permissions: ["categories.manage"],
  },
  {
    key: "tags",
    label: "Tags",
    permissions: ["tags.manage"],
  },
  {
    key: "payouts",
    label: "Payouts",
    permissions: ["payouts.manage"],
  },
  {
    key: "reports",
    label: "Reports",
    permissions: ["reports.view", "reports.revenue"],
  },
  {
    key: "settings",
    label: "Platform Settings",
    permissions: ["settings.view", "settings.manage"],
  },
];

export const ALL_EMPLOYEE_PERMISSIONS = Array.from(
  new Set(EMPLOYEE_SECTIONS.flatMap((section) => section.permissions || [])),
);

export function hasAnyPermission(userPermissions, required) {
  if (!required || required.length === 0) return true;
  const granted = new Set(userPermissions || []);
  return required.some((permission) => granted.has(permission));
}

export function getAccessibleSections(userPermissions, isAdmin = false) {
  return EMPLOYEE_SECTIONS.filter(
    (section) => isAdmin || hasAnyPermission(userPermissions, section.permissions),
  );
}
