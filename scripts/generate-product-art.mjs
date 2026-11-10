// Generates simple original placeholder illustrations into public/products/*.svg.
// Replace with real photos of Aai's faral later (keep the same filenames or update Product.imageUrl).
// Usage: node scripts/generate-product-art.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const W = 400;
const H = 300;
const cx = W / 2;
const cy = H / 2 + 10;

let s = 7;
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);

const plate = (bg) => `
  <rect width="${W}" height="${H}" fill="${bg}"/>
  ${rangoliCorner(0, 0, 1)}${rangoliCorner(W, H, -1)}
  <ellipse cx="${cx}" cy="${cy + 8}" rx="150" ry="104" fill="#000" opacity="0.08"/>
  <ellipse cx="${cx}" cy="${cy}" rx="150" ry="104" fill="#c9a24a"/>
  <ellipse cx="${cx}" cy="${cy}" rx="132" ry="90" fill="#e6c46a"/>
  <ellipse cx="${cx}" cy="${cy}" rx="120" ry="80" fill="#f3dd97"/>`;

function rangoliCorner(x, y, dir) {
  const petals = [0, 1, 2, 3, 4]
    .map((i) => {
      const a = (i / 4) * (Math.PI / 2) * dir + (dir < 0 ? Math.PI : 0);
      const px = x + Math.cos(a) * 34;
      const py = y + Math.sin(a) * 34;
      return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="9" fill="#e8772e" opacity="0.55"/>`;
    })
    .join("");
  return `<circle cx="${x}" cy="${y}" r="22" fill="#7a1f2b" opacity="0.5"/>${petals}`;
}

function scatter(n, draw, spreadX = 95, spreadY = 58) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd());
    out.push(draw(cx + Math.cos(a) * r * spreadX, cy + Math.sin(a) * r * spreadY, i));
  }
  return out.join("");
}

const spiral = (x, y, size, color) => {
  let d = `M ${x} ${y}`;
  for (let t = 0; t < Math.PI * 6; t += 0.3) {
    const r = (t / (Math.PI * 6)) * size;
    d += ` L ${(x + Math.cos(t) * r).toFixed(1)} ${(y + Math.sin(t) * r).toFixed(1)}`;
  }
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"/>`;
};

const ball = (x, y, r, fill, dot) =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/><circle cx="${x - r / 3}" cy="${y - r / 3}" r="${r / 3}" fill="#fff" opacity="0.25"/>${
    dot ? `<circle cx="${x + 3}" cy="${y - 2}" r="3" fill="${dot}"/>` : ""
  }`;

const art = {
  chakli: () => [[-55, -15], [45, -20], [0, 25], [-70, 35], [70, 30]].map(([dx, dy]) => spiral(cx + dx, cy + dy, 34, "#9a5b1e")).join(""),
  "besan-ladoo": () => [[-50, -10], [10, -25], [60, 5], [-20, 30], [40, 40]].map(([dx, dy]) => ball(cx + dx, cy + dy, 28, "#e0a43a", "#c27b2c")).join(""),
  "rava-ladoo": () => [[-50, -5], [12, -25], [62, 8], [-15, 32], [45, 42]].map(([dx, dy]) => ball(cx + dx, cy + dy, 27, "#f6ecd2", "#7a1f2b")).join(""),
  karanji: () =>
    [[-55, -10, -20], [20, -25, 15], [60, 25, -10], [-20, 35, 25]]
      .map(([dx, dy, rot]) => `<g transform="translate(${cx + dx} ${cy + dy}) rotate(${rot})"><path d="M -38 6 A 38 30 0 0 1 38 6 Z" fill="#f0c674" stroke="#b07a2a" stroke-width="3" stroke-dasharray="5 4"/></g>`)
      .join(""),
  shankarpali: () => scatter(26, (x, y) => `<rect x="${x - 9}" y="${y - 9}" width="18" height="18" transform="rotate(45 ${x} ${y})" fill="#e9b867" stroke="#c58a3a" stroke-width="1.5"/>`),
  chivda: () =>
    scatter(160, (x, y, i) =>
      i % 9 === 0
        ? `<ellipse cx="${x}" cy="${y}" rx="6" ry="4" fill="#b5652a"/>`
        : i % 13 === 0
          ? `<ellipse cx="${x}" cy="${y}" rx="7" ry="3" fill="#3f7d3a"/>`
          : `<ellipse cx="${x}" cy="${y}" rx="5" ry="2.5" fill="#f2c94c" opacity="0.9"/>`,
    105, 66),
  anarse: () =>
    [[-50, -10], [15, -22], [62, 12], [-15, 30], [45, 42]]
      .map(([dx, dy]) => {
        const x = cx + dx, y = cy + dy;
        const seeds = Array.from({ length: 14 }, () => `<circle cx="${(x + (rnd() - 0.5) * 44).toFixed(1)}" cy="${(y + (rnd() - 0.5) * 26).toFixed(1)}" r="1.6" fill="#fffbe9"/>`).join("");
        return `<ellipse cx="${x}" cy="${y}" rx="30" ry="18" fill="#a0522d"/>${seeds}`;
      })
      .join(""),
  shev: () =>
    Array.from({ length: 40 }, () => {
      const x = cx + (rnd() - 0.5) * 190, y = cy + (rnd() - 0.5) * 110;
      const dx = (rnd() - 0.5) * 60, dy = (rnd() - 0.5) * 30;
      return `<path d="M ${x.toFixed(1)} ${y.toFixed(1)} q ${(dx / 2).toFixed(1)} ${(-10).toFixed(1)} ${dx.toFixed(1)} ${dy.toFixed(1)}" stroke="#e0a02c" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    }).join(""),
};

mkdirSync("public/products", { recursive: true });
for (const [slug, draw] of Object.entries(art)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${slug}">${plate("#fbefd9")}${draw()}</svg>\n`;
  writeFileSync(`public/products/${slug}.svg`, svg);
}
console.log("Wrote", Object.keys(art).length, "illustrations to public/products/");
