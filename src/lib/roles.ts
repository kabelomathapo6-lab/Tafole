export type StaffRole = "waiter" | "kitchen" | "manager";

export const STAFF_HOME: Record<StaffRole, string> = {
  waiter: "/waiter",
  kitchen: "/kitchen",
  manager: "/manager",
};

export function isStaffRole(value: unknown): value is StaffRole {
  return value === "waiter" || value === "kitchen" || value === "manager";
}

const PROTECTED_PREFIXES = ["/waiter", "/kitchen", "/manager"] as const;

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Which staff areas a role may open. Managers can open every area. */
export function canAccess(role: StaffRole, pathname: string): boolean {
  if (role === "manager") return true;
  return matchesPrefix(pathname, STAFF_HOME[role]);
}

/**
 * Pure routing rule used by the proxy. Returns the path to redirect to, or null to let the
 * request through. Real data protection is Row Level Security in the database; this only
 * sends people to the right screen.
 */
export function decideRoute(input: {
  pathname: string;
  signedIn: boolean;
  role: StaffRole | null;
}): string | null {
  const { pathname, signedIn, role } = input;

  if (matchesPrefix(pathname, "/login")) {
    return signedIn && role ? STAFF_HOME[role] : null;
  }

  const isProtected = PROTECTED_PREFIXES.some((p) =>
    matchesPrefix(pathname, p),
  );
  if (!isProtected) return null;

  // Anonymous guests and accounts without a staff profile have no role.
  if (!signedIn || !role) return "/login";
  if (!canAccess(role, pathname)) return STAFF_HOME[role];
  return null;
}
