// Ink-frames motion and shared drawing: a printed comic page in two inks. The panel is the cut: a panel's border is inked along its
// length, then what is inside it is there. Lettering does not slide or fade: words are stamped on (a short overscale that settles in
// a tenth of a second), and the key word is lettered like a sound effect: the spot colour inside an ink outline and a paper rim.
// Every grey is a screen of ink dots (`tone`), never a flat grey. Focus lines rush in toward a clear centre where the words sit.
import { clamp, ease, mix, contrast, rng, rgba } from '/engine/kit.js';

export const E = ease.outCubic;
export const SNAP = ease.outExpo;
export const IO = ease.inOutCubic;

// The two inks: the lighter brand colour is the paper, the darker one the ink, whichever role the brand gave them.
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const light = contrast(bg, '#000000') >= contrast(text, '#000000') ? bg : text, dark = light === bg ? text : bg;
  const line = contrast(accent, dark) >= contrast(accent, light) ? dark : light;   // the outline that holds the spot colour
  return { paper: light, ink: dark, accent, sfxLine: line, sfxRim: line === dark ? light : dark,
    grey: mix(light, dark, 0.6), onAccent: line };
}

// A dot screen on its own canvas: dots on a 45° lattice of pitch `cell`, each dot's area following cover(u, v) (0..1, u and v in 0..1).
export function tone(w, h, cell, cover, ink) {
  const cv = document.createElement('canvas'); cv.width = Math.ceil(w); cv.height = Math.ceil(h);
  const g = cv.getContext('2d'); g.fillStyle = ink;
  const half = cell / 2;
  for (let y = -cell, row = 0; y < h + cell; y += half, row++) {
    for (let x = (row % 2 ? half : 0) - cell; x < w + cell; x += cell) {
      const c = clamp(cover(clamp(x / w), clamp(y / h)));
      if (c <= 0.03) continue;
      const r = Math.min(half * 1.05, Math.sqrt((c * cell * half) / Math.PI));
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
    }
  }
  return cv;
}

// Focus lines: tapered ink spikes from far outside toward (cx, cy), each stopping at a rounded box of half-size (a, b) around it,
// so the middle stays clear paper for the words. Built once per scene.
export function focus(W, H, cx, cy, a, b, n, seed, ink) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), r = rng(seed); g.fillStyle = ink;
  const R = Math.hypot(W, H);
  for (let i = 0; i < n; i++) {
    const th = (i / n) * Math.PI * 2 + (r() - 0.5) * (Math.PI * 2 / n) * 1.6;
    const cs = Math.cos(th), sn = Math.sin(th);
    const inner = 1 / Math.pow(Math.pow(Math.abs(cs) / a, 4) + Math.pow(Math.abs(sn) / b, 4), 0.25);   // a super-ellipse: near a box
    const r0 = inner * (1.04 + r() * r() * 0.5), wd = 2 + r() * 9;
    const nx = -sn, ny = cs;
    g.beginPath(); g.moveTo(cx + cs * r0, cy + sn * r0);
    g.lineTo(cx + cs * R + nx * wd, cy + sn * R + ny * wd); g.lineTo(cx + cs * R - nx * wd, cy + sn * R - ny * wd); g.closePath(); g.fill();
  }
  return cv;
}

// Speed lines: long level ink hairlines of uneven length and weight, all one way, for a panel that is all motion.
export function speed(w, h, n, seed, ink) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d'), r = rng(seed); g.fillStyle = ink;
  for (let i = 0; i < n; i++) {
    const y = r() * h, len = w * (0.25 + r() * 0.7), fromRight = r() < 0.6, t = 1 + r() * 4;
    const x0 = fromRight ? w : 0, x1 = fromRight ? w - len : len;
    g.beginPath(); g.moveTo(x0, y - t / 2); g.lineTo(x0, y + t / 2); g.lineTo(x1, y); g.closePath(); g.fill();
  }
  return cv;
}

// Paper grain shared by every scene: a fine scatter of ink specks at very low strength, made once per ink.
const grains = new Map();
export function grain(W, H, ink) {
  if (grains.has(ink)) return grains.get(ink);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d'), r = rng(4711);
  for (let i = 0; i < 9000; i++) { g.fillStyle = rgba(ink, 0.05 + r() * 0.08); g.fillRect(r() * W, r() * H, 1 + r() * 1.5, 1 + r() * 1.5); }
  grains.set(ink, cv); return cv;
}

// Panels: a page cut by gutters that run across it with a slight slant. cuts: [{ y, slope }] (slope in px per px). Returns the
// panels as four-point polygons, top to bottom, each starting at its reading-side (right) top corner, with page margin m and gutter g.
export function page(W, H, cuts, m = 34, g = 26) {
  const yAt = (c, x) => c.y + c.slope * (x - W / 2);
  const edges = [{ y: m - g / 2, slope: 0 }, ...cuts, { y: H - m + g / 2, slope: 0 }];
  const out = [];
  for (let i = 0; i < edges.length - 1; i++) {
    const a = edges[i], b = edges[i + 1];
    out.push([[W - m, yAt(a, W - m) + g / 2], [m, yAt(a, m) + g / 2], [m, yAt(b, m) - g / 2], [W - m, yAt(b, W - m) - g / 2]]);
  }
  return out;
}
export const poly = (ctx, pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); };

// Inks a closed polygon's border along its length from its first corner, both ways round at once, meeting at the far corner.
export function border(ctx, pts, p, ink, w = 7) {
  p = clamp(p); if (p <= 0) return;
  ctx.save(); ctx.strokeStyle = ink; ctx.lineWidth = w; ctx.lineJoin = 'miter'; ctx.lineCap = 'square';
  if (p >= 1) { poly(ctx, pts); ctx.stroke(); ctx.restore(); return; }
  const seq = [...pts, pts[0]];
  let total = 0; for (let i = 0; i < seq.length - 1; i++) total += Math.hypot(seq[i + 1][0] - seq[i][0], seq[i + 1][1] - seq[i][1]);
  const walk = (order) => {
    let left = (total / 2) * p; ctx.beginPath(); ctx.moveTo(...order[0]);
    for (let i = 0; i < order.length - 1 && left > 0; i++) {
      const [x0, y0] = order[i], [x1, y1] = order[i + 1], l = Math.hypot(x1 - x0, y1 - y0), q = Math.min(1, left / l);
      ctx.lineTo(x0 + (x1 - x0) * q, y0 + (y1 - y0) * q); left -= l;
    }
    ctx.stroke();
  };
  walk(seq); walk([...seq].reverse());
  ctx.restore();
}

// A panel: its contents clipped inside it (draw), then its border inked by p.
export function panel(ctx, pts, p, ink, draw) {
  if (p <= 0) return;
  if (draw) { ctx.save(); poly(ctx, pts); ctx.clip(); draw(); ctx.restore(); }
  border(ctx, pts, p, ink);
}

// A narration box: paper, a firm ink border.
export function box(ctx, x, y, w, h, P, bw = 5) {
  ctx.fillStyle = P.paper; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = P.ink; ctx.lineWidth = bw; ctx.lineJoin = 'miter'; ctx.strokeRect(x, y, w, h);
}

// A stamp: something lands a touch too big and settles in a tenth of a second. Call inside a save (drawText's `each` is one).
// Returns false before it lands.
export function stamp(ctx, p, cx, cy, over = 0.22) {
  if (p <= 0) return false;
  const s = 1 + over * (1 - SNAP(p));
  ctx.translate(cx, cy); ctx.scale(s, s); ctx.translate(-cx, -cy);
}

// The sound-effect lettering for a key word, inside kit.drawText's `each`: a paper rim, an ink outline, the spot colour inside.
export function sfx(c, w, box, size, P) {
  c.lineJoin = 'round'; c.direction = w.arabic ? 'rtl' : 'ltr'; c.textAlign = w.arabic ? 'right' : 'left';
  const x = w.arabic ? box.x + box.width : box.x, dx = size * 0.06, dy = size * 0.07;
  c.strokeStyle = P.sfxRim; c.lineWidth = size * 0.32; c.strokeText(w.w, x, box.y); c.strokeText(w.w, x + dx, box.y + dy);
  c.fillStyle = P.sfxLine; c.strokeStyle = P.sfxLine; c.lineWidth = size * 0.16;
  c.strokeText(w.w, x + dx, box.y + dy); c.fillText(w.w, x + dx, box.y + dy);              // a solid drop under the letters
  c.strokeText(w.w, x, box.y);
  return P.accent;
}

// The same for a number drawn with kit.number: copies around a ring make the rim and the outline, then the fill.
export function sfxNumber(kit, ctx, str, o, P) {
  const ring = (r, color) => { for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2;
    kit.number(ctx, str, { ...o, x: o.x + Math.cos(a) * r, y: o.y + Math.sin(a) * r, color, decor: true }); } };
  ring(o.size * 0.075, P.sfxRim); ring(o.size * 0.04, P.sfxLine); ring(o.size * 0.02, P.sfxLine);
  kit.number(ctx, str, { ...o, color: P.accent });
}

// A brush slash: a tapered ink stroke from (x0, y0) to (x1, y1), drawn along its length by p.
export function slash(ctx, x0, y0, x1, y1, wd, p, ink) {
  p = clamp(p); if (p <= 0) return;
  const xe = x0 + (x1 - x0) * p, ye = y0 + (y1 - y0) * p, l = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / l, ny = (x1 - x0) / l;
  const mx = (x0 + xe) / 2, my = (y0 + ye) / 2, wm = wd * Math.min(1, p * 1.5);
  ctx.fillStyle = ink; ctx.beginPath(); ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(mx + nx * wm, my + ny * wm, xe, ye); ctx.quadraticCurveTo(mx - nx * wm * 0.5, my - ny * wm * 0.5, x0, y0); ctx.fill();
}

// The slow camera over the page while a panel holds: a drift down the paper and a small push in, both eased over the scene.
export function camera(ctx, W, H, p) {
  const q = IO(p), s = 1 + 0.018 * q;
  ctx.translate(W / 2, H / 2 - 10 * q); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2);
}

// Wrapped text with even rows: once a text needs two rows or more, its box is narrowed (same size) for as long as the row count
// holds, so a long line never leaves one word alone on its last row.
export function balanced(kit, text, o) {
  const f = kit.fit(text, o);
  if (f.rows.length < 2) return f;
  let best = f;
  for (let w = o.maxW - 12; w > o.maxW * 0.4; w -= 12) {
    let g; try { g = kit.fit(text, { ...o, size: f.size, minScale: 1, minPx: 0, maxW: w }); } catch { break; }
    if (g.rows.length !== f.rows.length || g.size !== f.size) break;
    best = g;
  }
  return best;
}
