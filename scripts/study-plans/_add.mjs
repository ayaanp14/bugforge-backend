import { readFileSync, writeFileSync } from "node:fs";
const [slug, dir] = process.argv.slice(2);
const p = "scripts/study-plans/java/track.ts";
let s = readFileSync(p, "utf8");
if (!s.includes(`from "./${dir}/module.js"`)) {
  s = s.replace(/(import \w+ from "\.\/[^"]+\/module\.js";\n)(?![\s\S]*import \w+ from "\.\/[^"]+\/module\.js";\n)/, `$1import ${slug} from "./${dir}/module.js";\n`);
  s = s.replace(/modules: \[([^\]]*)\],/, (m, list) => `modules: [${list}, ${slug}],`);
  writeFileSync(p, s);
}
console.log(s.match(/modules: \[[^\]]*\]/)[0]);
