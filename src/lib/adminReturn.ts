/** Safe local return path for admin sign-in: only same-site /admin paths, no protocol-relative or backslash tricks. */
export function safeAdminNext(raw: unknown): string {
  const s = typeof raw === "string" ? raw : "";
  if (!s.startsWith("/admin") || s.startsWith("//") || /[\\\s]/.test(s) || s.startsWith("/admin/login")) return "/admin";
  if (s.length > 300) return "/admin";
  return s;
}
