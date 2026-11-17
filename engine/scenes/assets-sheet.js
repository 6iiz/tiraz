// assets-sheet.js · a contact sheet: the assets named in the query, on a flat fill of the brand's bg colour, each with its id underneath.
//   index.html?scene=/engine/scenes/assets-sheet.js&brand=/engine/tool-brand.json&ids=tabler:heart,fluent-emoji-flat:fire
// Used by `tools/assets.py sheet` and by the test. Icons are drawn in the brand accent; emoji keep their own colours.
// The picture does not change with t, so one frame (--at 0) is the whole sheet.
import { mix } from '../brand.js';
import { loadAsset } from '../assets.js';
import { rr } from '../lib/base.js';

export const duration = 1;
let B, items = [];

export async function init({ brand, query }) {
  if (!brand) throw new Error('assets-sheet.js needs a brand: pass &brand=/engine/tool-brand.json');
  const ids = (query.get('ids') || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!ids.length) throw new Error('assets-sheet.js needs &ids=set:name,set:name');
  B = brand;
  // every id is loaded before drawing; a bad one throws a sentence naming it
  items = await Promise.all(ids.map(async (id) => ({ id, asset: await loadAsset(id, { color: brand.colors.accent }) })));
  // the test names ids it expects to be traceable (asset.paths is a list) or not (null); a wrong answer is reported as a page error
  const list = (k) => (query.get(k) || '').split(',').filter(Boolean);
  for (const id of list('expectPaths')) if (!items.find((i) => i.id === id)?.asset.paths) console.error(`assets-sheet: ${id} should have paths but has none`);
  for (const id of list('expectNoPaths')) if (items.find((i) => i.id === id)?.asset.paths) console.error(`assets-sheet: ${id} should have no paths but has some`);
}

// This page is a tool, not a look: its two greys are plain mixes of the brand's own text and bg.
const tones = (c) => ({ ...c, muted: mix(c.text, c.bg, 0.35), panel: mix(c.bg, c.text, 0.06) });

// the most room for the pictures: try 1..10 columns and keep the one that gives the biggest cell that still fits the page
function grid(n, W, H, longestSet) {
  const left = 60, top = 150, availW = W - 2 * left, availH = H - top - 150;
  let best = null;
  for (let cols = 1; cols <= 10; cols++) {
    const rows = Math.ceil(n / cols), cw = availW / cols, ch = availH / rows;
    const fs = Math.max(9, Math.min(22, (cw - 28) / (longestSet * 0.62)));          // the longest set name must fit the cell (mono letters are 0.6 em wide)
    const icon = Math.min(cw * 0.7, ch - fs * 3.5 - 50, 320);
    if (icon > 0 && (!best || icon > best.icon)) best = { cols, rows, cw, ch, icon, fs, left, top };
  }
  best.ch = Math.min(best.ch, best.icon + best.fs * 3.5 + 50);                     // cells hug their content; the block sits in the middle of the page
  best.top += Math.max(0, (availH - best.rows * best.ch) / 2);
  return best;
}

// an id's name breaks after hyphens so a long name stays inside its cell
function wrap(ctx, name, maxW, maxLines) {
  const parts = name.split('-'), lines = [''];
  for (const p of parts) {
    const trial = lines.at(-1) ? lines.at(-1) + '-' + p : p;
    if (ctx.measureText(trial).width <= maxW || !lines.at(-1)) lines[lines.length - 1] = trial; else lines.push(p);
  }
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/.{0,2}$/, '…'); }
  return lines;
}

export function draw(ctx, t, { W, H }) {
  const c = tones(B.colors), g = grid(items.length, W, H, Math.max(...items.map((i) => i.id.indexOf(':')))), mono = B.fonts.mono.family;
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.direction = 'ltr';
  ctx.font = `500 30px "${mono}"`; ctx.fillStyle = c.muted; ctx.fillText(`${items.length} assets`, W / 2, 96);
  const fs = g.fs;
  items.forEach((it, i) => {
    const col = i % g.cols, row = Math.floor(i / g.cols), x0 = g.left + col * g.cw, y0 = g.top + row * g.ch, pad = 8;
    ctx.fillStyle = c.panel; rr(ctx, x0 + pad, y0 + pad, g.cw - 2 * pad, g.ch - 2 * pad, 22); ctx.fill();
    it.asset.draw(ctx, x0 + (g.cw - g.icon) / 2, y0 + pad + 18, g.icon);
    const [set, name] = [it.id.split(':')[0], it.id.slice(it.id.indexOf(':') + 1)];
    ctx.font = `500 ${fs}px "${mono}"`; ctx.fillStyle = c.muted; ctx.fillText(set, x0 + g.cw / 2, y0 + pad + 18 + g.icon + fs + 14);
    ctx.fillStyle = c.text;
    wrap(ctx, name, g.cw - 2 * pad - 12, 2).forEach((l, k) => ctx.fillText(l, x0 + g.cw / 2, y0 + pad + 18 + g.icon + fs + 14 + (k + 1) * (fs + 4)));
  });
}
