"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeAdminNext } from "@/lib/adminReturn";
import { ADMIN_COOKIE, SESSION_SECONDS, checkKey, loginBlocked, makeSession, noteFail } from "@/lib/adminSession";

export async function loginAction(fd: FormData) {
  const h = await headers();
  const next = safeAdminNext(fd.get("next"));
  const q = next === "/admin" ? "" : `&next=${encodeURIComponent(next)}`;
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  if (loginBlocked(ip)) redirect(`/admin/login?e=wait${q}`);
  if (!checkKey(String(fd.get("key") ?? ""))) {
    noteFail(ip);
    await new Promise((r) => setTimeout(r, 500));
    redirect(`/admin/login?e=bad${q}`);
  }
  (await cookies()).set(ADMIN_COOKIE, makeSession(), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
  redirect(next);
}

export async function logoutAction() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/" });
  redirect("/admin/login?e=out");
}
