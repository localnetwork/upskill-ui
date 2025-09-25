import { rolesAndPermissions } from "../config/rolesandpermissions";

export function filteredLinks(links, userRoles) {
  if (!userRoles || userRoles.length === 0) return [];

  // 1️⃣ Collect all permissions from the user's roles (match by role.id → int)
  const userPermissions = userRoles
    .map((role) => {
      const roleId = parseInt(role.id, 10); // ensure number
      const roleConfig = rolesAndPermissions.find(
        (r) => parseInt(r.id, 10) === roleId
      );
      return roleConfig ? roleConfig.permissions : [];
    })
    .flat();

  // 2️⃣ Filter links based on access rules
  return links.filter((link) => {
    // No access key → visible to everyone
    if (!link.access) return true;

    const accessList = Array.isArray(link.access) ? link.access : [link.access];

    // "*" means open to all authenticated roles
    if (accessList.includes("*")) return true;

    // Check if user has at least one of the required permissions
    return accessList.some((a) => userPermissions.includes(a));
  });
}
