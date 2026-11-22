// Icon Motion: the grammar of a sports-broadcast identity. Everything is built from one square cell (discs, half-discs, quarters,
// rings, dot grids in five tones of the brand's accent) and from round-capped bars. The one gesture is the ROW SHIFT: a row of cells,
// a row of text or a whole strip of the frame slides sideways by whole cells, inside its own mask, landing on the beat.
import { clamp, mix, contrast, rng } from '/engine/kit.js';

export const BEAT = 0.5;
export const snap = (p) => 1 - (1 - clamp(p)) ** 5;          // a row lands: most of the travel at once, a short soft tail
export const accel = (p) => clamp(p) ** 2.6;                 // a row leaves: ends at full speed
export const glide = (p) => 1 - (1 - clamp(p)) ** 2;

// The brand's colours sorted by role, so the style works whichever of bg/text is the light one.
export function palette(brand) {
  const c = brand.colors, lum = (h) => contrast(h, '#000000');
  const light = lum(c.bg) >= lum(c.text) ? c.bg : c.text, dark = light === c.bg ? c.text : c.bg, acc = c.accent;
  const onAcc = contrast(light, acc) >= contrast(dark, acc) ? light : dark;
  return {
    paper: light, ink: dark, acc, onAcc,
    grey: mix(light, dark, 0.52), rule: mix(light, dark, 0.18),
    tones: [mix(light, acc, 0.1), mix(light, acc, 0.24), mix(light, acc, 0.48), acc, mix(acc, dark, 0.38)],
  };
}

// ---- the cell pattern: one sheet of cols x rows square cells, built once from a seed
function motif(g, kind, x, y, C, col, rot) {
  g.save(); g.translate(x + C / 2, y + C / 2); g.rotate(rot * Math.PI / 2); g.fillStyle = col; g.strokeStyle = col;
  const h = C / 2;
  g.beginPath();
  if (kind === 'disc') { g.arc(0, 0, h * 0.92, 0, Math.PI * 2); g.fill(); }
  else if (kind === 'half') { g.arc(0, h, h, Math.PI, 0); g.closePath(); g.fill(); }
  else if (kind === 'quarter') { g.moveTo(-h, h); g.arc(-h, h, C, -Math.PI / 2, 0); g.closePath(); g.fill(); }
  else if (kind === 'ring') { g.lineWidth = C * 0.15; g.arc(0, 0, h * 0.62, 0, Math.PI * 2); g.stroke(); }
  else if (kind === 'dots') { for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { g.moveTo(i * C * 0.28 + C * 0.07, j * C * 0.28); g.arc(i * C * 0.28, j * C * 0.28, C * 0.07, 0, Math.PI * 2); } g.fill(); }
  else if (kind === 'pill') { g.lineWidth = C * 0.3; g.lineCap = 'round'; g.moveTo(-h * 0.55, 0); g.lineTo(h * 0.55, 0); g.stroke(); }
  else if (kind === 'bars') { g.lineWidth = C * 0.11; g.lineCap = 'round'; for (const k of [-1, 0, 1]) { g.moveTo(-h * 0.6, k * C * 0.25); g.lineTo(h * 0.6, k * C * 0.25); } g.stroke(); }
  g.restore();
}
export const KINDS = ['disc', 'half', 'quarter', 'ring', 'dots', 'pill', 'bars', 'half', 'quarter', 'none'];

export function sheet(P, W, C, rows, seed = 45) {
  const cols = Math.round(W / C), cv = document.createElement('canvas'); cv.width = cols * C; cv.height = rows * C;
  const g = cv.getContext('2d'), r = rng(seed);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const bgI = Math.floor(r() * 3), x = i * C, y = j * C;
    g.fillStyle = [P.paper, P.tones[0], P.tones[1]][bgI]; g.fillRect(x, y, C, C);
    const kind = KINDS[Math.floor(r() * KINDS.length)];
    const fgs = [P.tones[2], P.tones[3], P.tones[4], P.tones[3]].filter((_, k) => k !== bgI);
    if (kind !== 'none') { g.save(); g.beginPath(); g.rect(x, y, C, C); g.clip(); motif(g, kind, x, y, C, fgs[Math.floor(r() * fgs.length)], Math.floor(r() * 4)); g.restore(); }
  }
  return cv;
}
// Draws sheet row `j` at frame height y, shifted by dx (wrapping), clipped to the frame width.
export function row(ctx, sh, j, y, dx, C, W) {
  const w = sh.width, o = ((dx % w) + w) % w;
  ctx.drawImage(sh, 0, j * C, w, C, o - w, y, w, C);
  ctx.drawImage(sh, 0, j * C, w, C, o, y, w, C);
}
// How far a band row has travelled at time `time`: one cell every 5 beats, rows out of phase, alternate rows the other way.
export function shift(time, r, C) {
  const n = Math.floor(time / BEAT); let s = 0;
  for (let k = 0; k <= n; k++) if ((k + 2 * r) % 5 === 0) s += snap((time - k * BEAT) / 0.32);
  return s * C * (r % 2 ? -1 : 1);
}

// ---- words: where kit.drawText will put each word, so a key phrase gets one shape behind it, not one per word
// Extra room around a key phrase, so its capsule never touches the next word: words after a key/plain boundary move along the row.
export const GAP = 0.42, PAD = 0.34;
export function boxes(kit, f, { x0, x1, y, align = 'start' }) {
  const out = []; let i = 0;
  f.rows.forEach((rw, r) => {
    const yy = y + r * f.lead, atStart = kit.rtl ? x1 - rw.width : x0, atEnd = kit.rtl ? x0 : x1 - rw.width;
    const left = align === 'center' ? (x0 + x1 - rw.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = kit.rtl ? left + rw.width : left, cum = 0, prev = null;
    const row = [];
    for (const w of rw.words) {
      if (prev !== null && prev !== !!w.key) cum += f.size * GAP;
      prev = !!w.key;
      const wl = kit.rtl ? cur - w.width : cur;
      row.push({ x: wl, y: yy, width: w.width, row: r, key: w.key, i: i++, off: kit.rtl ? -cum : cum });
      cur = kit.rtl ? wl - f.space : wl + w.width + f.space;
    }
    // keep the row where it was meant to sit: a centred row shifts back by half its growth, an end-aligned row by all of it
    const grow = cum * (align === 'center' ? 0.5 : align === 'start' ? 0 : 1) * (kit.rtl ? 1 : -1);
    for (const b of row) { b.off += grow; b.x += b.off; out.push(b); }
  });
  return out;
}
export function keyRuns(bx) {
  const runs = [];
  for (let k = 0; k < bx.length; k++) {
    const b = bx[k]; if (!b.key) continue;
    const prev = bx[k - 1], last = runs.at(-1);
    if (prev && prev.key && prev.row === b.row && last) { last.x0 = Math.min(last.x0, b.x); last.x1 = Math.max(last.x1, b.x + b.width); }
    else runs.push({ row: b.row, y: b.y, x0: b.x, x1: b.x + b.width });
  }
  return runs;
}
export const keyRoom = (size) => size * (2 * GAP);     // take this off maxW when fitting a text that may carry a key phrase
export function capsule(ctx, x0, x1, y, size, col) {
  const h = size * 1.08, p = size * PAD;
  ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(x0 - p, y - h / 2, x1 - x0 + 2 * p, h, h / 2); ctx.fill();
}

// A text whose rows slide in sideways out of their own masks (from the reading side) and leave the same way they came in, faster.
// rowIn(r) / rowOut(r): progress 0..1 of that row's entrance / exit. The key phrase sits on one accent capsule that travels with its row.
export function slideText(ctx, kit, f, { x0, x1, y, color, P, rowIn, rowOut = () => 0, align = 'start', keyed = true, decor = false }) {
  const dir = kit.rtl ? 1 : -1, travel = (x1 - x0) * 0.9 + 80;
  const dx = (r) => (1 - snap(rowIn(r))) * travel * dir - accel(rowOut(r)) * travel * dir;
  const vis = (r) => rowIn(r) > 0 && rowOut(r) < 1;
  const mask = (c, r) => { const yy = y + r * f.lead; c.beginPath(); c.rect(x0 - 70, yy - f.lead / 2, x1 - x0 + 140, f.lead); c.clip(); };
  const bx = boxes(kit, f, { x0, x1, y, align });
  if (keyed) for (const run of keyRuns(bx)) {
    if (!vis(run.row)) continue;
    ctx.save(); mask(ctx, run.row); ctx.translate(dx(run.row), 0); capsule(ctx, run.x0, run.x1, run.y + f.size * 0.04, f.size, P.acc); ctx.restore();
  }
  kit.drawText(ctx, f, { x0, x1, y, align, color, key: keyed ? P.onAcc : color, decor,
    each: (w, i, box, c) => { if (!vis(box.row)) return false; mask(c, box.row); c.translate(dx(box.row) + (keyed ? bx[i].off : 0), 0); } });
}

// ---- pictograms: round-capped bars, discs and half-discs, drawn in a stage disc of radius R centred at (cx, cy)
export function bar(ctx, x1, y1, x2, y2, w, col) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
export function disc(ctx, x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }

export function stage(ctx, cx, cy, R, P, k = 1) {
  if (k <= 0) return;
  disc(ctx, cx, cy, R * k, P.paper);
  ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, cy, R * k, 0, Math.PI * 2); ctx.stroke();
}
// A faceless figure: disc head, bar limbs. `wave` 0..1 raises the near arm; `far` limbs are mixed towards the paper.
export function figure(ctx, cx, cy, R, P, { wave = 0, step = 0 } = {}) {
  const u = R / 100, w = 15 * u, far = mix(P.ink, P.paper, 0.45);
  const hip = [cx, cy + 18 * u], sh = [cx, cy - 26 * u];
  bar(ctx, sh[0], sh[1], sh[0] - 30 * u, sh[1] + 34 * u, w, far);                         // far arm
  bar(ctx, hip[0], hip[1], hip[0] - 18 * u - step * 8 * u, hip[1] + 52 * u, w, far);     // far leg
  bar(ctx, sh[0], sh[1], hip[0], hip[1], w * 1.25, P.ink);                               // torso
  bar(ctx, hip[0], hip[1], hip[0] + 20 * u + step * 8 * u, hip[1] + 52 * u, w, P.ink);   // near leg
  const a = Math.PI * (0.3 - 0.68 * wave);
  bar(ctx, sh[0], sh[1], sh[0] + Math.cos(a) * 46 * u, sh[1] + Math.sin(a) * 46 * u, w, P.ink);   // near arm
  disc(ctx, cx + 2 * u, cy - 55 * u, 15 * u, P.acc);                                     // head
}
// A stopwatch: ring, crown and a hand that turns with p.
export function watch(ctx, cx, cy, R, P, p) {
  const u = R / 100;
  ctx.strokeStyle = P.ink; ctx.lineWidth = 12 * u; ctx.beginPath(); ctx.arc(cx, cy + 6 * u, 50 * u, 0, Math.PI * 2); ctx.stroke();
  bar(ctx, cx - 10 * u, cy - 58 * u, cx + 10 * u, cy - 58 * u, 13 * u, P.ink);
  ctx.fillStyle = P.tones[2]; ctx.beginPath(); ctx.moveTo(cx, cy + 6 * u); ctx.arc(cx, cy + 6 * u, 40 * u, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p); ctx.closePath(); ctx.fill();
  const a = -Math.PI / 2 + Math.PI * 2 * p;
  bar(ctx, cx, cy + 6 * u, cx + Math.cos(a) * 34 * u, cy + 6 * u + Math.sin(a) * 34 * u, 9 * u, P.acc);
  disc(ctx, cx, cy + 6 * u, 8 * u, P.ink);
}
// A balance: a half-disc base, a beam that tilts by `tilt` (-1..1), two half-disc pans.
export function balance(ctx, cx, cy, R, P, tilt, heavyLeft) {
  const u = R / 100, a = tilt * 0.32, L = 58 * u, py = cy - 22 * u;
  bar(ctx, cx, py, cx, cy + 40 * u, 10 * u, P.ink);
  ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(cx, cy + 58 * u, 22 * u, Math.PI, 0); ctx.closePath(); ctx.fill();
  const ex = (s) => [cx + s * Math.cos(a) * L, py + s * Math.sin(a) * L];
  bar(ctx, ...ex(-1), ...ex(1), 9 * u, P.ink);
  for (const s of [-1, 1]) {
    const [x, y] = ex(s); bar(ctx, x, y, x, y + 22 * u, 5 * u, P.ink);
    ctx.fillStyle = (s < 0) === heavyLeft ? P.acc : P.tones[2]; ctx.beginPath(); ctx.arc(x, y + 22 * u, 20 * u, 0, Math.PI); ctx.closePath(); ctx.fill();
  }
  disc(ctx, cx, py, 8 * u, P.acc);
}
// A short list pictogram: n capsule rows with disc bullets, `shown` of them lit.
export function sheetIcon(ctx, cx, cy, R, P, n, shown) {
  const u = R / 100, gap = Math.min(26, 110 / Math.max(n, 1)) * u, y0 = cy - (n - 1) * gap / 2;
  for (let k = 0; k < n; k++) {
    const on = k < shown, y = y0 + k * gap, rtl = true;
    disc(ctx, cx + (rtl ? 40 : -40) * u, y, 8 * u, on ? P.acc : P.rule);
    bar(ctx, cx + 22 * u, y, cx - 42 * u + (k % 2) * 14 * u, y, 10 * u, on ? P.ink : P.rule);
  }
}
