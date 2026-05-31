// Deep-merge every messages/_fragments/*.json into messages/en.json.
// Each fragment is a nested object shaped like the catalog (top-level
// namespace → keys), containing only NEW keys to add. Existing keys are
// preserved; on a leaf conflict the fragment value wins (warned).
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const MESSAGES = join(ROOT, "messages");
const FRAGMENTS = join(MESSAGES, "_fragments");

function deepMerge(target, src, path = "") {
  for (const k of Object.keys(src)) {
    const sv = src[k];
    const tv = target[k];
    const p = path ? `${path}.${k}` : k;
    if (sv && typeof sv === "object" && !Array.isArray(sv)) {
      if (!tv || typeof tv !== "object" || Array.isArray(tv)) target[k] = {};
      deepMerge(target[k], sv, p);
    } else {
      if (tv !== undefined && tv !== sv) console.warn(`overwrite ${p}`);
      target[k] = sv;
    }
  }
}

if (!existsSync(FRAGMENTS)) {
  console.error("no _fragments dir");
  process.exit(1);
}
const en = JSON.parse(readFileSync(join(MESSAGES, "en.json"), "utf8"));
for (const file of readdirSync(FRAGMENTS)) {
  if (!file.endsWith(".json")) continue;
  const frag = JSON.parse(readFileSync(join(FRAGMENTS, file), "utf8"));
  deepMerge(en, frag);
  console.log(`merged ${file} (top: ${Object.keys(frag).join(", ")})`);
}
writeFileSync(join(MESSAGES, "en.json"), JSON.stringify(en, null, 2) + "\n", "utf8");
console.log("wrote en.json");
