// analyze-all.mjs — 全量扫描图库目录，提取所有清晰图片的主色调
// 输出 theme-all.json：完整图片清单（相对路径 + 尺寸 + 主色 + 调色板），
// 供 host 端 /gallery/list 接口使用，客户端动态生成皮肤。
// 用法: node analyze-all.mjs [输出json] [目录1;目录2;...]
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let sharp;
try { sharp = require('sharp'); } catch { try { sharp = require(join(process.cwd(), 'node_modules/sharp')); } catch (e) { console.error('需要安装 sharp: npm i sharp'); process.exit(1); } }

const out = process.argv[2] ?? 'theme-all.json';
// 目录列表：用 ; 分隔传入（第二个参数之后），默认分组1
const dirArg = process.argv[3] ?? '';
const GALLERY_ROOTS = dirArg.split(';').filter(Boolean).map((d) => d.trim());
if (GALLERY_ROOTS.length === 0) { console.error('用法: node analyze-all.mjs <输出json> <目录1;目录2;...>'); process.exit(1); }
const EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function collect(dir, acc) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) collect(full, acc);
    else if (entry.isFile() && EXTS.has(extname(entry.name).toLowerCase())) acc.push(full);
  }
  return acc;
}
const files = [];
for (const d of GALLERY_ROOTS) collect(d, files);
console.log(`found ${files.length} images`);

// 相对路径（用于 /gallery/<rel> 访问）
function toRel(file) {
  const full = file.replace(/\\/g, '/');
  for (const root of GALLERY_ROOTS) {
    const r = root.replace(/\\/g, '/');
    if (full.startsWith(r + '/')) return full.slice(r.length + 1);
  }
  return full.split('/').pop();
}

async function metadata(file) {
  try {
    const m = await sharp(file, { failOn: 'none' }).metadata();
    return { file, w: m.width ?? 0, h: m.height ?? 0 };
  } catch {
    return { file, w: 0, h: 0 };
  }
}

const CONC = 16;
const metas = [];
for (let i = 0; i < files.length; i += CONC) {
  const batch = await Promise.all(files.slice(i, i + CONC).map(metadata));
  metas.push(...batch);
  if ((i + CONC) % 400 < CONC) console.log(`  metadata ${Math.min(i + CONC, files.length)}/${files.length}`);
}

// 清晰度门槛：>=800x500 或 >=400k 像素（背景图可用）
const good = metas
  .filter((m) => (m.w >= 800 && m.h >= 500) || (m.w * m.h >= 400000))
  .sort((a, b) => b.w * b.h - a.w * a.h);
console.log(`clear images: ${good.length} (of ${metas.length})`);

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}
function kmeans(pixels, k, iters = 5) {
  const n = pixels.length;
  if (n === 0) return [];
  let centers = [];
  for (let i = 0; i < k; i++) centers.push({ r: pixels[Math.floor((i * n) / k)].r, g: pixels[Math.floor((i * n) / k)].g, b: pixels[Math.floor((i * n) / k)].b });
  for (let iter = 0; iter < iters; iter++) {
    const sums = Array.from({ length: k }, () => ({ r: 0, g: 0, b: 0, n: 0 }));
    for (const p of pixels) {
      let best = 0, bd = Infinity;
      for (let c = 0; c < k; c++) {
        const d = (p.r - centers[c].r) ** 2 + (p.g - centers[c].g) ** 2 + (p.b - centers[c].b) ** 2;
        if (d < bd) { bd = d; best = c; }
      }
      sums[best].r += p.r; sums[best].g += p.g; sums[best].b += p.b; sums[best].n++;
    }
    centers = sums.map((s) => s.n === 0 ? { r: 0, g: 0, b: 0 } : { r: s.r / s.n, g: s.g / s.n, b: s.b / s.n });
  }
  return centers;
}
function clusterRatios(pixels, centers) {
  const counts = centers.map(() => 0);
  for (const p of pixels) {
    let best = 0, bd = Infinity;
    for (let c = 0; c < centers.length; c++) {
      const d = (p.r - centers[c].r) ** 2 + (p.g - centers[c].g) ** 2 + (p.b - centers[c].b) ** 2;
      if (d < bd) { bd = d; best = c; }
    }
    counts[best]++;
  }
  return counts.map((c, i) => ({ color: centers[i], ratio: c / pixels.length }));
}
async function extractPalette(file) {
  const { data, info } = await sharp(file, { failOn: 'none' })
    .resize(40, 40, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const px = [];
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 3] < 200) continue;
    px.push({ r: data[i], g: data[i + 1], b: data[i + 2] });
  }
  if (px.length === 0) return [];
  const centers = kmeans(px, 5);
  const ratios = clusterRatios(px, centers);
  return ratios
    .filter((r) => r.ratio > 0.03)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 6)
    .map((r) => ({ hex: rgbToHex(r.color.r, r.color.g, r.color.b), ratio: Math.round(r.ratio * 1000) / 10 }));
}
function luminance(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
}

const results = [];
for (let i = 0; i < good.length; i++) {
  const s = good[i];
  try {
    const palette = await extractPalette(s.file);
    if (palette.length === 0) continue;
    results.push({
      rel: toRel(s.file),
      w: s.w,
      h: s.h,
      sizeKB: Math.round(statSync(s.file).size / 1024),
      dominant: palette[0].hex,
      luminance: luminance(palette[0].hex),
      palette,
    });
  } catch {
    // 跳过损坏图
  }
  if ((i + 1) % 100 === 0) console.log(`  extracted ${i + 1}/${good.length}`);
}
console.log(`extracted palettes for ${results.length} images`);

writeFileSync(out, JSON.stringify(results, null, 1), 'utf8');
console.log(`wrote ${results.length} images -> ${out}`);
