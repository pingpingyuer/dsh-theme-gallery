window.__ModuleLoader__.load({
	id: "dsh-theme-gallery",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		// ── 颜色工具 ──
		function hexToRgb(hex) {
			const h = hex.replace("#", "");
			return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
		}
		function rgbToHex({ r, g, b }) {
			const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
			return "#" + c(r) + c(g) + c(b);
		}
		function mix(a, b, t) {
			const A = hexToRgb(a), B = hexToRgb(b);
			return rgbToHex({ r: A.r + (B.r - A.r) * t, g: A.g + (B.g - A.g) * t, b: A.b + (B.b - A.b) * t });
		}
		function shade(hex, f) { return mix(hex, "#000000", f); }
		function tint(hex, f) { return mix(hex, "#ffffff", f); }
		function lum(hex) {
			const { r, g, b } = hexToRgb(hex);
			return 0.2126 * r + 0.7152 * g + 0.0722 * b;
		}
		function sat(hex) {
			const { r, g, b } = hexToRgb(hex);
			const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
			return mx === 0 ? 0 : (mx - mn) / mx;
		}
		function rgba(hex, a) {
			const { r, g, b } = hexToRgb(hex);
			return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
		}
		function panel(hex, a) {
			const { r, g, b } = hexToRgb(hex);
			return "rgba(" + r + ", " + g + ", " + b + ", calc(var(--dsh-gallery-panel, 1) * " + a + "))";
		}
		function pickPrimary(palette) {
			const candidates = palette.filter((p) => sat(p.hex) > 0.18 && lum(p.hex) > 30 && lum(p.hex) < 235);
			if (candidates.length) {
				candidates.sort((a, b) => (b.ratio * (0.4 + sat(b.hex))) - (a.ratio * (0.4 + sat(a.hex))));
				return candidates[0].hex;
			}
			return palette[0].hex;
		}
		function buildTokens(palette, scheme) {
			const primary = pickPrimary(palette);
			const sorted = [...palette].sort((a, b) => lum(b.hex) - lum(a.hex));
			const lightest = sorted[0].hex;
			const deepest = sorted[sorted.length - 1].hex;
			if (scheme === "dark") {
				const bg = mix(shade(deepest, 0.45), primary, 0.18);
				return {
					"--dsw-alias-bg-base": panel(bg, 0.4),
					"--dsw-alias-bg-layer-1": panel(mix(bg, primary, 0.07), 0.44),
					"--dsw-alias-bg-layer-2": panel(mix(bg, primary, 0.13), 0.5),
					"--dsw-alias-bg-layer-3": panel(mix(bg, primary, 0.22), 0.58),
					"--dsw-alias-bg-module-platform": panel(mix(bg, primary, 0.26), 0.64),
					"--dsw-alias-bg-multi-select": panel(mix(bg, primary, 0.3), 0.68),
					"--dsw-alias-bg-overlay": panel(mix(bg, primary, 0.32), 0.7),
					"--dsw-specific-sidebar-fill": panel(mix(bg, primary, 0.1), 0.34),
					"--dsw-specific-menu": panel(mix(bg, primary, 0.22), 0.6),
					"--dsw-specific-selector": panel(mix(bg, primary, 0.2), 0.56),
					"--dsw-specific-tip": panel(mix(bg, primary, 0.16), 0.5),
					"--dsw-specific-input-major": rgba(mix(bg, primary, 0.12), 0.38),
					"--dsw-specific-login-input": rgba(mix(bg, primary, 0.1), 0.36),
					"--dsw-alias-label-primary": tint(lightest, 0.35),
					"--dsw-alias-label-primary-bluish": tint(lightest, 0.3),
					"--dsw-alias-label-secondary": mix(tint(lightest, 0.35), primary, 0.22),
					"--dsw-alias-label-tertiary": mix(tint(lightest, 0.35), primary, 0.42),
					"--dsw-alias-label-caption": mix(tint(lightest, 0.35), primary, 0.55),
					"--dsw-alias-label-dimmed": mix(tint(lightest, 0.35), primary, 0.62),
					"--dsw-alias-label-primary-inverted": bg,
					"--dsw-alias-brand-primary": primary,
					"--dsw-alias-brand-text": tint(primary, 0.25),
					"--dsw-alias-button-primary-fill": primary,
					"--dsw-alias-button-primary-hover": tint(primary, 0.18),
					"--dsw-alias-button-info-fill": primary,
					"--dsw-alias-button-info-hover": tint(primary, 0.22),
					"--dsw-alias-button-ghost-active-fill": rgba(mix(bg, primary, 0.3), 0.85),
					"--dsw-alias-button-ghost-active-hover": rgba(mix(bg, primary, 0.38), 0.9),
					"--dsw-alias-button-ghost-active-border": tint(primary, 0.35),
					"--dsw-alias-interactive-bg-hover": "rgba(255, 255, 255, 0.07)",
					"--dsw-alias-interactive-bg-active": "rgba(255, 255, 255, 0.12)",
					"--dsw-alias-interactive-bg-hover-accent": rgba(primary, 0.22),
					"--dsw-alias-interactive-bg-hover-solid": rgba(mix(bg, primary, 0.3), 0.8),
					"--dsw-alias-border-l1": "rgba(255, 255, 255, 0.06)",
					"--dsw-alias-border-l2": "rgba(255, 255, 255, 0.12)",
					"--dsw-alias-border-l3": "rgba(255, 255, 255, 0.18)",
					"--dsw-alias-border-l4": "rgba(255, 255, 255, 0.24)",
					"--dsw-specific-bubble": panel(mix(bg, primary, 0.22), 0.6),
					"--dsw-specific-bubble-highlight": panel(mix(bg, primary, 0.34), 0.7),
					"--dsw-specific-sidebar-nav-item-active": rgba(mix(bg, primary, 0.3), 0.78),
					"--dsw-specific-sidebar-nav-item-active-accent": primary,
					"--dsw-specific-sidebar-nav-item-hover": rgba(mix(bg, primary, 0.16), 0.6),
					"--dsw-alias-markdown-code-block": panel(mix(bg, primary, 0.14), 0.55),
					"--dsw-alias-markdown-code-block-banner": panel(mix(bg, primary, 0.18), 0.6),
					"--dsw-alias-markdown-inline-code": panel(mix(bg, primary, 0.26), 0.66),
					"--dsw-alias-markdown-tag": panel(mix(bg, primary, 0.2), 0.6),
					"--dsw-alias-markdown-citation": panel(mix(bg, primary, 0.16), 0.55),
					"--dsw-alias-state-business-primary": primary,
					"--dsw-alias-state-business-tertiary": panel(mix(bg, primary, 0.35), 0.7),
					"--dsw-alias-scrollbar-bg-l1": panel(mix(bg, primary, 0.12), 0.5),
					"--dsw-alias-scrollbar-bg-l2": panel(mix(bg, primary, 0.16), 0.55),
					"--dsw-alias-scrollbar-hover-l1": panel(mix(bg, primary, 0.24), 0.65),
					"--dsw-alias-scrollbar-hover-l2": panel(mix(bg, primary, 0.3), 0.7),
					"--dsw-alias-toast-bg": rgba(mix(bg, primary, 0.4), 0.92),
					"--dsw-alias-tooltip-bg": rgba(mix(bg, primary, 0.45), 0.94),
				};
			}
			const bg = mix(primary, "#ffffff", 0.72);
			const labelMain = mix(shade(primary, 0.55), "#1a1a1a", 0.35);
			return {
				"--dsw-alias-bg-base": panel(bg, 0.42),
				"--dsw-alias-bg-layer-1": panel(bg, 0.46),
				"--dsw-alias-bg-layer-2": panel(mix(bg, primary, 0.06), 0.52),
				"--dsw-alias-bg-layer-3": panel(mix(bg, primary, 0.11), 0.6),
				"--dsw-alias-bg-module-platform": panel(mix(bg, primary, 0.14), 0.66),
				"--dsw-alias-bg-multi-select": panel(mix(bg, primary, 0.16), 0.7),
				"--dsw-alias-bg-overlay": panel(mix(bg, primary, 0.1), 0.72),
				"--dsw-specific-sidebar-fill": panel(mix(bg, primary, 0.05), 0.36),
				"--dsw-specific-menu": panel(mix(bg, primary, 0.11), 0.62),
				"--dsw-specific-selector": panel(mix(bg, primary, 0.1), 0.58),
				"--dsw-specific-tip": panel(mix(bg, primary, 0.07), 0.52),
				"--dsw-specific-input-major": rgba(bg, 0.38),
				"--dsw-specific-login-input": rgba(mix(bg, primary, 0.04), 0.36),
				"--dsw-alias-label-primary": labelMain,
				"--dsw-alias-label-primary-bluish": mix(labelMain, primary, 0.08),
				"--dsw-alias-label-secondary": mix(labelMain, primary, 0.28),
				"--dsw-alias-label-tertiary": mix(labelMain, primary, 0.48),
				"--dsw-alias-label-caption": mix(labelMain, primary, 0.58),
				"--dsw-alias-label-dimmed": mix(labelMain, primary, 0.65),
				"--dsw-alias-label-primary-inverted": "#ffffff",
				"--dsw-alias-brand-primary": shade(primary, 0.08),
				"--dsw-alias-brand-text": shade(primary, 0.15),
				"--dsw-alias-button-primary-fill": shade(primary, 0.08),
				"--dsw-alias-button-primary-hover": primary,
				"--dsw-alias-button-info-fill": shade(primary, 0.08),
				"--dsw-alias-button-info-hover": primary,
				"--dsw-alias-button-ghost-active-fill": rgba(mix(bg, primary, 0.14), 0.85),
				"--dsw-alias-button-ghost-active-hover": rgba(mix(bg, primary, 0.2), 0.9),
				"--dsw-alias-button-ghost-active-border": mix(primary, "#000000", 0.15),
				"--dsw-alias-interactive-bg-hover": "rgba(0, 0, 0, 0.05)",
				"--dsw-alias-interactive-bg-active": "rgba(0, 0, 0, 0.09)",
				"--dsw-alias-interactive-bg-hover-accent": rgba(primary, 0.2),
				"--dsw-alias-interactive-bg-hover-solid": rgba(mix(bg, primary, 0.12), 0.82),
				"--dsw-alias-border-l1": "rgba(0, 0, 0, 0.05)",
				"--dsw-alias-border-l2": "rgba(0, 0, 0, 0.1)",
				"--dsw-alias-border-l3": "rgba(0, 0, 0, 0.14)",
				"--dsw-alias-border-l4": "rgba(0, 0, 0, 0.18)",
				"--dsw-specific-bubble": panel(mix(bg, primary, 0.12), 0.62),
				"--dsw-specific-bubble-highlight": panel(mix(bg, primary, 0.18), 0.72),
				"--dsw-specific-sidebar-nav-item-active": rgba(mix(bg, primary, 0.16), 0.78),
				"--dsw-specific-sidebar-nav-item-active-accent": shade(primary, 0.08),
				"--dsw-specific-sidebar-nav-item-hover": rgba(mix(bg, primary, 0.08), 0.6),
				"--dsw-alias-markdown-code-block": panel(mix(bg, primary, 0.07), 0.58),
				"--dsw-alias-markdown-code-block-banner": panel(mix(bg, primary, 0.1), 0.62),
				"--dsw-alias-markdown-inline-code": panel(mix(bg, primary, 0.14), 0.68),
				"--dsw-alias-markdown-tag": panel(mix(bg, primary, 0.11), 0.62),
				"--dsw-alias-markdown-citation": panel(mix(bg, primary, 0.08), 0.58),
				"--dsw-alias-state-business-primary": shade(primary, 0.08),
				"--dsw-alias-state-business-tertiary": panel(mix(bg, primary, 0.18), 0.72),
				"--dsw-alias-scrollbar-bg-l1": panel(mix(bg, primary, 0.1), 0.52),
				"--dsw-alias-scrollbar-bg-l2": panel(mix(bg, primary, 0.12), 0.56),
				"--dsw-alias-scrollbar-hover-l1": panel(mix(bg, primary, 0.18), 0.66),
				"--dsw-alias-scrollbar-hover-l2": panel(mix(bg, primary, 0.22), 0.7),
				"--dsw-alias-toast-bg": rgba(shade(deepest, 0.25), 0.92),
				"--dsw-alias-tooltip-bg": rgba(shade(deepest, 0.2), 0.94),
			};
		}
		function buildThemeCss(rel, meta, scheme, groupId) {
			const tokens = Object.entries(buildTokens(meta.palette, scheme))
				.map(([k, v]) => "  " + k + ": " + v + ";")
				.join("\n");
			const url = "/gallery/" + encodeURIComponent(rel) + "?g=" + (groupId ?? "g1");
			const scrimRGB = scheme === "dark" ? "10, 8, 14" : "250, 248, 252";
			// 填充方式按图片方向：只有明显横宽（宽/高 >= 1.4，接近电脑屏幕）才算横向；
			// 接近方形或纵向的图都走双层（模糊底 + 90vw 主图），避免全屏裁切。
			const w = Number(meta.w) || 0;
			const h = Number(meta.h) || 0;
			const portrait = !(w > 0 && h > 0 && w / h >= 1.4);
			const btnText = scheme === "dark" ? "#ffffff" : "#2a2320";
			const btnFill = scheme === "dark" ? "rgba(255, 255, 255, 0.14)" : "rgba(255, 255, 255, 0.85)";
			const btnHover = scheme === "dark" ? "rgba(255, 255, 255, 0.22)" : "rgba(255, 255, 255, 0.95)";
			const btnBorder = scheme === "dark" ? "rgba(255, 255, 255, 0.35)" : "rgba(0, 0, 0, 0.18)";
			const inputText = scheme === "dark" ? "#f2f0f5" : "#211d1a";
			const inputPlaceholder = scheme === "dark" ? "rgba(242, 240, 245, 0.5)" : "rgba(33, 29, 26, 0.45)";
			const commonTail = [
				"body[data-dsh-theme-gallery] #root { background: transparent !important; }",
				"body[data-dsh-theme-gallery] [class*=\"newSession\"] {",
				"  background: " + btnFill + " !important;",
				"  color: " + btnText + " !important;",
				"  border: 1px solid " + btnBorder + " !important;",
				"  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);",
				"  backdrop-filter: blur(6px);",
				"  -webkit-backdrop-filter: blur(6px);",
				"}",
				"body[data-dsh-theme-gallery] [class*=\"newSession\"]:hover { background: " + btnHover + " !important; }",
				"body[data-dsh-theme-gallery] [class*=\"iconButton\"] { color: var(--dsw-alias-label-secondary) !important; }",
				"body[data-dsh-theme-gallery] [class*=\"iconButton\"]:hover { background: var(--dsw-alias-interactive-bg-hover) !important; }",
				"body[data-dsh-theme-gallery] [class*=\"card\"]:has(textarea) {",
				"  backdrop-filter: blur(16px) saturate(1.15);",
				"  -webkit-backdrop-filter: blur(16px) saturate(1.15);",
				"}",
				"body[data-dsh-theme-gallery] [class*=\"card\"]:has(textarea) textarea, body[data-dsh-theme-gallery] [class*=\"card\"]:has(textarea) input {",
				"  color: " + inputText + " !important;",
				"  caret-color: " + inputText + " !important;",
				"}",
				"body[data-dsh-theme-gallery] [class*=\"card\"]:has(textarea) textarea::placeholder, body[data-dsh-theme-gallery] [class*=\"card\"]:has(textarea) input::placeholder {",
				"  color: " + inputPlaceholder + " !important;",
				"  opacity: 1;",
				"}",
				"body[data-dsh-theme-gallery] [class*=\"card\"]:has(textarea) button {",
				"  backdrop-filter: blur(10px);",
				"  -webkit-backdrop-filter: blur(10px);",
				"}",
				"body[data-dsh-theme-gallery] [class*=\"card\"] {",
				"  backdrop-filter: blur(12px) saturate(1.1);",
				"  -webkit-backdrop-filter: blur(12px) saturate(1.1);",
				"}",
				"body[data-dsh-theme-gallery] button {",
				"  backdrop-filter: blur(8px);",
				"  -webkit-backdrop-filter: blur(8px);",
				"}",
			];
			if (!portrait) {
				// 横向图：cover 全屏静止
				return [
					"body[data-dsh-theme-gallery] {",
					tokens,
					"  background-image: linear-gradient(rgba(" + scrimRGB + ", var(--dsh-gallery-opacity, 0.32)), rgba(" + scrimRGB + ", var(--dsh-gallery-opacity, 0.32))), url(\"" + url + "\");",
					"  background-size: cover, cover;",
					"  background-position: center, center;",
					"  background-repeat: no-repeat, no-repeat;",
					"  background-attachment: fixed, fixed;",
					"}",
					...commonTail,
				].join("\n");
			}
			// 纵向图：双层（模糊底 + 90vw 主图上下漂移）
			return [
				"body[data-dsh-theme-gallery] {",
				tokens,
				"  background: transparent;",
				"}",
				"/* 模糊背景容器：同一张图 cover 铺满 + 高斯模糊 */",
				"body[data-dsh-theme-gallery]::before {",
				"  content: \"\";",
				"  position: fixed;",
				"  inset: 0;",
				"  z-index: -2;",
				"  background-image: url(\"" + url + "\");",
				"  background-size: cover;",
				"  background-position: center;",
				"  background-repeat: no-repeat;",
				"  filter: blur(24px) brightness(0.85);",
				"  transform: scale(1.15);",
				"}",
				"/* 主图：宽 90vw 居中，高度按比例，上下缓慢漂移 */",
				"body[data-dsh-theme-gallery]::after {",
				"  content: \"\";",
				"  position: fixed;",
				"  inset: 0;",
				"  z-index: -1;",
				"  background-image: url(\"" + url + "\");",
				"  background-size: 90vw auto;",
				"  background-position: center 0%;",
				"  background-repeat: no-repeat;",
				"  animation: dsh-gallery-drift-y 42s ease-in-out infinite alternate;",
				"}",
				"@keyframes dsh-gallery-drift-y {",
				"  from { background-position-y: 0%; }",
				"  to { background-position-y: 100%; }",
				"}",
				...commonTail,
			].join("\n");
		}

		const inject = [];
		const OPACITY_KEY = "dsh-theme-gallery:opacity";
		const INTERVAL_KEY = "dsh-theme-gallery:interval-min";
		const GROUP_KEY = "dsh-theme-gallery:group";
		const ORIENT_KEY = "dsh-theme-gallery:orient";
		const DISABLED_KEY = "dsh-theme-gallery:disabled";
		const COLLAPSED_KEY = "dsh-theme-gallery:collapsed";
		const ORIENTS = [
			{ id: "all", label: "全部方向" },
			{ id: "landscape", label: "横向" },
			{ id: "portrait", label: "纵向" }
		];
		const clamp = (v) => Math.max(0, Math.min(1, v));
		const clampMin = (v) => Math.max(0.1, Math.min(240, v));
		let currentStyle = null;
		let rotateTimer = null;
		let appliedRel = null;
		let currentGroup = null; // g1 | g2
		let currentOrient = null; // all | landscape | portrait
		let galleryCache = new Map(); // groupId -> [{ p, w, h, d, l }]
		let metaCache = new Map(); // groupId -> Map(rel -> { palette, ... })
		let groupsCache = null; // [{ id, name, dirs, builtin, status, total }]

		/** 拉取分组列表（缓存） */
		async function loadGroups() {
			if (groupsCache !== null) return groupsCache;
			groupsCache = await fetchJson("/gallery/groups");
			return groupsCache;
		}
		/** 刷新分组列表（添加分组后调用） */
		async function refreshGroups() {
			groupsCache = await fetchJson("/gallery/groups");
			return groupsCache;
		}
		/** 当前分组（持久化 + 默认 g1；非法回退 g1） */
		function getGroup() {
			if (currentGroup !== null) return currentGroup;
			const saved = localStorage.getItem(GROUP_KEY);
			currentGroup = saved && /^[A-Za-z0-9]+$/.test(saved) ? saved : "g1";
			return currentGroup;
		}
		function setGroup(id) {
			currentGroup = /^[A-Za-z0-9]+$/.test(id) ? id : "g1";
			try { localStorage.setItem(GROUP_KEY, currentGroup); } catch {}
		}
		/** 当前图片方向筛选（持久化 + 默认全部） */
		function getOrient() {
			if (currentOrient !== null) return currentOrient;
			const saved = localStorage.getItem(ORIENT_KEY);
			currentOrient = saved === "landscape" || saved === "portrait" ? saved : "all";
			return currentOrient;
		}
		function setOrient(id) {
			currentOrient = id === "landscape" || id === "portrait" ? id : "all";
			try { localStorage.setItem(ORIENT_KEY, currentOrient); } catch {}
		}
		/** 按方向筛选清单（landscape: w>=h；portrait: h>w） */
		function filterByOrient(list, orient) {
			if (orient === "all") return list;
			return list.filter((m) => {
				const w = Number(m.w) || 0;
				const h = Number(m.h) || 0;
				const landscape = w > 0 && h > 0 && w / h >= 1.4;
				return orient === "portrait" ? !landscape : landscape;
			});
		}
		async function fetchJson(url, options) {
			const res = await fetch(url, options ?? { cache: "no-store" });
			if (!res.ok) throw new Error("gallery fetch failed: " + url + " -> " + res.status);
			return res.json();
		}
		async function loadGallery(groupId) {
			const gid = groupId ?? getGroup();
			if (galleryCache.has(gid)) return galleryCache.get(gid);
			const list = await fetchJson("/gallery/list?g=" + gid);
			galleryCache.set(gid, list);
			return list;
		}
		async function loadMeta(rel, groupId) {
			const gid = groupId ?? getGroup();
			if (!metaCache.has(gid)) metaCache.set(gid, new Map());
			const inner = metaCache.get(gid);
			if (inner.has(rel)) return inner.get(rel);
			const meta = await fetchJson("/gallery/meta?g=" + gid + "&p=" + encodeURIComponent(rel));
			inner.set(rel, meta);
			return meta;
		}
		/** 应用一张图：拉取调色板 → 动态生成皮肤 CSS */
		async function applyTheme(rel, listItem, groupId) {
			try {
				const gid = groupId ?? getGroup();
				const meta = await loadMeta(rel, gid);
				const scheme = meta.luminance < 140 ? "dark" : "light";
				appliedRel = rel;
				// 恢复出厂后 currentStyle 可能已被移除：重新创建
				if (currentStyle === null || !currentStyle.isConnected) {
					const tagId = "dsh-theme-gallery";
					const existing = document.getElementById(tagId);
					if (existing) existing.remove();
					currentStyle = document.createElement("style");
					currentStyle.id = tagId;
					currentStyle.dataset.plugin = "dsh-theme-gallery";
					document.head.append(currentStyle);
				}
				currentStyle.textContent = buildThemeCss(rel, meta, scheme, gid);
				document.body.dataset.dshThemeGallery = "";
				console.info("[dsh-theme-gallery] skin:", rel.slice(0, 60), scheme);
			} catch (error) {
				console.warn("[dsh-theme-gallery] failed to apply:", rel, error);
			}
		}
		async function pickNext() {
			const gid = getGroup();
			const list = filterByOrient(await loadGallery(gid), getOrient());
			if (list.length === 0) return;
			let next;
			do {
				next = list[Math.floor(Math.random() * list.length)];
			} while (list.length > 1 && next.p === appliedRel);
			await applyTheme(next.p, next, gid);
		}
		function applyOpacity(v) {
			document.body.style.setProperty("--dsh-gallery-opacity", String(clamp(1 - v)));
			document.body.style.setProperty("--dsh-gallery-panel", String(clamp(1 - v)));
		}
		/** 更新分组按钮文字（模块级，供 mountControls 与 openGroupManager 共用） */
		async function updateGroupLabel(groupBtn) {
			try {
				const groups = await loadGroups();
				const g = groups.find((x) => x.id === getGroup());
				groupBtn.textContent = "分组：" + (g ? g.name : getGroup());
			} catch {
				groupBtn.textContent = "分组";
			}
		}
		function mountControls() {
			const rootId = "dsh-theme-gallery-opacity";
			if (document.getElementById(rootId)) return;
			const wrap = document.createElement("div");
			wrap.id = rootId;
			wrap.dataset.plugin = "dsh-theme-gallery";
			const rawOpacity = localStorage.getItem(OPACITY_KEY);
			const savedOpacity = rawOpacity === null ? Number.NaN : Number(rawOpacity);
			const opacity = Number.isFinite(savedOpacity) ? clamp(savedOpacity) : 0.85;
			applyOpacity(opacity);
			const rawInterval = localStorage.getItem(INTERVAL_KEY);
			const savedInterval = rawInterval === null ? Number.NaN : Number(rawInterval);
			const intervalMin = Number.isFinite(savedInterval) ? clampMin(savedInterval) : 3;
			const css = [
				"#dsh-theme-gallery-opacity {",
				"  position: fixed;",
				"  right: 14px;",
				"  bottom: 14px;",
				"  z-index: 2147483000;",
				"  display: flex;",
				"  flex-direction: column;",
				"  gap: 8px;",
				"  padding: 10px 12px;",
				"  border-radius: 14px;",
				"  background: rgba(24, 22, 30, 0.45);",
				"  color: #fff;",
				"  font: 12px/1.4 system-ui, sans-serif;",
				"  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);",
				"  backdrop-filter: blur(16px) saturate(1.2);",
				"  -webkit-backdrop-filter: blur(16px) saturate(1.2);",
				"  user-select: none;",
				"}",
				"#dsh-theme-gallery-opacity .dsh-tg-row { display: flex; align-items: center; gap: 8px; }",
				"#dsh-theme-gallery-opacity label { white-space: nowrap; cursor: pointer; }",
				"#dsh-theme-gallery-opacity input[type=range] { width: 110px; accent-color: #7aa2ff; cursor: pointer; }",
				"#dsh-theme-gallery-opacity input[type=number] {",
				"  width: 52px;",
				"  padding: 2px 6px;",
				"  border: 1px solid rgba(255,255,255,0.3);",
				"  border-radius: 6px;",
				"  background: rgba(255,255,255,0.1);",
				"  color: #fff;",
				"  font: inherit;",
				"}",
				"#dsh-theme-gallery-opacity .dsh-tg-value { min-width: 34px; text-align: right; font-variant-numeric: tabular-nums; }",
				"#dsh-theme-gallery-opacity .dsh-tg-btn {",
				"  border: 1px solid rgba(255,255,255,0.3);",
				"  border-radius: 8px;",
				"  background: rgba(255,255,255,0.12);",
				"  color: #fff;",
				"  padding: 3px 10px;",
				"  cursor: pointer;",
				"  font: inherit;",
				"  backdrop-filter: blur(6px);",
				"  -webkit-backdrop-filter: blur(6px);",
				"}",
				"#dsh-theme-gallery-opacity .dsh-tg-btn:hover { background: rgba(255,255,255,0.22); }",
				"#dsh-theme-gallery-opacity .dsh-tg-select {",
				"  flex: 1;",
				"  min-width: 0;",
				"  padding: 4px 8px;",
				"  border: 1px solid rgba(255,255,255,0.3);",
				"  border-radius: 8px;",
				"  background: rgba(255,255,255,0.12);",
				"  color: #fff;",
				"  font: inherit;",
				"  cursor: pointer;",
				"  backdrop-filter: blur(6px);",
				"  -webkit-backdrop-filter: blur(6px);",
				"}",
				"#dsh-theme-gallery-opacity .dsh-tg-select option { background: #1c1c22; color: #fff; }",
				"/* 面板标题行 + 收起按钮 */",
				"#dsh-theme-gallery-opacity .dsh-tg-title-row {",
				"  display: flex;",
				"  align-items: center;",
				"  justify-content: space-between;",
				"  gap: 8px;",
				"  cursor: pointer;",
				"  user-select: none;",
				"}",
				"#dsh-theme-gallery-opacity .dsh-tg-title {",
				"  font-size: 13px;",
				"  font-weight: 600;",
				"  color: #fff;",
				"  white-space: nowrap;",
				"}",
				"#dsh-theme-gallery-opacity .dsh-tg-min {",
				"  border: 1px solid rgba(255,255,255,0.3);",
				"  border-radius: 6px;",
				"  background: rgba(255,255,255,0.1);",
				"  color: rgba(255,255,255,0.9);",
				"  padding: 1px 8px;",
				"  cursor: pointer;",
				"  font: inherit;",
				"  white-space: nowrap;",
				"}",
				"#dsh-theme-gallery-opacity .dsh-tg-min:hover { background: rgba(255,255,255,0.22); }",
				"#dsh-theme-gallery-opacity.collapsed { padding: 7px 10px; }",
				"#dsh-theme-gallery-opacity.collapsed .dsh-tg-row:not(.dsh-tg-title-row) { display: none; }",
				"/* 分组管理面板 */",
				"#dsh-theme-gallery-groups {",
				"  position: fixed;",
				"  right: 14px;",
				"  bottom: 14px;",
				"  z-index: 2147483200;",
				"  width: min(420px, calc(100vw - 28px));",
				"  max-height: min(560px, calc(100vh - 28px));",
				"  display: flex;",
				"  flex-direction: column;",
				"  gap: 10px;",
				"  padding: 14px;",
				"  border-radius: 16px;",
				"  background: rgba(24, 22, 30, 0.6);",
				"  color: #fff;",
				"  font: 13px/1.5 system-ui, sans-serif;",
				"  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);",
				"  backdrop-filter: blur(18px) saturate(1.2);",
				"  -webkit-backdrop-filter: blur(18px) saturate(1.2);",
				"  box-sizing: border-box;",
				"}",
				"#dsh-theme-gallery-groups .dsh-tg-g-head { display: flex; align-items: center; justify-content: space-between; }",
				"#dsh-theme-gallery-groups .dsh-tg-g-title { font-size: 14px; font-weight: 600; }",
				"#dsh-theme-gallery-groups .dsh-tg-g-list { overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }",
				"#dsh-theme-gallery-groups .dsh-tg-g-item {",
				"  display: flex;",
				"  align-items: center;",
				"  justify-content: space-between;",
				"  gap: 8px;",
				"  padding: 8px 12px;",
				"  border-radius: 10px;",
				"  border: 1px solid rgba(255,255,255,0.14);",
				"  background: rgba(255,255,255,0.06);",
				"  cursor: pointer;",
				"  transition: border-color .12s, background .12s;",
				"}",
				"#dsh-theme-gallery-groups .dsh-tg-g-item:hover { background: rgba(255,255,255,0.12); }",
				"#dsh-theme-gallery-groups .dsh-tg-g-item.dsh-tg-active { border-color: #7aa2ff; background: rgba(122,162,255,0.16); }",
				"#dsh-theme-gallery-groups .dsh-tg-g-item .dsh-tg-g-name { font-weight: 500; }",
				"#dsh-theme-gallery-groups .dsh-tg-g-item .dsh-tg-g-meta { font-size: 11px; color: rgba(255,255,255,0.6); }",
				"#dsh-theme-gallery-groups .dsh-tg-g-item .dsh-tg-g-status { font-size: 11px; border-radius: 999px; padding: 1px 8px; }",
				"#dsh-theme-gallery-groups .dsh-tg-g-status-ready { background: rgba(78,209,126,0.2); color: #7ee2a6; }",
				"#dsh-theme-gallery-groups .dsh-tg-g-status-analyzing { background: rgba(247,173,49,0.2); color: #ffcf7a; }",
				"#dsh-theme-gallery-groups .dsh-tg-g-status-failed { background: rgba(239,68,68,0.2); color: #ff9a9a; }",
				"#dsh-theme-gallery-groups .dsh-tg-g-add {",
				"  border-top: 1px solid rgba(255,255,255,0.14);",
				"  padding-top: 10px;",
				"  display: flex;",
				"  flex-direction: column;",
				"  gap: 8px;",
				"}",
				"#dsh-theme-gallery-groups .dsh-tg-g-add input, #dsh-theme-gallery-groups .dsh-tg-g-add textarea {",
				"  width: 100%;",
				"  box-sizing: border-box;",
				"  padding: 6px 10px;",
				"  border: 1px solid rgba(255,255,255,0.3);",
				"  border-radius: 8px;",
				"  background: rgba(255,255,255,0.08);",
				"  color: #fff;",
				"  font: inherit;",
				"}",
				"#dsh-theme-gallery-groups .dsh-tg-g-add textarea { min-height: 64px; resize: vertical; font-family: ui-monospace, monospace; font-size: 12px; }",
				"#dsh-theme-gallery-groups .dsh-tg-g-add .dsh-tg-row { justify-content: flex-end; }",
				"#dsh-theme-gallery-groups .dsh-tg-g-hint { font-size: 11px; color: rgba(255,255,255,0.55); line-height: 1.4; }",
				"#dsh-theme-gallery-groups .dsh-tg-g-progress { font-size: 12px; color: #ffcf7a; }",
				"#dsh-theme-gallery-groups .dsh-tg-g-ops { display: flex; gap: 6px; margin-top: 6px; }",
				"#dsh-theme-gallery-groups .dsh-tg-g-op { padding: 2px 8px; font-size: 11px; border-radius: 6px; }"
			].join("\n");
			const style = document.createElement("style");
			style.textContent = css;
			wrap.append(style);
			// 行0：图片方向筛选下拉框
			const row0 = document.createElement("div");
			row0.className = "dsh-tg-row";
			const orientLabel = document.createElement("label");
			orientLabel.textContent = "方向";
			orientLabel.htmlFor = "dsh-tg-orient";
			const orientSelect = document.createElement("select");
			orientSelect.id = "dsh-tg-orient";
			orientSelect.className = "dsh-tg-select";
			for (const o of ORIENTS) {
				const opt = document.createElement("option");
				opt.value = o.id;
				opt.textContent = o.label;
				orientSelect.append(opt);
			}
			orientSelect.value = getOrient();
			orientSelect.addEventListener("change", () => {
				setOrient(orientSelect.value);
				appliedRel = null;
				pickNext();
			});
			row0.append(orientLabel, orientSelect);
			// 行1：透明度
			const row1 = document.createElement("div");
			row1.className = "dsh-tg-row";
			const label = document.createElement("label");
			label.textContent = "不透明度";
			label.htmlFor = "dsh-tg-range";
			const input = document.createElement("input");
			input.type = "range";
			input.id = "dsh-tg-range";
			input.min = "0";
			input.max = "100";
			input.step = "1";
			input.value = String(Math.round(opacity * 100));
			const valueEl = document.createElement("span");
			valueEl.className = "dsh-tg-value";
			valueEl.textContent = input.value + "%";
			input.addEventListener("input", () => {
				const v = clamp(Number(input.value) / 100);
				valueEl.textContent = input.value + "%";
				applyOpacity(v);
				try { localStorage.setItem(OPACITY_KEY, String(v)); } catch {}
			});
			row1.append(label, input, valueEl);
			// 行2：自动换图间隔（分钟）
			const row2 = document.createElement("div");
			row2.className = "dsh-tg-row";
			const label2 = document.createElement("label");
			label2.textContent = "换图(分)";
			label2.htmlFor = "dsh-tg-interval";
			const intervalInput = document.createElement("input");
			intervalInput.type = "number";
			intervalInput.id = "dsh-tg-interval";
			intervalInput.min = "0.1";
			intervalInput.max = "240";
			intervalInput.step = "0.5";
			intervalInput.value = String(intervalMin);
			const restartTimer = () => {
				const mins = clampMin(Number(intervalInput.value) || 3);
				intervalInput.value = String(mins);
				try { localStorage.setItem(INTERVAL_KEY, String(mins)); } catch {}
				if (rotateTimer) clearInterval(rotateTimer);
				rotateTimer = setInterval(pickNext, mins * 60 * 1000);
			};
			intervalInput.addEventListener("change", restartTimer);
			row2.append(label2, intervalInput);
			// 行3：立即换一张 + 切换分组
			const row3 = document.createElement("div");
			row3.className = "dsh-tg-row";
			const btn = document.createElement("button");
			btn.type = "button";
			btn.className = "dsh-tg-btn";
			btn.textContent = "换一张";
			btn.addEventListener("click", () => {
				if (localStorage.getItem(DISABLED_KEY) === "1") {
					try { localStorage.removeItem(DISABLED_KEY); } catch {}
					syncResetLabel();
				}
				pickNext();
			});
			const groupBtn = document.createElement("button");
			groupBtn.type = "button";
			groupBtn.className = "dsh-tg-btn dsh-tg-group-btn";
			groupBtn.textContent = "分组";
			updateGroupLabel(groupBtn);
			// 点击分组按钮：打开分组管理面板（切换/添加分组）
			groupBtn.addEventListener("click", () => {
				// 若处于恢复出厂状态，点击分组视为重新启用
				if (localStorage.getItem(DISABLED_KEY) === "1") {
					try { localStorage.removeItem(DISABLED_KEY); } catch {}
					syncResetLabel();
				}
				openGroupManager();
			});
			row3.append(btn, groupBtn);
			// 行4：恢复出厂 / 启用皮肤（彻底清除皮肤效果，回到 dsh 原始 UI）
			const row4 = document.createElement("div");
			row4.className = "dsh-tg-row";
			const resetBtn = document.createElement("button");
			resetBtn.type = "button";
			resetBtn.className = "dsh-tg-btn";
			const syncResetLabel = () => {
				const disabled = localStorage.getItem(DISABLED_KEY) === "1";
				resetBtn.textContent = disabled ? "启用皮肤" : "恢复出厂";
			};
			syncResetLabel();
			resetBtn.addEventListener("click", () => {
				const disabled = localStorage.getItem(DISABLED_KEY) === "1";
				if (disabled) {
					// 重新启用
					try { localStorage.removeItem(DISABLED_KEY); } catch {}
					appliedRel = null;
					pickNext();
				} else {
					// 恢复出厂：清除全部皮肤效果
					try { localStorage.setItem(DISABLED_KEY, "1"); } catch {}
					if (rotateTimer) { clearInterval(rotateTimer); rotateTimer = null; }
					if (currentStyle) { currentStyle.remove(); currentStyle = null; }
					delete document.body.dataset.dshThemeGallery;
					document.body.style.removeProperty("--dsh-gallery-opacity");
					document.body.style.removeProperty("--dsh-gallery-panel");
				}
				syncResetLabel();
			});
			row4.append(resetBtn);
			// 面板标题行 + 收起按钮（幂等：已存在则不重复加）
			let titleRow = wrap.querySelector(".dsh-tg-title-row");
			if (!titleRow) {
				titleRow = document.createElement("div");
				titleRow.className = "dsh-tg-row dsh-tg-title-row";
				const titleLabel = document.createElement("span");
				titleLabel.className = "dsh-tg-title";
				titleLabel.textContent = "🎨 背景主题";
				const minBtn = document.createElement("button");
				minBtn.type = "button";
				minBtn.className = "dsh-tg-min";
				minBtn.textContent = "▾ 收起";
				const syncMin = () => {
					minBtn.textContent = wrap.classList.contains("collapsed") ? "▸ 展开" : "▾ 收起";
				};
				minBtn.addEventListener("click", (e) => {
					e.stopPropagation();
					wrap.classList.toggle("collapsed");
					try { localStorage.setItem(COLLAPSED_KEY, wrap.classList.contains("collapsed") ? "1" : "0"); } catch {}
					syncMin();
				});
				titleRow.addEventListener("click", () => {
					wrap.classList.toggle("collapsed");
					try { localStorage.setItem(COLLAPSED_KEY, wrap.classList.contains("collapsed") ? "1" : "0"); } catch {}
					syncMin();
				});
				titleRow.append(titleLabel, minBtn);
				wrap.prepend(titleRow);
				// 恢复折叠状态
				try {
					if (localStorage.getItem(COLLAPSED_KEY) === "1") wrap.classList.add("collapsed");
				} catch {}
				syncMin();
			}
			wrap.append(row0, row1, row2, row3, row4);
			document.body.append(wrap);
			restartTimer();
		}
		/** 分组管理面板：已准备分组列表（点击切换）+ 添加文件夹分组 */
		async function openGroupManager() {
			const pid = "dsh-theme-gallery-groups";
			const existing = document.getElementById(pid);
			if (existing) { existing.remove(); return; }
			// 更新右下角分组按钮文字（通过 DOM 定位）
			const refreshGroupBtn = async () => {
				const btn = document.querySelector(".dsh-tg-group-btn");
				if (btn) await updateGroupLabel(btn);
			};
			const panel = document.createElement("div");
			panel.id = pid;
			panel.dataset.plugin = "dsh-theme-gallery";
			// 头部
			const head = document.createElement("div");
			head.className = "dsh-tg-g-head";
			const title = document.createElement("span");
			title.className = "dsh-tg-g-title";
			title.textContent = "分组管理";
			const close = document.createElement("button");
			close.type = "button";
			close.className = "dsh-tg-btn";
			close.textContent = "关闭";
			close.addEventListener("click", () => panel.remove());
			head.append(title, close);
			// 分组列表
			const listEl = document.createElement("div");
			listEl.className = "dsh-tg-g-list";
			const renderList = (groups) => {
				listEl.textContent = "";
				const cur = getGroup();
				for (const g of groups) {
					const item = document.createElement("div");
					item.className = "dsh-tg-g-item" + (g.id === cur ? " dsh-tg-active" : "");
					const nameEl = document.createElement("div");
					nameEl.className = "dsh-tg-g-name";
					nameEl.textContent = g.name + (g.builtin ? "" : " ✦");
					const meta = document.createElement("div");
					meta.className = "dsh-tg-g-meta";
					meta.textContent = (g.total ?? 0) + " 张";
					const status = document.createElement("span");
					status.className = "dsh-tg-g-status dsh-tg-g-status-" + (g.status ?? "ready");
					status.textContent = g.status === "analyzing" ? "分析中…" : g.status === "failed" ? "失败" : "就绪";
					item.append(nameEl, meta, status);
					// 所有分组：更新 / 改名 / 删除 操作（内置分组删除有保护提示）
					{
						const ops = document.createElement("div");
						ops.className = "dsh-tg-g-ops";
						const mkOp = (label, handler) => {
							const b = document.createElement("button");
							b.type = "button";
							b.className = "dsh-tg-btn dsh-tg-g-op";
							b.textContent = label;
							b.addEventListener("click", (e) => {
								e.stopPropagation();
								handler();
							});
							return b;
						};
						// 更新：重新扫描目录并分析
						const upd = mkOp("更新", async () => {
							if (g.status === "analyzing") return;
							try {
								await fetchJson("/gallery/group-update", {
									method: "POST",
									headers: { "content-type": "application/json" },
									body: JSON.stringify({ id: g.id })
								});
								// 轮询状态
								const poll = setInterval(async () => {
									try {
										const st = await fetchJson("/gallery/group-status?id=" + g.id);
										if (st.status === "ready" || st.status === "failed") {
											clearInterval(poll);
											await refreshGroups();
											renderList(groupsCache);
										}
									} catch {}
								}, 4000);
								status.textContent = "分析中…";
								status.className = "dsh-tg-g-status dsh-tg-g-status-analyzing";
							} catch {}
						});
						// 改名
						const ren = mkOp("改名", async () => {
							const newName = prompt("输入新的分组名称：", g.name);
							if (newName === null || newName.trim() === "") return;
							try {
								await fetchJson("/gallery/group-rename", {
									method: "POST",
									headers: { "content-type": "application/json" },
									body: JSON.stringify({ id: g.id, name: newName.trim() })
								});
								await refreshGroups();
								renderList(groupsCache);
							} catch {}
						});
						// 删除（内置分组保护：不可删除）
						const del = mkOp("删除", async () => {
							if (g.builtin) {
								alert("内置分组不可删除。");
								return;
							}
							if (!confirm("确定删除分组「" + g.name + "」？其图片元数据将被移除。")) return;
							try {
								await fetchJson("/gallery/group-delete", {
									method: "POST",
									headers: { "content-type": "application/json" },
									body: JSON.stringify({ id: g.id })
								});
								if (getGroup() === g.id) {
									setGroup("g1");
									appliedRel = null;
									await pickNext();
									refreshGroupBtn();
								}
								await refreshGroups();
								renderList(groupsCache);
							} catch {}
						});
						ops.append(upd, ren, del);
						item.append(ops);
					}
					item.addEventListener("click", async () => {
						if (g.status === "analyzing") return;
						setGroup(g.id);
						appliedRel = null;
						galleryCache.delete(g.id);
						await pickNext();
						refreshGroupBtn();
						panel.remove();
					});
					listEl.append(item);
				}
			};
			// 添加分组区
			const addEl = document.createElement("div");
			addEl.className = "dsh-tg-g-add";
			const nameInput = document.createElement("input");
			nameInput.type = "text";
			nameInput.placeholder = "分组名称（必填）";
			const dirsInput = document.createElement("textarea");
			dirsInput.placeholder = "文件夹路径，每行一个（必填）\n例如：D:/图片/插画A\nD:/图片/插画B";
			const hint = document.createElement("div");
			hint.className = "dsh-tg-g-hint";
			hint.textContent = "可填多个文件夹组成一个分组；添加后后台自动分析图片主题色，完成后即可使用。";
			const addRow = document.createElement("div");
			addRow.className = "dsh-tg-row";
			const scanBtn = document.createElement("button");
			scanBtn.type = "button";
			scanBtn.className = "dsh-tg-btn";
			scanBtn.textContent = "添加并分析";
			const progress = document.createElement("div");
			progress.className = "dsh-tg-g-progress";
			progress.style.display = "none";
			scanBtn.addEventListener("click", async () => {
				const name = nameInput.value.trim();
				const dirs = dirsInput.value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
				if (name === "") { alert("请填写分组名称"); return; }
				if (dirs.length === 0) { alert("请填写至少一个文件夹路径"); return; }
				// 校验每个目录
				for (const d of dirs) {
					const enc = encodeURIComponent(d);
					const r = await fetchJson("/gallery/dirscan?path=" + enc);
					if (r.error) { alert("目录无效：" + d + "\n" + r.error); return; }
				}
				progress.style.display = "block";
				progress.textContent = "正在分析图片主题色…（大文件夹需要几分钟）";
				scanBtn.disabled = true;
				const resp = await fetchJson("/gallery/group-add", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ name, dirs })
				});
				// 轮询状态直到 ready/failed
				const poll = setInterval(async () => {
					try {
						const st = await fetchJson("/gallery/group-status?id=" + resp.id);
						if (st.status === "ready" || st.status === "failed") {
							clearInterval(poll);
							progress.textContent = st.status === "ready" ? "完成：" + (st.total ?? 0) + " 张" : "分析失败";
							scanBtn.disabled = false;
							await refreshGroups();
							renderList(groupsCache);
							if (st.status === "ready") {
								setGroup(resp.id);
								appliedRel = null;
								galleryCache.delete(resp.id);
								await pickNext();
								refreshGroupBtn();
								panel.remove();
							}
						} else {
							progress.textContent = "正在分析图片主题色…（大文件夹需要几分钟）";
						}
					} catch {}
				}, 4000);
			});
			addRow.append(scanBtn);
			addEl.append(nameInput, dirsInput, hint, progress, addRow);
			panel.append(head, listEl, addEl);
			document.body.append(panel);
			// 初始加载分组列表
			try {
				const groups = await loadGroups();
				renderList(groups);
			} catch {
				listEl.textContent = "分组列表加载失败";
			}
		}
		function apply(ctx) {
			const tagId = "dsh-theme-gallery";
			const existing = document.getElementById(tagId);
			if (existing) existing.remove();
			currentStyle = document.createElement("style");
			currentStyle.id = tagId;
			currentStyle.dataset.plugin = "dsh-theme-gallery";
			document.head.append(currentStyle);
			// 若处于"恢复出厂"状态，不应用皮肤（保留原始 UI），仅挂控件
			const disabled = localStorage.getItem(DISABLED_KEY) === "1";
			if (!disabled) {
				pickNext();
			} else {
				currentStyle.remove();
				currentStyle = null;
			}
			mountControls();
			return () => {
				if (rotateTimer) clearInterval(rotateTimer);
				if (currentStyle) currentStyle.remove();
				delete document.body.dataset.dshThemeGallery;
				document.body.style.removeProperty("--dsh-gallery-opacity");
				document.body.style.removeProperty("--dsh-gallery-panel");
				const ctrl = document.getElementById("dsh-theme-gallery-opacity");
				if (ctrl) ctrl.remove();
			};
		}
		exports.inject = inject;
		exports.apply = apply;
		return module.exports;
	}
});
