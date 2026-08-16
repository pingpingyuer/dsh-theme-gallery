// dsh-theme-gallery — host side (dynamic groups):
// 1) /gallery/<rel>?g=<group> serve local gallery images (support ?s= thumb)
// 2) /gallery/list?g=<group> group image metadata
// 3) /gallery/meta?g=<group>&p=<rel> single image palette
// 4) /gallery/groups list all groups (builtin g1/g2 + custom)
// 5) /gallery/dirscan?path=<abs> validate dir and count images
// 6) /gallery/group-add POST {name, dirs:[...]} create custom group + analyze
// 7) /gallery/group-status?id=<group> query analyze progress
// 8) /gallery/group-rename POST {id, name} rename custom group
// 9) /gallery/group-delete POST {id} delete custom group
// 10) /gallery/group-update POST {id} rescan group dirs and re-analyze
import { readFile, stat } from "node:fs/promises";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";

const require = createRequire(import.meta.url);

const IMG_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

/** Analyze script + group definition persistence file */
const PKG_DIR = dirname(fileURLToPath(import.meta.url)); // .../dsh-theme-gallery/lib
const DATA_DIR = process.env.DSH_THEME_DATA_DIR ?? join(PKG_DIR, "..", "data");
try { mkdirSync(DATA_DIR, { recursive: true }); } catch {}
const ANALYZE_SCRIPT = process.env.DSH_THEME_ANALYZE_SCRIPT
  ?? join(PKG_DIR, "..", "tools", "analyze-all.mjs");
const GROUPS_STORE = process.env.DSH_THEME_GROUPS_STORE
  ?? join(DATA_DIR, "custom-groups.json");
const META_DIR = process.env.DSH_THEME_META_DIR
  ?? DATA_DIR;

/** Builtin groups (not deletable) */
/** 内置分组目录由环境变量配置(分号分隔); 未配置时分组存在但无图片 */
const G1_DIRS = (process.env.DSH_THEME_G1_DIRS ?? "").split(";").map((s) => s.trim()).filter(Boolean);
const G2_DIRS = (process.env.DSH_THEME_G2_DIRS ?? "").split(";").map((s) => s.trim()).filter(Boolean);
const BUILTIN = {
  g1: {
    name: "插画合集",
    dirs: G1_DIRS.map((d) => resolve(d)),
    metaPath: join(META_DIR, "theme-all.json"),
    builtin: true
  },
  g2: {
    name: "画集 B",
    dirs: G2_DIRS.map((d) => resolve(d)),
    metaPath: join(META_DIR, "theme-all-g2.json"),
    builtin: true
  }
};

/** Custom groups: id -> { name, dirs, metaPath, status, total } */
const CUSTOM = new Map();
/** Builtin group rename overrides: id -> new name (persisted in store meta) */
const RENAMED = new Map();
let customSeq = 0;

/** Load custom groups from persistence file */
function loadCustomGroups() {
  try {
    const raw = readFileSync(GROUPS_STORE, "utf8");
    const list = JSON.parse(raw);
    for (const g of list) {
      CUSTOM.set(g.id, {
        name: g.name,
        dirs: (g.dirs ?? []).map((d) => resolve(d)),
        metaPath: g.metaPath,
        status: "ready",
        total: g.total ?? 0
      });
      const n = Number(g.id.replace(/\D/g, ""));
      if (Number.isFinite(n) && n > customSeq) customSeq = n;
    }
    // 内置分组改名映射（持久化 meta 区）
    if (Array.isArray(list.renamed)) {
      for (const r of list.renamed) RENAMED.set(r.id, r.name);
    }
  } catch {
    // no custom groups yet
  }
}
loadCustomGroups();

/** Full group table (builtin + custom), applying builtin rename overrides */
function getGroups() {
  const out = {};
  for (const [id, g] of Object.entries(BUILTIN)) {
    out[id] = { ...g, name: RENAMED.get(id) ?? g.name };
  }
  for (const [id, g] of CUSTOM) out[id] = g;
  return out;
}

/** Stable plugin name */
const name = "dsh-theme-gallery";

/** Required service */
const inject = ["webServer"];

const MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".bmp": "image/bmp"
};

const THUMB_MAX = 480;

/** Per-group lazy metadata cache */
const metaCaches = new Map();
async function loadMeta(groupId) {
  const groups = getGroups();
  const group = groups[groupId];
  if (group === void 0) return [];
  if (metaCaches.has(groupId)) return metaCaches.get(groupId);
  try {
    const raw = await readFile(group.metaPath, "utf8");
    metaCaches.set(groupId, JSON.parse(raw));
  } catch {
    metaCaches.set(groupId, []);
  }
  return metaCaches.get(groupId);
}

/** Path traversal guard + file must exist under some dir of the group */
async function safePath(groupId, filename) {
  const groups = getGroups();
  const group = groups[groupId];
  if (group === void 0) return void 0;
  const rel = normalize(filename);
  if (rel === "" || rel.startsWith(sep) || rel.includes("..")) return void 0;
  for (const dir of group.dirs) {
    const target = resolve(normalize(join(dir, rel)));
    if (target !== dir && !target.startsWith(dir + sep)) continue;
    try {
      const info = await stat(target);
      if (info.isFile()) return target;
    } catch {
      // try next dir
    }
  }
  return void 0;
}

/** Load sharp if available */
function loadSharp() {
  for (const id of ["sharp", join(process.cwd(), "node_modules/sharp")]) {
    try { return require(id); } catch {}
  }
  return void 0;
}

/** Resolve group id; fallback to g1 when unknown */
function resolveGroup(raw) {
  return getGroups()[raw] !== void 0 ? raw : "g1";
}

/** Count images recursively under a dir */
function countImages(dir) {
  let n = 0;
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) n += countImages(full);
      else if (entry.isFile() && IMG_EXTS.has(extname(entry.name).toLowerCase())) n++;
    }
  } catch {
    // unreadable dir -> ignore
  }
  return n;
}

/** Persist custom group definitions */
function persistCustom() {
  try {
    const list = [...CUSTOM.entries()].map(([id, g]) => ({
      id,
      name: g.name,
      dirs: g.dirs,
      metaPath: g.metaPath,
      total: g.total
    }));
    // 内置分组改名映射存到 meta 区
    if (RENAMED.size > 0) {
      list.renamed = [...RENAMED.entries()].map(([id, gname]) => ({ id, name: gname }));
    }
    writeFileSync(GROUPS_STORE, JSON.stringify(list, null, 2), "utf8");
  } catch {
    // persistence failure does not stop runtime
  }
}

/** Read image count from a metadata file */
function countImagesFromMeta(metaPath) {
  try {
    const raw = readFileSync(metaPath, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

/** 正在分析的分组 id 集合（内置 + 自定义通用状态） */
const ANALYZING = new Set();

/** Start background analysis: node analyze-all.mjs <metaPath> <dirs;sep> */
function startAnalysis(groupId, metaPath, dirs, onDone) {
  ANALYZING.add(groupId);
  const g = CUSTOM.get(groupId);
  if (g !== void 0) g.status = "analyzing";
  const child = spawn(process.execPath, [ANALYZE_SCRIPT, metaPath, dirs.join(";")], {
    stdio: "ignore",
    windowsHide: true
  });
  child.on("error", () => {
    ANALYZING.delete(groupId);
    if (g !== void 0) g.status = "failed";
    onDone?.("failed");
  });
  child.on("exit", (code) => {
    ANALYZING.delete(groupId);
    if (code === 0 && existsSync(metaPath)) {
      if (g !== void 0) {
        g.status = "ready";
        g.total = countImagesFromMeta(metaPath);
      }
      persistCustom();
      metaCaches.delete(groupId);
      onDone?.("ready");
    } else {
      if (g !== void 0) g.status = "failed";
      onDone?.("failed");
    }
  });
}

/** Read request body (for POST) */
function readBody(req) {
  return new Promise((resolveBody, rejectBody) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        resolveBody({});
      }
    });
    req.on("error", rejectBody);
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-cache" });
  res.end(JSON.stringify(obj));
}

/**
* Register /gallery prefix route.
*/
function apply(ctx) {
  ctx.effect(() => ctx.webServer.register({
    kind: "prefix",
    path: "/gallery",
    handler: async (req, res) => {
      const url = new URL(req.url ?? "/", "http://x");
      const rawPath = url.pathname;
      const filename = decodeURIComponent(rawPath.slice("/gallery/".length));

      // ---- group management API ----

      if (filename === "groups") {
        if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); res.end(); return; }
        const groups = getGroups();
        const out = Object.entries(groups).map(([id, g]) => {
          let total = g.total ?? 0;
          if (existsSync(g.metaPath)) total = countImagesFromMeta(g.metaPath);
          let status = g.status ?? "ready";
          if (ANALYZING.has(id)) status = "analyzing";
          return {
            id,
            name: g.name,
            dirs: g.dirs,
            builtin: g.builtin === true,
            status,
            total
          };
        });
        sendJson(res, 200, out);
        return;
      }

      if (filename === "dirscan") {
        if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); res.end(); return; }
        const p = resolve(decodeURIComponent(url.searchParams.get("path") ?? ""));
        if (!existsSync(p) || !statSync(p).isDirectory()) {
          sendJson(res, 404, { error: "目录不存在或不是文件夹" });
          return;
        }
        sendJson(res, 200, { path: p, images: countImages(p) });
        return;
      }

      if (filename === "group-add") {
        if (req.method !== "POST") { res.writeHead(405); res.end(); return; }
        const body = await readBody(req);
        const gname = String(body.name ?? "").trim();
        const dirs = Array.isArray(body.dirs)
          ? body.dirs.map((d) => resolve(String(d))).filter((d) => existsSync(d) && statSync(d).isDirectory())
          : [];
        if (gname === "" || dirs.length === 0) {
          sendJson(res, 400, { error: "需要分组名和至少一个有效文件夹" });
          return;
        }
        customSeq += 1;
        const gid = "c" + customSeq;
        const metaPath = join(META_DIR, "theme-" + gid + ".json");
        CUSTOM.set(gid, {
          name: gname,
          dirs,
          metaPath,
          status: "analyzing",
          total: dirs.reduce((s, d) => s + countImages(d), 0)
        });
        persistCustom();
        startAnalysis(gid, metaPath, dirs);
        sendJson(res, 200, { id: gid, name: gname, status: "analyzing", total: CUSTOM.get(gid).total });
        return;
      }

      if (filename === "group-status") {
        if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); res.end(); return; }
        const gid = url.searchParams.get("id") ?? "";
        const g = getGroups()[gid];
        if (g === void 0) { sendJson(res, 404, { error: "分组不存在" }); return; }
        let total = g.total ?? 0;
        if (existsSync(g.metaPath)) total = countImagesFromMeta(g.metaPath);
        let status = g.status ?? "ready";
        if (ANALYZING.has(gid)) status = "analyzing";
        sendJson(res, 200, {
          id: gid,
          name: g.name,
          status,
          total
        });
        return;
      }

      if (filename === "group-rename") {
        if (req.method !== "POST") { res.writeHead(405); res.end(); return; }
        const body = await readBody(req);
        const gid = String(body.id ?? "");
        const gname = String(body.name ?? "").trim();
        if (gname === "") { sendJson(res, 400, { error: "分组名不能为空" }); return; }
        const groups = getGroups();
        const g = groups[gid];
        if (g === void 0) { sendJson(res, 404, { error: "分组不存在" }); return; }
        if (g.builtin === true) {
          // 内置分组：写入改名映射
          RENAMED.set(gid, gname);
        } else {
          const cg = CUSTOM.get(gid);
          if (cg !== void 0) cg.name = gname;
        }
        persistCustom();
        sendJson(res, 200, { id: gid, name: gname });
        return;
      }

      if (filename === "group-delete") {
        if (req.method !== "POST") { res.writeHead(405); res.end(); return; }
        const body = await readBody(req);
        const gid = String(body.id ?? "");
        const g = CUSTOM.get(gid);
        if (g === void 0) { sendJson(res, 404, { error: "自定义分组不存在" }); return; }
        CUSTOM.delete(gid);
        metaCaches.delete(gid);
        try { rmSync(g.metaPath, { force: true }); } catch {}
        persistCustom();
        sendJson(res, 200, { id: gid, deleted: true });
        return;
      }

      if (filename === "group-update") {
        if (req.method !== "POST") { res.writeHead(405); res.end(); return; }
        const body = await readBody(req);
        const gid = String(body.id ?? "");
        const g = getGroups()[gid];
        if (g === void 0) { sendJson(res, 404, { error: "分组不存在" }); return; }
        if (ANALYZING.has(gid)) { sendJson(res, 409, { error: "分组正在分析中" }); return; }
        startAnalysis(gid, g.metaPath, g.dirs);
        sendJson(res, 200, { id: gid, status: "analyzing", total: g.total ?? 0 });
        return;
      }

      // ---- image & metadata routes ----

      if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405);
        res.end();
        return;
      }
      const groupId = resolveGroup(url.searchParams.get("g"));

      if (filename === "list") {
        const meta = await loadMeta(groupId);
        const slim = meta.map((m) => ({
          p: m.rel,
          w: m.w,
          h: m.h,
          d: m.dominant,
          l: m.luminance
        }));
        sendJson(res, 200, slim);
        return;
      }

      if (filename === "meta") {
        const rel = url.searchParams.get("p") ?? "";
        const meta = await loadMeta(groupId);
        const hit = meta.find((m) => m.rel === rel);
        if (hit === void 0) { res.writeHead(404); res.end(); return; }
        sendJson(res, 200, hit);
        return;
      }

      // static image
      const target = await safePath(groupId, filename);
      if (target === void 0) {
        res.writeHead(404);
        res.end();
        return;
      }
      const ext = extname(filename).toLowerCase();
      const size = Number(url.searchParams.get("s"));
      if (Number.isFinite(size) && size > 0 && size <= THUMB_MAX) {
        const sharp = loadSharp();
        if (sharp !== void 0) {
          try {
            const out = await sharp(target, { failOn: "none" })
              .resize(size, size, { fit: "inside", withoutEnlargement: true })
              .webp({ quality: 72 })
              .toBuffer();
            res.writeHead(200, { "content-type": "image/webp", "cache-control": "no-cache" });
            res.end(out);
            return;
          } catch {
            // fall back to original
          }
        }
      }
      try {
        const body = await readFile(target);
        res.writeHead(200, {
          "content-type": MIME[ext] ?? "application/octet-stream",
          "cache-control": "no-cache"
        });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end();
      }
    }
  }), "dsh-theme-gallery: /gallery static route");
  // 强制 index.html 不缓存：避免浏览器用启发式缓存加载旧页面（乱码/旧资源）
  try {
    ctx.effect(() => ctx.webServer.tapIndex((html) => {
      const meta = '<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">';
      return html.includes('http-equiv="Cache-Control"') ? html : html.replace(/<head>/, '<head>' + meta);
    }), "dsh-theme-gallery: no-cache index meta");
  } catch {
    // tapIndex 不可用则忽略
  }
}

export { BUILTIN, apply, getGroups, inject, name, safePath };
