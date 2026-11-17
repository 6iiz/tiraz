// brand.js · one customer's identity, read from brand.json: name, colours, fonts, logo, handle, slogan. Identity values only; the look
// that is built from them (grounds, panels, motion, endings) lives in the brand's own look/ folder, never here.
// Missing or wrong fields are reported together, in words, before anything is drawn. ARCHITECTURE.md, "brand.json", is the contract.
import { loadFont } from './lib/base.js';

const HEX = /^#[0-9a-f]{6}$/i;
const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
export const rgba = (h, a) => { const [r, g, b] = rgb(h); return `rgba(${r},${g},${b},${a})`; };
export const mix = (a, b, p) => { const A = rgb(a), B = rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * p).toString(16).padStart(2, '0')).join(''); };
const luminance = (h) => { const [r, g, b] = rgb(h).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
// WCAG contrast ratio, 1 (same colour) to 21 (black on white), whichever colour is lighter.
export const contrast = (a, b) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

const fontOk = (f) => f && typeof f.family === 'string' && f.family && typeof f.file === 'string' && f.file;

export async function loadBrand(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`brand file not found: ${url}. Check the &brand= address, or the --mount that serves the brand folder.`);
  let b;
  try { b = await res.json(); } catch { throw new Error(`${url} is not valid JSON: open it and fix the syntax.`); }
  const bad = [], c = b.colors || {}, f = b.fonts || {};
  if (!b.name || typeof b.name !== 'string') bad.push('name is missing');
  for (const k of ['bg', 'text', 'accent']) if (!HEX.test(c[k] || '')) bad.push(`colors.${k} is missing or not a #RRGGBB colour like #1A1A1A`);
  for (const k of Object.keys(c)) if (!['bg', 'text', 'accent'].includes(k) && !HEX.test(c[k])) bad.push(`colors.${k} is not a #RRGGBB colour`);
  if (!fontOk(f.display)) bad.push('fonts.display needs a family and a file, e.g. { "family": "…", "file": "/brand/fonts/….ttf" }');
  for (const k of ['text', 'mono']) if (f[k] !== undefined && !fontOk(f[k])) bad.push(`fonts.${k} needs a family and a file (or leave it out to use fonts.display)`);
  if (!b.logo || (!b.logo.path && !b.logo.file)) bad.push('logo needs a path (SVG path data) or a file (an image)');
  if (b.slogan !== undefined && !(Array.isArray(b.slogan) && b.slogan.length >= 1 && b.slogan.length <= 2 && b.slogan.every((s) => typeof s === 'string' && s.trim()))) bad.push('slogan, when present, must be a list of one or two non-empty texts');
  if (b.look !== undefined && !(typeof b.look === 'string' && b.look.startsWith('/brand/') && b.look.endsWith('/'))) bad.push('look must be the brand\'s look folder as a path that starts with /brand/ and ends with /, e.g. "/brand/look/"');
  if (bad.length) throw new Error(`brand.json (${url}) is not usable:\n- ` + bad.join('\n- '));

  b.dir ??= 'rtl'; b.platform ??= 'instagram';
  f.text ??= f.display; f.mono ??= f.display;
  for (const font of new Set([f.display, f.text, f.mono])) await loadFont(font.family, font.file, font.weight);
  await document.fonts.load(`700 100px "${f.display.family}"`, b.name);   // the first paint must not wait for the face

  if (b.logo.path) {
    const p = new Path2D(b.logo.path), box = b.logo.box || 256, rule = b.logo.rule || 'nonzero'; b.logo.shape = true;
    b.logo.draw = (ctx, x, y, s, fill) => { ctx.save(); ctx.translate(x, y); ctx.scale(s / box, s / box); ctx.fillStyle = fill; ctx.fill(p, rule); ctx.restore(); };
  } else b.logo.draw = await imageDraw(b.logo.file, 'logo');
  // A detailed logo is unreadable when small: logo.mark is a simpler version (an icon) for small sizes.
  b.logo.small = b.logo.mark ? await imageDraw(b.logo.mark, 'logo mark') : b.logo.draw;
  return b;
}

async function imageDraw(src, what) {
  const img = new Image(); img.src = src;
  try { await img.decode(); } catch { throw new Error(`the ${what} image did not load: ${src}. Check the path in brand.json.`); }
  return (ctx, x, y, s) => { const k = s / Math.max(img.naturalWidth, img.naturalHeight), w = img.naturalWidth * k, h = img.naturalHeight * k; ctx.drawImage(img, x + (s - w) / 2, y + (s - h) / 2, w, h); };
}

// The small mark beside a handle. Only Instagram is drawn for now; any other platform shows the handle alone.
export function platformIcon(ctx, brand, x, y, s, color) {
  if (brand.platform !== 'instagram') return 0;
  ctx.strokeStyle = color; ctx.lineWidth = s * 0.09;
  ctx.beginPath(); ctx.roundRect(x - s / 2, y - s / 2, s, s, s * 0.28); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, s * 0.22, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + s * 0.27, y - s * 0.27, s * 0.06, 0, Math.PI * 2); ctx.fill();
  return s;
}
