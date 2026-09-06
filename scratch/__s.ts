import { renderStub, type Signature, type Language } from "../src/lib/driver-codegen.js";
import { CATALOG } from "../scripts/catalog/index.js";
const slugs = process.argv.slice(2);
const want: Language[] = ["typescript","java","cpp","c","csharp","go","kotlin","swift","rust","php","ruby"];
for (const slug of slugs) {
  const s = CATALOG.find((c) => c.slug === slug)!;
  console.log(`### ${slug}`);
  for (const l of want) console.log(`  ${l}: ${renderStub(l, s.signature as Signature).split("\n")[0]}`);
}
