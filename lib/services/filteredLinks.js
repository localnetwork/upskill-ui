import { rolesAndPermissions } from "../config/rolesandpermissions";

export function filteredLinks(links, userRoles, explicitPermissions = []) {
  if (!userRoles || userRoles.length === 0) return [];

  const normalizeRoleId = (role) => {
    if (!role) return null;
    if (typeof role === "string") {
      if (role === "ADMIN") return "1";
      if (role === "EDUCATOR") return "2";
      if (role === "LEARNER") return "3";
      return null;
    }
    if (role.role_id) return String(role.role_id);
    if (role.id) return String(role.id);
    if (role.name === "ADMIN") return "1";
    if (role.name === "EDUCATOR") return "2";
    if (role.name === "LEARNER") return "3";
    return null;
  };

  // 1️⃣ Collect all permissions from the user's roles
  const roleDerivedPermissions = userRoles
    .map((role) => {
      const roleId = normalizeRoleId(role);
      const roleConfig = rolesAndPermissions.find((r) => String(r.id) === roleId);
      return roleConfig ? roleConfig.permissions : [];
    })
    .flat();
  const userPermissions = [...new Set([...(Array.isArray(explicitPermissions) ? explicitPermissions : []), ...roleDerivedPermissions])];

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
