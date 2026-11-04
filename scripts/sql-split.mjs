// Split a migration file into statements. Drops "--" comments (whole-line or trailing, outside quotes)
// before splitting on ";" so "stmt; -- note" lines work. Dollar-quoted bodies ($$...$$) are kept intact.
export function splitSql(text) {
  const out = [];
  let cur = "";
  let q = null; // "'" | '"' | "$$"
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (q === "$$" ? text.startsWith("$$", i) : c === q) {
        cur += q;
        i += q.length - 1;
        q = null;
      } else cur += c;
      continue;
    }
    if (c === "-" && text[i + 1] === "-") {
      while (i < text.length && text[i] !== "\n") i++;
      cur += "\n";
      continue;
    }
    if (text.startsWith("$$", i)) {
      q = "$$";
      cur += "$$";
      i++;
      continue;
    }
    if (c === "'" || c === '"') q = c;
    if (c === ";") {
      if (cur.trim()) out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
