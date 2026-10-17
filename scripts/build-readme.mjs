// Builds the bento-grid profile README: one SVG per tile so each tile can carry its own link.
// Usage: node scripts/build-readme.mjs  (writes README.md and assets/*.svg at the repo root)
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPTS = dirname(fileURLToPath(import.meta.url));
const ROOT = join(SCRIPTS, "..");
const OUT = join(ROOT, "assets");
mkdirSync(OUT, { recursive: true });

// ── Tokens ───────────────────────────────────────────────────────────────────
const SANS = `'Segoe UI Variable Display','Segoe UI',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Inter,Arial,sans-serif`;
const MONO = `ui-monospace,'Cascadia Code',SFMono-Regular,Consolas,Menlo,monospace`;
const SERIF = `Georgia,'Times New Roman',serif`;
const C = {
  tile: "#101318", line: "#23272E", text: "#F0F3F6", body: "#C9D1D9", muted: "#8B949E", faint: "#6E7681",
  gold: "#C5A572", goldHi: "#E8D3A6", goldDeep: "#8A7048", ink: "#0A0A0A", chip: "#161A20", chipLine: "#2A2F37",
};
const PAD = 8, R = 26; // half the gutter between tiles, tile corner radius

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const mw = (s, size, ls = 0) => s.length * (size * 0.6 + ls);

// ── Brand geometry ───────────────────────────────────────────────────────────
const logoSrc = readFileSync(join(OUT, "regn-logo-dark.svg"), "utf8");
const waves = logoSrc.match(/<path[^>]*\/>/g).slice(0, 3);
const logoInner = logoSrc.slice(logoSrc.indexOf(">", logoSrc.indexOf("<g")) + 1, logoSrc.lastIndexOf("</g>"));
const wavesG = (fill) => waves.map((p, i) => `<g class="w${i + 1}">${p.replace("/>", ` fill="${fill}"/>`)}</g>`).join("");
const logo = (x, y, h, fill) => `<svg x="${x}" y="${y}" width="${h * 4.2}" height="${h}" viewBox="140 400 2100 500"><g fill="${fill}">${logoInner}</g></svg>`;

const fiyatShapes = (readFileSync(join(SCRIPTS, "src", "fiyat-logo.svg"), "utf8").match(/<(path|circle)[^>]*\/>/g) || [])
  .map((s) => s.replace(/class="st0"/, 'fill="#43A9FE"').replace(/class="st1"/, 'fill="#0063FE"')).join("");
const icon = {
  pulse: (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><rect width="96" height="96" rx="21" fill="#C8F04A"/>
<g transform="scale(3) translate(6.08 6.08) scale(.62)" fill="none" stroke="#08080A" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 23 L10 23 L14.5 7 L19 23 L28 23"/>
<circle class="beat" cx="14.5" cy="7" r="2.25" fill="#08080A" stroke="none"/></g></g>`,
  wedge: (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><defs><clipPath id="wt"><rect width="64" height="64" rx="15"/></clipPath>
<linearGradient id="wbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2B2C3A"/><stop offset="1" stop-color="#14151C"/></linearGradient></defs>
<g transform="scale(1.5)"><g clip-path="url(#wt)"><rect width="64" height="64" fill="url(#wbg)"/>
<rect x="23" y="12" width="51" height="11" rx="5.5" fill="#8D97FF"/><rect x="11" y="26.5" width="63" height="11" rx="5.5" fill="#FF7FAC"/><rect x="27" y="41" width="47" height="11" rx="5.5" fill="#F6BB45"/></g>
<rect x=".5" y=".5" width="63" height="63" rx="14.5" fill="none" stroke="#FFFFFF" stroke-opacity=".08"/></g></g>`,
  fiyat: (x, y, s) => `<g transform="translate(${x},${y}) scale(${s})"><rect width="96" height="96" rx="22" fill="#0D1A33" stroke="#1B2B4A"/>
<g transform="translate(17,17) scale(.0352) translate(-171,-127)">${fiyatShapes}</g></g>`,
};

// ── Primitives ───────────────────────────────────────────────────────────────
const STYLE = `<style>
.s{font-family:${SANS}} .m{font-family:${MONO}} .r{font-family:${SERIF}}
@keyframes drift{0%,100%{transform:translateX(0)}50%{transform:translateX(30px)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes beat{0%,100%{transform:scale(1)}50%{transform:scale(1.4)}}
.w1{animation:drift 7s ease-in-out infinite}.w2{animation:drift 7s ease-in-out -2.3s infinite}.w3{animation:drift 7s ease-in-out -4.6s infinite}
.live{animation:blink 2.4s ease-in-out infinite}
.beat{transform-box:fill-box;transform-origin:center;animation:beat 1.6s ease-in-out infinite}
@media (prefers-reduced-motion: reduce){*{animation:none!important}}
</style>`;

// A tile canvas: w×h including PAD on every side; body is drawn in tile-local coordinates.
function tile(name, w, h, label, body, { fill = C.tile, stroke = C.line, defs = "", overlay = "" } = {}) {
  const iw = w - PAD * 2, ih = h - PAD * 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
${STYLE}
<defs><clipPath id="clip"><rect width="${iw}" height="${ih}" rx="${R}"/></clipPath>${defs}</defs>
<g transform="translate(${PAD},${PAD})">
<g clip-path="url(#clip)"><rect width="${iw}" height="${ih}" fill="${fill}"/>${overlay}</g>
<rect x="1" y="1" width="${iw - 2}" height="${ih - 2}" rx="${R - 1}" fill="none" stroke="${stroke}" stroke-width="2"/>
${body}
</g>
</svg>
`;
  writeFileSync(join(OUT, `${name}.svg`), svg);
}

function chip(x, y, text, { size = 13, h = 30, fill = C.chip, stroke = C.chipLine, color = C.body, weight = 400, ls = 0 } = {}) {
  const w = mw(text, size, ls) + 24;
  return [`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${fill}" stroke="${stroke}"/><text x="${x + w / 2}" y="${y + h / 2 + size * 0.36}" text-anchor="middle" class="m" font-size="${size}" font-weight="${weight}" letter-spacing="${ls}" fill="${color}">${esc(text)}</text>`, w];
}
const chipRow = (x, y, list, opts) => { let out = ""; for (const t of list) { const [s, w] = chip(x, y, t, opts); out += s; x += w + 8; } return out; };
const arrow = (x, y, color = C.muted) => `<path d="M${x} ${y + 12} L${x + 12} ${y} M${x + 3} ${y} H${x + 12} V${y + 9}" stroke="${color}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

// ── Data ─────────────────────────────────────────────────────────────────────
const products = [
  { k: "pulse", name: "Pulse", cat: "Windows observability", accent: "#C8F04A", status: "SHIPPED",
    line: ["Read-only diagnostics for Windows.", "Event Log in plain language."], stack: ["Flutter", "C++20", "Win32"],
    repo: "Regncreative/Pulse", site: "https://pulse.regncreative.com",
    alt: "Pulse — Windows observability. Read-only diagnostics for Windows: Event Log activity in plain language, live system health, hardware inventory and local reports. Flutter, C++20, Win32. Shipped." },
  { k: "wedge", name: "Wedge", cat: "File shelf for Windows", accent: "#8D97FF", status: "SHIPPED",
    line: ["A file shelf on the edge of", "your screen. Drag files in and out."], stack: ["Tauri", "Rust", "React"],
    repo: "Regncreative/Wedge", site: "https://wedge.regncreative.com",
    alt: "Wedge — File shelf for Windows. Park files on the edge of your screen while you work and drag them out when you need them. Tauri, Rust, React. Shipped." },
  { k: "fiyat", name: "Fiyat Avcısı", cat: "Price intelligence", accent: "#43A9FE", status: "LIVE",
    line: ["Self-hostable price tracking with", "history, alerts and crawlers."], stack: ["React", "PostgreSQL", "Redis"],
    repo: "Regncreative/fiyat-avcisi", site: "https://fiyatavcisi.com",
    alt: "Fiyat Avcısı — E-commerce price intelligence. Self-hostable price tracking with scheduled crawling, price history and alerts. React, PostgreSQL, Redis. Live." },
];
const stack = [
  ["DESKTOP", ["Flutter", "Dart", "C++20", "Rust", "Tauri"]],
  ["WEB", ["TypeScript", "React", "Next.js", "Vite", "Tailwind"]],
  ["DATA", ["Node.js", "Express", "PostgreSQL", "Redis", "SQLite"]],
  ["SYSTEM", ["Win32", "Named pipes", "BullMQ", "PowerShell"]],
];

// ── Tiles ────────────────────────────────────────────────────────────────────
// Row 1 — hero (800×420) + profile (400×420)
tile("hero", 800, 420, "Regn Software — Software, products & visual systems", `
${logo(36, 36, 42, C.text)}
<circle class="live" cx="${784 - 40 - mw("REGNSOFTWARE.COM", 13, 2) - 14}" cy="56" r="4.5" fill="${C.gold}"/>
<text x="${784 - 40}" y="61" text-anchor="end" class="m" font-size="13" letter-spacing="2" fill="${C.muted}">REGNSOFTWARE.COM</text>
<text x="34" y="200" class="s" font-size="64" font-weight="700" letter-spacing="-1.8" fill="${C.text}">Software,</text>
<text x="34" y="268" class="s" font-size="64" font-weight="700" letter-spacing="-1.8" fill="${C.text}">products &amp;</text>
<text x="34" y="336" class="s" font-size="64" font-weight="700" letter-spacing="-1.8" fill="url(#hl)">visual systems.</text>
<text x="36" y="374" class="s" font-size="18" fill="${C.muted}">Independent studio — Windows apps, web products and the systems around them.</text>`, {
  defs: `<radialGradient id="g" cx=".92" cy=".08" r=".85"><stop offset="0" stop-color="${C.gold}" stop-opacity=".3"/><stop offset="1" stop-color="${C.gold}" stop-opacity="0"/></radialGradient>
<linearGradient id="hl" x1="0" x2="1"><stop offset="0" stop-color="${C.goldHi}"/><stop offset=".6" stop-color="${C.gold}"/><stop offset="1" stop-color="${C.goldDeep}"/></linearGradient>
<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="${C.faint}"/></pattern>
<linearGradient id="fade" x1="0" x2="1"><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".5"/></linearGradient>
<mask id="dm"><rect width="784" height="404" fill="url(#fade)"/></mask>`,
  overlay: `<rect width="784" height="404" fill="url(#dots)" mask="url(#dm)"/><rect width="784" height="404" fill="url(#g)"/>
<svg x="430" y="40" width="400" height="340" viewBox="160 390 560 390" opacity=".09">${wavesG("#fff")}</svg>`,
});

tile("profile", 400, 420, "Sinan Öz — founder, design & engineering. Focus: desktop, web, UI/UX. Origin: graphic design. Based in Turkey.", `
<circle cx="80" cy="84" r="46" fill="url(#av)"/>
<text x="80" y="97" text-anchor="middle" class="s" font-size="34" font-weight="700" fill="${C.ink}">SÖ</text>
<text x="344" y="61" text-anchor="end" class="m" font-size="12" letter-spacing="2" fill="${C.muted}">FOUNDER</text>
<text x="34" y="186" class="s" font-size="34" font-weight="700" letter-spacing="-.6" fill="${C.text}">Sinan Öz</text>
<text x="35" y="216" class="s" font-size="17" fill="${C.muted}">Design &amp; engineering</text>
${[["FOCUS", "Desktop · Web · UI/UX"], ["ORIGIN", "Graphic design"], ["BASED", "Turkey · GMT+3"]].map(([k, v], i) => {
  const y = 276 + i * 44;
  return `<rect x="34" y="${y - 26}" width="316" height="1" fill="${C.line}"/><text x="34" y="${y}" class="m" font-size="12" letter-spacing="2" fill="${C.gold}">${k}</text><text x="350" y="${y}" text-anchor="end" class="s" font-size="17" fill="${C.text}">${esc(v)}</text>`;
}).join("\n")}`, {
  defs: `<linearGradient id="av" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.goldHi}"/><stop offset="1" stop-color="${C.goldDeep}"/></linearGradient>`,
});

// Row 2 — products (400×340 each)
products.forEach((p, i) => {
  const [pill, pw] = chip(0, 0, p.status, { size: 11, h: 26, fill: C.gold, stroke: C.gold, color: C.ink, weight: 700, ls: 1.5 });
  tile(`product-${p.k}`, 400, 340, p.alt, `
${icon[p.k](30, 30, 0.66)}
<g transform="translate(${384 - 30 - pw},38)">${pill}</g>
<text x="30" y="146" class="m" font-size="12" letter-spacing="2" fill="${C.gold}">0${i + 1} · ${esc(p.cat.toUpperCase())}</text>
<text x="29" y="186" class="s" font-size="34" font-weight="700" letter-spacing="-.7" fill="${C.text}">${esc(p.name)}</text>
${p.line.map((l, j) => `<text x="30" y="${222 + j * 24}" class="s" font-size="17" fill="${C.muted}">${esc(l)}</text>`).join("")}
${chipRow(30, 274, p.stack, { size: 12, h: 28 })}
${arrow(338, 282)}`, {
    defs: `<radialGradient id="g" cx="1" cy="1" r=".95"><stop offset="0" stop-color="${p.accent}" stop-opacity=".24"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0"/></radialGradient>`,
    overlay: `<rect width="384" height="324" fill="url(#g)"/>`,
  });
});

// Row 3 — stack (800×280) + principle (400×280)
tile("stack", 800, 280, `Stack — ${stack.map(([k, l]) => `${k.toLowerCase()}: ${l.join(", ")}`).join("; ")}`, `
<text x="34" y="50" class="m" font-size="13" letter-spacing="3" fill="${C.gold}">STACK</text>
<text x="750" y="50" text-anchor="end" class="m" font-size="12" letter-spacing="2" fill="${C.faint}">DESKTOP · WEB · BACKEND · SYSTEM</text>
${stack.map(([k, list], i) => { const y = 76 + i * 46; return `<text x="34" y="${y + 21}" class="m" font-size="12" letter-spacing="2" fill="${C.faint}">${k}</text>` + chipRow(150, y, list, { size: 13, h: 32 }); }).join("\n")}`);

tile("principle", 400, 280, "Design is specification, not decoration. Local-first where it matters, read-only by default.", `
<text x="30" y="96" class="r" font-size="84" fill="${C.ink}" opacity=".3">“</text>
<text x="32" y="148" class="s" font-size="29" font-weight="700" letter-spacing="-.6" fill="${C.ink}">Design is specification,</text>
<text x="32" y="184" class="s" font-size="29" font-weight="700" letter-spacing="-.6" fill="${C.ink}">not decoration.</text>
<text x="32" y="236" class="m" font-size="11.5" letter-spacing="2" fill="${C.ink}" opacity=".7">LOCAL-FIRST · READ-ONLY BY DEFAULT</text>`, {
  fill: C.gold, stroke: C.gold,
  overlay: `<svg x="210" y="150" width="240" height="170" viewBox="160 390 560 390" opacity=".12">${wavesG(C.ink)}</svg>`,
});

// Row 5 — contact (400×130 each)
const contacts = [
  ["web", "WEBSITE", "regnsoftware.com", "https://www.regnsoftware.com",
    `<circle cx="22" cy="22" r="13" fill="none" stroke="${C.gold}" stroke-width="2"/><ellipse cx="22" cy="22" rx="5.5" ry="13" fill="none" stroke="${C.gold}" stroke-width="2"/><path d="M9 22h26M11 15h22M11 29h22" stroke="${C.gold}" stroke-width="1.6"/>`],
  ["github", "GITHUB", "Regncreative", "https://github.com/Regncreative",
    `<g transform="translate(10,10)"><path fill="${C.gold}" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></g>`],
  ["linkedin", "LINKEDIN", "ozsinan", "https://www.linkedin.com/in/ozsinan",
    `<rect x="9" y="9" width="26" height="26" rx="6" fill="${C.gold}"/><text x="22" y="29" text-anchor="middle" class="s" font-size="16" font-weight="700" fill="${C.ink}">in</text>`],
];
for (const [k, label, value, , glyph] of contacts) {
  tile(`contact-${k}`, 400, 130, `${label}: ${value}`, `
<rect x="28" y="35" width="44" height="44" rx="12" fill="${C.chip}" stroke="${C.chipLine}"/>
<g transform="translate(28,35)">${glyph}</g>
<text x="90" y="52" class="m" font-size="11.5" letter-spacing="2" fill="${C.faint}">${label}</text>
<text x="90" y="78" class="s" font-size="20" font-weight="600" fill="${C.text}">${esc(value)}</text>
${arrow(342, 51, C.gold)}`);
}

// ── README ───────────────────────────────────────────────────────────────────
const img = (name, alt, width) => `<img src="./assets/${name}.svg" width="${width}" alt="${esc(alt)}">`;
const link = (href, inner) => `<a href="${href}">${inner}</a>`;
const third = "33.33%", twoThirds = "66.66%";
const statColors = `bg_color=101318&border_color=23272E&title_color=C5A572&text_color=8B949E&icon_color=C5A572&ring_color=C5A572`;

const readme = `<!-- Generated by scripts/build-readme.mjs — edit the generator, not this file. -->
${img("hero", "Regn Software — Software, products & visual systems. Independent studio building Windows applications, web products and the visual systems around them.", twoThirds)}${img("profile", "Sinan Öz — founder, design & engineering. Focus: desktop software, web products, UI/UX. Origin: graphic design. Based in Turkey.", third)}
${products.map((p) => link(`https://github.com/${p.repo}`, img(`product-${p.k}`, p.alt, third))).join("")}
${img("stack", `Stack — ${stack.map(([k, l]) => `${k.toLowerCase()}: ${l.join(", ")}`).join("; ")}`, twoThirds)}${img("principle", "Design is specification, not decoration. Local-first where it matters, read-only by default.", third)}
<p align="center"><img src="https://github-readme-stats.shion.dev/api?username=Regncreative&show_icons=true&card_width=495&border_radius=24&${statColors}" width="48.3%" alt="GitHub statistics for Regncreative">&nbsp;&nbsp;<img src="https://streak-stats.demolab.com/?user=Regncreative&background=101318&border=23272E&border_radius=24&stroke=8A7048&ring=C5A572&fire=C5A572&currStreakNum=F0F3F6&sideNums=F0F3F6&currStreakLabel=C5A572&sideLabels=8B949E&dates=6E7681" width="48.3%" alt="Contribution streak"></p>
${contacts.map(([k, label, value, href]) => link(href, img(`contact-${k}`, `${label}: ${value}`, third))).join("")}

<p align="center"><sub>
${products.map((p) => `<a href="${p.site}">${p.site.replace(/^https:\/\//, "")}</a>`).join(" &nbsp;·&nbsp; ")} &nbsp;·&nbsp; <img src="https://komarev.com/ghpvc/?username=Regncreative&style=flat-square&label=views&color=8A7048" alt="Profile views" align="center">
</sub></p>
`;
writeFileSync(join(ROOT, "README.md"), readme);
console.log("bento README + tiles written");
