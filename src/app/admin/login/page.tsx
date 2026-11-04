import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/adminSession";
import { loginAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

const MSG: Record<string, string> = {
  bad: "That key did not work.",
  wait: "Too many attempts. Wait 10 minutes and try again.",
  out: "Signed out.",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  if (!process.env.ADMIN_KEY) redirect("/");
  if (await isAdmin()) redirect("/admin");
  const { e } = await searchParams;
  return (
    <main className="mx-auto max-w-sm space-y-4 p-6">
      <h1 className="text-2xl font-bold text-[#002050]">Admin sign in</h1>
      {e && MSG[e] && (
        <p role="status" data-testid="login-msg" className="text-sm">
          {MSG[e]}
        </p>
      )}
      <form action={loginAction} className="space-y-3">
        <label className="flex flex-col text-sm font-bold">
          Admin key
          <input name="key" type="password" required autoComplete="current-password" className="border p-2 font-normal" />
        </label>
        <button className="btn px-4 py-2">Sign in</button>
      </form>
    </main>
  );
}
