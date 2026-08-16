import fs from "node:fs";
import path from "node:path";

const USERNAME = process.env.GH_USERNAME || process.env.GITHUB_REPOSITORY_OWNER;
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const THEME = process.env.THEME === "light" ? "light" : "dark";
const OUTPUT = process.env.OUTPUT_PATH || `dist/v3dant-contribution-${THEME}.svg`;

const COLS = 34;
const ROWS = 7;
const CELL = 11;
const STEP = 14;
const GRID_X = 22;
const GRID_Y = 25;
const WIDTH = 540;
const HEIGHT = 190;
const LOOP_DUR = 20;
const MAX_TARGETS = 12;

const palette = THEME === "light"
  ? {
      background: "#ffffff",
      border: "#d0d7de",
      empty: "#ebedf0",
      label: "#57606a",
      jet: "#0969da",
      jetStroke: "#0550ae",
      flash: "#1a7f37",
      bullet: "#1a7f37",
      blast: "#40c463",
      star: "#8c959f",
    }
  : {
      background: "#0d1117",
      border: "#30363d",
      empty: "#161b22",
      label: "#8b949e",
      jet: "#58a6ff",
      jetStroke: "#1f6feb",
      flash: "#39d353",
      bullet: "#7ee787",
      blast: "#56d364",
      star: "#8b949e",
    };

if (!USERNAME) throw new Error("Missing GH_USERNAME or GITHUB_REPOSITORY_OWNER");
if (!TOKEN) throw new Error("Missing GH_TOKEN or GITHUB_TOKEN");

const QUERY = `
  query($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays { contributionCount color }
          }
        }
      }
    }
  }
`;

async function fetchWeeks() {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "V3DANT-lab-profile-assets",
    },
    body: JSON.stringify({ query: QUERY, variables: { login: USERNAME } }),
  });

  if (!response.ok) throw new Error(`GitHub API error ${response.status}: ${await response.text()}`);
  const json = await response.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data.user.contributionsCollection.contributionCalendar.weeks;
}

function buildCells(weeks) {
  const recent = weeks.slice(-COLS);
  const padCount = COLS - recent.length;
  const padded = Array.from({ length: padCount }, () => ({
    contributionDays: Array.from({ length: ROWS }, () => ({ contributionCount: 0, color: palette.empty })),
  })).concat(recent);

  const cells = [];
  padded.forEach((week, col) => {
    week.contributionDays.forEach((day, row) => {
      cells.push({
        col,
        row,
        x: GRID_X + col * STEP,
        y: GRID_Y + row * STEP,
        color: day.color || palette.empty,
        count: day.contributionCount || 0,
      });
    });
  });
  return cells;
}

function pickTargets(cells) {
  return [...cells]
    .filter((cell) => cell.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_TARGETS)
    .sort((a, b) => a.col - b.col || a.row - b.row);
}

function keyTimeForCol(col, direction) {
  const t = 0.02 + (col / (COLS - 1)) * 0.46;
  return direction === "forward" ? t : 1 - t;
}

function fmt(value) { return Number(value.toFixed(4)); }

function buildGrid(cells, targets) {
  const targetKeys = new Set(targets.map((cell) => `${cell.col}-${cell.row}`));
  return cells.map((cell) => {
    const key = `${cell.col}-${cell.row}`;
    if (!targetKeys.has(key)) {
      return `<rect x="${cell.x}" y="${cell.y}" width="${CELL}" height="${CELL}" rx="2" fill="${cell.color}"/>`;
    }

    const forward = keyTimeForCol(cell.col, "forward");
    const backward = keyTimeForCol(cell.col, "backward");
    const first = Math.min(forward, backward);
    const second = Math.max(forward, backward);
    const duration = 0.006;
    return `<rect x="${cell.x}" y="${cell.y}" width="${CELL}" height="${CELL}" rx="2" fill="${cell.color}"><animate attributeName="fill" dur="${LOOP_DUR}s" repeatCount="indefinite" keyTimes="0;${fmt(first)};${fmt(first + duration)};${fmt(second)};${fmt(second + duration)};1" values="${cell.color};${cell.color};${palette.flash};${cell.color};${palette.flash};${cell.color}"/></rect>`;
  }).join("\n");
}

function buildBulletsAndBlasts(targets) {
  const padY = 158;
  let bullets = "";
  let blasts = "";
  const duration = 0.006;

  for (const direction of ["forward", "backward"]) {
    const ordered = direction === "forward" ? targets : [...targets].reverse();
    for (const cell of ordered) {
      const arrival = keyTimeForCol(cell.col, direction);
      const rise = arrival - duration * 3;
      const end = arrival + duration;
      const cx = fmt(cell.x + CELL / 2);
      const cy = fmt(cell.y + CELL / 2);
      bullets += `<circle cx="${cx}" cy="${padY}" r="2.4" fill="${palette.bullet}"><animate attributeName="cy" dur="${LOOP_DUR}s" repeatCount="indefinite" keyTimes="0;${fmt(rise)};${fmt(arrival)};1" values="${padY};${padY};${cy};${cy}"/><animate attributeName="opacity" dur="${LOOP_DUR}s" repeatCount="indefinite" keyTimes="0;${fmt(rise)};${fmt(arrival)};${fmt(end)};1" values="0;1;1;0;0"/></circle>`;
      blasts += `<circle cx="${cx}" cy="${cy}" r="0" fill="none" stroke="${palette.blast}" stroke-width="1.6" opacity="0"><animate attributeName="r" dur="${LOOP_DUR}s" repeatCount="indefinite" keyTimes="0;${fmt(arrival)};${fmt(arrival + duration * 3)};1" values="0;1;9;9"/><animate attributeName="opacity" dur="${LOOP_DUR}s" repeatCount="indefinite" keyTimes="0;${fmt(arrival)};${fmt(arrival + duration * 3)};1" values="0;1;1;0"/></circle>`;
    }
  }
  return { bullets, blasts };
}

function buildStars() {
  return [[10, 18], [10, 62], [10, 105], [520, 20], [520, 70], [520, 112]]
    .map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="1.2" fill="${palette.star}" opacity="0.7"><animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite"/></circle>`)
    .join("\n");
}

function buildJet() {
  return `<g id="jet"><g transform="translate(0,0)"><polygon points="0,-16 8,6 4,3 -4,3 -8,6" fill="${palette.jet}" stroke="${palette.jetStroke}" stroke-width="1"/><polygon points="-8,6 -14,12 -4,7" fill="${palette.jet}"/><polygon points="8,6 14,12 4,7" fill="${palette.jet}"/><circle cx="0" cy="-6" r="2.2" fill="#ffffff"/><polygon points="-3,7 3,7 0,15" fill="#f0883e"><animate attributeName="opacity" values="0.5;1;0.6;1" dur="0.18s" repeatCount="indefinite"/></polygon></g><animateTransform attributeName="transform" type="translate" dur="${LOOP_DUR}s" repeatCount="indefinite" keyTimes="0;0.5;1" values="35,158;478,158;35,158"/></g>`;
}

function buildSvg(weeks) {
  const cells = buildCells(weeks);
  const targets = pickTargets(cells);
  const { bullets, blasts } = buildBulletsAndBlasts(targets);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-labelledby="title desc"><title id="title">V3DANT-lab animated GitHub contribution activity</title><desc id="desc">An animated jet travels over the V3DANT-lab contribution grid.</desc><rect width="${WIDTH}" height="${HEIGHT}" rx="12" fill="${palette.background}" stroke="${palette.border}"/><text x="20" y="16" fill="${palette.label}" font-family="ui-monospace, monospace" font-size="10">V3DANT-lab · CONTRIBUTIONS</text><g id="stars">${buildStars()}</g><g id="grid">${buildGrid(cells, targets)}</g><g id="bullets">${bullets}</g><g id="blasts">${blasts}</g>${buildJet()}</svg>`;
}

const weeks = await fetchWeeks();
const outputPath = path.resolve(OUTPUT);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, buildSvg(weeks), "utf8");
console.log(`Wrote ${outputPath} for ${USERNAME} (${THEME} theme)`);
