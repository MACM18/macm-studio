export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function adminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map(normalizeEmail)
      .filter(Boolean),
  );
}

export function isAllowlistedAdmin(email: string) {
  return adminEmails().has(normalizeEmail(email));
}
