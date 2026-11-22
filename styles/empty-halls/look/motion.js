// Empty Halls: a home-video tape walking slowly down an empty office corridor that never ends. A drop ceiling with light panels every
// few steps, a carpet, doorways that open onto darkness, and a far end lost in the dark. Quiet, a little wrong, never threatening.
// The medium tells the story: words come into focus the way a camcorder hunts for it, the key phrase is held by the focus brackets,
// and scenes change the way a tape skips.
import { clamp, mix, rgba, contrast, rng } from '/engine/kit.js';

export const soft = (p) => 1 - (1 - clamp(p)) ** 3;
export const accel = (p) => clamp(p) ** 2.4;

export function palette(brand) {
  const c = brand.colors, lum = (h) => contrast(h, '#000000');
  const light = lum(c.bg) >= lum(c.text) ? c.bg : c.text, dark = light === c.bg ? c.text : c.bg, acc = c.accent;
  const deep = mix(dark, '#000000', 0.35);                                 // the dark at the end of the hall (a neutral shade of the brand's dark)
  const fluo = mix(light, acc, 0.1);                                        // the light of the panels: the brand's light, a little tinted
  return {
    light, dark, acc, deep, fluo,
    onAcc: contrast(light, acc) >= contrast(dark, acc) ? light : dark,
    wall: mix(fluo, dark, 0.42), wallLo: mix(fluo, dark, 0.58), ceil: mix(fluo, dark, 0.32), floor: mix(mix(dark, acc, 0.18), light, 0.22),
    door: mix(deep, dark, 0.4), text: light, dim: mix(light, dark, 0.16), grey: mix(light, dark, 0.3),
  };
}

// ---- the hall: one-point perspective, drawn from far to near
const X = 1.3, FLOOR = -1.15, CEIL = 0.95, L = 1.6, F = 600;
export function hall(P, W, H, { vy = 700 } = {}) {
  const hash = (g, s) => { const r = rng((g * 7919 + s * 104729) >>> 0); r(); return r(); };
  return {
    // time: reel seconds; speed: hall units per second; extra: extra distance travelled (the ending walks faster)
    draw(ctx, time, { speed = 0.42, extra = 0 } = {}) {
      const camZ = time * speed + extra, sway = 7 * Math.sin(time * 0.63) + 3 * Math.sin(time * 1.71 + 1), bob = 4 * Math.sin(time * 1.9) + 2 * Math.sin(time * 0.77);
      const cx = W / 2 + sway, cy = vy + bob;
      const px = (x, z) => cx + x * F / z, py = (y, z) => cy - y * F / z;
      const fog = (col, z) => mix(col, P.deep, clamp(1 - Math.exp(-z / 5.5)));
      ctx.fillStyle = P.deep; ctx.fillRect(0, 0, W, H);
      const quad = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); ctx.fill(); };
      const gFar = Math.floor((camZ + 34) / L), gNear = Math.floor((camZ + 0.3) / L);
      for (let g = gFar; g >= gNear; g--) {
        const a = Math.max(0.3, g * L - camZ), b = Math.max(0.3, (g + 1) * L - camZ); if (b <= a) continue;
        const zm = (a + b) / 2, lit = hash(g, 3) < 0.08 ? 0.55 : 1;              // a few stretches with a dead panel
        const wl = fog(mix(P.wall, P.deep, 1 - lit), zm), fl = fog(P.floor, zm), ce = fog(P.ceil, zm);
        quad([[px(-X, a), py(FLOOR, a)], [px(X, a), py(FLOOR, a)], [px(X, b), py(FLOOR, b)], [px(-X, b), py(FLOOR, b)]], fl);
        quad([[px(-X, a), py(CEIL, a)], [px(X, a), py(CEIL, a)], [px(X, b), py(CEIL, b)], [px(-X, b), py(CEIL, b)]], ce);
        for (const s of [-1, 1]) {
          quad([[px(s * X, a), py(CEIL, a)], [px(s * X, b), py(CEIL, b)], [px(s * X, b), py(FLOOR, b)], [px(s * X, a), py(FLOOR, a)]], wl);
          quad([[px(s * X, a), py(FLOOR + 0.12, a)], [px(s * X, b), py(FLOOR + 0.12, b)], [px(s * X, b), py(FLOOR, b)], [px(s * X, a), py(FLOOR, a)]], fog(P.wallLo, zm));
          if (hash(g, s + 5) < 0.3) {                                        // a doorway onto the dark
            const d0 = a + (b - a) * 0.25, d1 = a + (b - a) * 0.75;
            if (d0 > 0.3) quad([[px(s * X, d0), py(0.45, d0)], [px(s * X, d1), py(0.45, d1)], [px(s * X, d1), py(FLOOR, d1)], [px(s * X, d0), py(FLOOR, d0)]], fog(P.door, zm));
          }
          ctx.strokeStyle = fog(P.wallLo, a); ctx.lineWidth = Math.max(1, 3 / a);   // the seam at the start of the stretch
          ctx.beginPath(); ctx.moveTo(px(s * X, a), py(CEIL, a)); ctx.lineTo(px(s * X, a), py(FLOOR, a)); ctx.stroke();
        }
        // the light panel in the ceiling of this stretch
        const p0 = a + (b - a) * 0.2, p1 = a + (b - a) * 0.75;
        if (p0 > 0.3) {
          const flick = hash(g, 9) < 0.06 ? 0.75 + 0.25 * Math.sin(time * 23 + g) : 1;
          quad([[px(-0.42, p0), py(CEIL, p0)], [px(0.42, p0), py(CEIL, p0)], [px(0.42, p1), py(CEIL, p1)], [px(-0.42, p1), py(CEIL, p1)]], fog(mix(P.ceil, P.fluo, lit * flick), (p0 + p1) / 2));
        }
      }
    },
  };
}

// ---- the tape: grain, scanlines and a vignette, built once; one tracking line that drifts up the frame now and then
export function tape(W, H, P, seed = 3) {
  const r = rng(seed), grains = [];
  for (let k = 0; k < 4; k++) {
    const cv = document.createElement('canvas'); cv.width = W / 4; cv.height = H / 4; const g = cv.getContext('2d'), im = g.createImageData(cv.width, cv.height);
    for (let i = 0; i < im.data.length; i += 4) { const v = r() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 6 + r() * 8; }
    g.putImageData(im, 0, 0); grains.push(cv);
  }
  const top = document.createElement('canvas'); top.width = W; top.height = H; const g = top.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 2);
  const vg = g.createRadialGradient(W / 2, H * 0.42, H * 0.25, W / 2, H * 0.45, H * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  return {
    draw(ctx, time) {
      ctx.save(); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(grains[Math.floor(time * 30) % 4], 0, 0, W, H); ctx.restore();
      ctx.drawImage(top, 0, 0);
      const cyc = (time % 7.3) / 7.3, y = H * (1.1 - cyc * 1.3);        // a faint tracking line drifting up, once every few seconds
      ctx.fillStyle = rgba(P.light, 0.05); ctx.fillRect(0, y, W, 10); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, y + 10, W, 4);
    },
  };
}

// ---- words: laid out as kit.drawText does, with room opened around a key phrase for its focus brackets
export const GAP = 0.34, PAD = 0.2;
export function boxes(kit, f, { x0, x1, y, align = 'center' }) {
  const out = []; let i = 0;
  f.rows.forEach((rw, r) => {
    const yy = y + r * f.lead, atStart = kit.rtl ? x1 - rw.width : x0, atEnd = kit.rtl ? x0 : x1 - rw.width;
    const left = align === 'center' ? (x0 + x1 - rw.width) / 2 : align === 'start' ? atStart : atEnd;
    let cur = kit.rtl ? left + rw.width : left, cum = 0, prev = null; const row = [];
    for (const w of rw.words) {
      if (prev !== null && prev !== !!w.key) cum += f.size * GAP;
      prev = !!w.key;
      const wl = kit.rtl ? cur - w.width : cur;
      row.push({ x: wl, y: yy, width: w.width, row: r, key: w.key, i: i++, off: kit.rtl ? -cum : cum });
      cur = kit.rtl ? wl - f.space : wl + w.width + f.space;
    }
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
export const keyRoom = (size) => size * 2 * GAP;

// The camcorder's focus brackets round a key phrase: four corners that close in from wide and lock, then breathe very slightly.
export function brackets(ctx, run, size, col, p, time) {
  if (p <= 0) return;
  const k = soft(p), w = 1 + 0.3 * (1 - k), br = 1.5 * Math.sin(time * 2.4);
  const cx = (run.x0 + run.x1) / 2, hw = ((run.x1 - run.x0) / 2 + size * PAD) * w + br, hh = size * 0.66 * w + br, arm = size * 0.3;
  ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = Math.max(4, size * 0.06); ctx.lineCap = 'square'; ctx.globalAlpha = Math.min(1, p * 3);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    const x = cx + sx * hw, y = run.y + sy * hh;
    ctx.beginPath(); ctx.moveTo(x - sx * arm, y); ctx.lineTo(x, y); ctx.lineTo(x, y - sy * arm); ctx.stroke();
  }
  ctx.restore();
}
// A soft pool of dark behind a block of text, so it reads over the lit ceiling at any moment.
export function shade(ctx, P, x0, x1, y0, y1, a = 0.86) {
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, rx = (x1 - x0) / 2 + 200, ry = (y1 - y0) / 2 + 190;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(rx / ry, 1);
  const g = ctx.createRadialGradient(0, 0, ry * 0.2, 0, 0, ry); g.addColorStop(0, rgba(P.deep, a)); g.addColorStop(0.55, rgba(P.deep, a * 0.9)); g.addColorStop(1, rgba(P.deep, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, ry, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
// Text that comes into focus: each row starts soft and a little large, the lens hunts once (sharp, soft again, sharp) and settles.
// when(r): the moment row r starts; out: 0..1 the tape drops it (it slides sideways in thin slices and is gone).
export function focusText(ctx, kit, f, { x0, x1, y, color, keyColor, P, when, out = 0, t, time, align = 'center', keyed = true, dur = 0.5, decor = false, marker = false }) {
  const bx = boxes(kit, f, { x0, x1, y, align });
  if (keyed) for (const run of keyRuns(bx)) {
    const k = clamp((t - when(run.row) - dur * 0.55) / 0.3) * (1 - accel(out));
    if (!marker) brackets(ctx, run, f.size, P.acc, k, time);
    else {                                                                  // a highlighter stroke on paper, drawn along the reading direction
      const pad = f.size * PAD, w = (run.x1 - run.x0 + 2 * pad) * soft(clamp((t - when(run.row) - dur * 0.3) / 0.3)), x = kit.rtl ? run.x1 + pad - w : run.x0 - pad;
      if (w > 0 && out < 1) { ctx.save(); ctx.fillStyle = P.acc; ctx.globalAlpha = 1 - accel(out); ctx.beginPath(); ctx.roundRect(x, run.y - f.size * 0.56, w, f.size * 1.12, 6); ctx.fill(); ctx.restore(); }
    }
  }
  kit.drawText(ctx, f, { x0, x1, y, align, color, key: keyColor ?? color, decor,
    each: (w, i, box, c) => {
      const p = clamp((t - when(box.row)) / dur); if (p <= 0 || out >= 1) return false;
      const b = bx[i], hunt = p < 0.55 ? 10 * (1 - p / 0.55) ** 1.4 : 2.2 * Math.sin(Math.PI * clamp((p - 0.55) / 0.45));
      const s = 1 + 0.035 * (1 - soft(p)), cx = b.x + b.width / 2;
      c.translate(keyed ? b.off : 0, 0);
      if (out > 0) { const j = Math.sin(box.row * 7.1 + i * 3.3) > 0 ? 1 : -1; c.translate(j * accel(out) * 140, 0); }
      c.translate(cx, b.y); c.scale(s, s); c.translate(-cx, -b.y);
      const blur = hunt + accel(out) * 6; if (blur > 0.25) c.filter = `blur(${blur.toFixed(2)}px)`;
      c.globalAlpha = Math.min(1, p * 3) * (1 - accel(out));
    } });
  return bx;
}
