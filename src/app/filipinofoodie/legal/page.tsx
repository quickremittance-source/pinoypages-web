import fs from "node:fs";
import path from "node:path";
import { marked } from "marked";
import { ffMeta } from "../meta";

export const metadata = ffMeta("Disclaimers", "Filipino Foodie disclaimers (draft).", "/legal");

export default function Legal() {
  const md = fs.readFileSync(path.join(process.cwd(), "content/foodie-legal.md"), "utf8");
  return (
    <div className="py-6">
      <p className="mb-4 rounded bg-sunset/30 p-3 text-sm font-semibold">DRAFT: not yet reviewed by a lawyer.</p>
      <article className="prose max-w-3xl" dangerouslySetInnerHTML={{ __html: marked.parse(md, { async: false }) }} />
    </div>
  );
}
