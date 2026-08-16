import fs from "node:fs";
import path from "node:path";

const files = process.argv.slice(2);
const targets = files.length ? files : [
  "dist/v3dant-contribution-dark.svg",
  "dist/v3dant-contribution-light.svg",
];

for (const file of targets) {
  const resolved = path.resolve(file);
  if (!fs.existsSync(resolved)) throw new Error(`Missing SVG: ${file}`);
  const svg = fs.readFileSync(resolved, "utf8");
  for (const marker of ["<svg", "V3DANT-lab", "<animate", "<rect"]) {
    if (!svg.includes(marker)) throw new Error(`${file} does not contain ${marker}`);
  }
  console.log(`PASS ${file}`);
}
