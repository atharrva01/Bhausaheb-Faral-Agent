// Placeholder product art: each faral top-down on a round steel taat (docs/design/plan.md §8).
// One plate, one light direction (top-left), one ink outline weight, two flat colours per item.
// Real photos: put public/products/{slug}.jpg (shot top-down on a steel plate) and redeploy.
// Usage: node scripts/generate-product-art.mjs
import { mkdirSync, writeFileSync } from "node:fs";

const S = 200, C = 100;
const INK = 'stroke="#1d1a17" stroke-opacity="0.75" stroke-width="1.6" stroke-linejoin="round"';
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const plate = `
  <circle cx="${C}" cy="${C + 3}" r="93" fill="#1d1a17" opacity="0.12"/>
  <circle cx="${C}" cy="${C}" r="93" fill="#c5c9c4"/>
  <circle cx="${C}" cy="${C}" r="91" fill="#e9ebe7"/>
  <circle cx="${C}" cy="${C}" r="84" fill="#cfd3ce"/>
  <circle cx="${C}" cy="${C}" r="78" fill="#dcdfda"/>
  <path d="M 42 70 A 66 66 0 0 1 86 36" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.55"/>`;

const at = (n, r, jitter = 0.35) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + rnd() * jitter;
    const rr = i === 0 && n > 4 ? 0 : r * (0.75 + rnd() * 0.3);
    return [C + Math.cos(a) * rr, C + Math.sin(a) * rr];
  });

function spiral(x, y, size, colour) {
  let d = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
  for (let t = 0; t < Math.PI * 5.4; t += 0.25) {
    const r = (t / (Math.PI * 5.4)) * size;
    d += ` L ${(x + Math.cos(t) * r).toFixed(1)} ${(y + Math.sin(t) * r).toFixed(1)}`;
  }
  return `<path d="${d}" fill="none" stroke="#1d1a17" stroke-opacity="0.75" stroke-width="7.6" stroke-linecap="round"/>
          <path d="${d}" fill="none" stroke="${colour}" stroke-width="5.4" stroke-linecap="round"/>`;
}
const ball = (x, y, r, fill, dots = "") =>
  `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${fill}" ${INK}/>` +
  `<path d="M ${(x - r * 0.55).toFixed(1)} ${(y - r * 0.2).toFixed(1)} A ${r * 0.6} ${r * 0.6} 0 0 1 ${(x - r * 0.1).toFixed(1)} ${(y - r * 0.6).toFixed(1)}" stroke="#fff" stroke-opacity="0.5" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
  dots;

const art = {
  chakli: () => [[C, C], [C - 36, C - 22], [C + 36, C - 20], [C - 30, C + 30], [C + 32, C + 30]].map(([x, y]) => spiral(x, y, 21, "#9a5420")).join(""),
  "besan-ladoo": () => at(6, 38).map(([x, y]) => ball(x, y, 19, "#df9f37")).join(""),
  "rava-ladoo": () =>
    at(6, 38).map(([x, y]) => ball(x, y, 19, "#f2e8cf", `<circle cx="${(x + 5).toFixed(1)}" cy="${(y + 3).toFixed(1)}" r="2.6" fill="#5b2626"/><circle cx="${(x - 6).toFixed(1)}" cy="${(y + 6).toFixed(1)}" r="1.6" fill="#b88a4a"/>`)).join(""),
  karanji: () =>
    [[C - 26, C - 24, -25], [C + 26, C - 26, 20], [C + 28, C + 24, 160], [C - 26, C + 26, 200]]
      .map(([x, y, rot]) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M -30 8 A 30 26 0 0 1 30 8 Z" fill="#ebc277" ${INK}/><path d="M -28 8 A 28 24 0 0 1 28 8" fill="none" stroke="#b07a2a" stroke-width="2" stroke-dasharray="3 3.5"/></g>`)
      .join(""),
  shankarpali: () =>
    Array.from({ length: 22 }, () => {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 58, x = C + Math.cos(a) * r, y = C + Math.sin(a) * r;
      return `<rect x="${(x - 7).toFixed(1)}" y="${(y - 7).toFixed(1)}" width="14" height="14" transform="rotate(${(35 + rnd() * 20).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#e6b867" ${INK}/>`;
    }).join(""),
  chivda: () =>
    Array.from({ length: 150 }, (_, i) => {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 66, x = (C + Math.cos(a) * r).toFixed(1), y = (C + Math.sin(a) * r).toFixed(1);
      if (i % 10 === 0) return `<ellipse cx="${x}" cy="${y}" rx="5.5" ry="4" fill="#b8692c" ${INK}/>`;
      if (i % 17 === 0) return `<ellipse cx="${x}" cy="${y}" rx="7" ry="3" fill="#3f6b35" transform="rotate(${(rnd() * 180).toFixed(0)} ${x} ${y})"/>`;
      return `<ellipse cx="${x}" cy="${y}" rx="4.6" ry="2.2" fill="#efcd57" transform="rotate(${(rnd() * 180).toFixed(0)} ${x} ${y})"/>`;
    }).join(""),
  anarse: () =>
    at(5, 36, 0.2)
      .map(([x, y]) => {
        const seeds = Array.from({ length: 16 }, () => `<circle cx="${(x + (rnd() - 0.5) * 34).toFixed(1)}" cy="${(y + (rnd() - 0.5) * 34).toFixed(1)}" r="1.3" fill="#fbf8f0"/>`).join("");
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="22" fill="#8c4a24" ${INK}/>${seeds}`;
      })
      .join(""),
  shev: () =>
    Array.from({ length: 46 }, () => {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 50, x = C + Math.cos(a) * r, y = C + Math.sin(a) * r;
      const dx = (rnd() - 0.5) * 50, dy = (rnd() - 0.5) * 26;
      return `<path d="M ${x.toFixed(1)} ${y.toFixed(1)} q ${(dx / 2).toFixed(1)} -9 ${dx.toFixed(1)} ${dy.toFixed(1)}" stroke="#c98a22" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    }).join(""),
};

mkdirSync("public/products", { recursive: true });
for (const [slug, draw] of Object.entries(art)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" role="img" aria-label="${slug} on a steel plate">${plate}${draw()}</svg>\n`;
  writeFileSync(`public/products/${slug}.svg`, svg);
}
console.log("Wrote", Object.keys(art).length, "steel-taat illustrations to public/products/");
