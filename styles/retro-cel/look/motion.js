// Retro-cel motion and shared drawing: a hand-painted cel cartoon of the late eighties, played back from videotape.
// Three layers make the look: a painted night plate (airbrushed sky, a low sun, a city with lit windows), flat cels on top of it (shapes
// and lettering with a coloured outline and one hard-edged shadow band, no gradients inside), and the tape (scanlines, a soft colour
// fringe, a dark rim). Animation is held: everything that moves is drawn twelve times a second (`held`), and arrives sliding in on a
// few drawings with speed streaks behind it. Light shines through the cel: the key word glows from behind and catches a star glint.
import { clamp, ease, mix, contrast, rgba, rng } from '/engine/kit.js';

export const E = ease.outCubic;
export const IO = ease.inOutCubic;
export const FPS = 12;
// Time on the drawings: a held frame lasts 1/12 s.
export const held = (t, fps = FPS) => Math.floor(t * fps + 1e-6) / fps;

// Colours: the darker brand colour is the night, the lighter one the light of the cels, the accent the colour that glows.
export function palette(brand) {
  const { bg, text, accent } = brand.colors;
  const light = contrast(bg, '#000000') >= contrast(text, '#000000') ? bg : text, night = light === bg ? text : bg;
  const glows = contrast(accent, night) >= 4.5;                      // an accent that reads on the night can be a fill; else it is tinted up
  const key = glows ? accent : light, halo = glows ? accent : mix(accent, light, 0.3);
  return {
    night, light, accent, key, halo, glows,
    line: mix(night, '#000000', 0.35),                              // the cel outline: the night, deepened
    shade: mix(light, accent, 0.32), keyShade: glows ? mix(accent, night, 0.28) : mix(light, accent, 0.32),
    sky0: mix(night, '#000000', 0.25), sky1: mix(night, accent, 0.32), sky2: mix(mix(night, accent, 0.6), light, 0.25),
    sun: mix(accent, light, 0.45), city: mix(night, '#000000', 0.45), cityFar: mix(night, accent, 0.18),
    plate: rgba(mix(night, '#000000', 0.3), 0.78),
  };
}

// The painted plate, built once per palette and shared: wider than the frame so it can slide. Returns { color, glow } canvases.
const plates = new Map();
export function plate(W, H, P, seed = 85) {
  const id = P.night + P.accent + P.light + seed;
  if (plates.has(id)) return plates.get(id);
  const PW = W + 240, r = rng(seed);
  const color = document.createElement('canvas'); color.width = PW; color.height = H;
  const glow = document.createElement('canvas'); glow.width = PW; glow.height = H;
  const g = color.getContext('2d'), e = glow.getContext('2d');
  const hz = 1480;                                                  // the horizon, under the safe area
  let gr = g.createLinearGradient(0, 0, 0, hz);
  gr.addColorStop(0, P.sky0); gr.addColorStop(0.55, P.sky1); gr.addColorStop(1, P.sky2);
  g.fillStyle = gr; g.fillRect(0, 0, PW, H);
  for (let i = 0; i < 160; i++) { g.fillStyle = rgba(P.light, 0.25 + r() * 0.5); const s = r() < 0.9 ? 1.5 : 2.5; g.fillRect(r() * PW, r() * hz * 0.6, s, s); }
  // the low sun, airbrushed: a soft halo, then the disc, then bands of cloud across it
  const sx = PW * 0.62, sy = hz - 40, sr = 250;
  gr = g.createRadialGradient(sx, sy, sr * 0.6, sx, sy, sr * 2.6); gr.addColorStop(0, rgba(P.sun, 0.55)); gr.addColorStop(1, rgba(P.sun, 0));
  g.fillStyle = gr; g.fillRect(0, 0, PW, H);
  gr = g.createLinearGradient(0, sy - sr, 0, sy + sr); gr.addColorStop(0, mix(P.sun, P.light, 0.5)); gr.addColorStop(1, P.accent);
  g.fillStyle = gr; g.beginPath(); g.arc(sx, sy, sr, 0, Math.PI * 2); g.fill();
  // airbrushed clouds: long soft bands with lit undersides
  g.save(); g.filter = 'blur(14px)';
  for (let i = 0; i < 9; i++) {
    const cy = 300 + r() * 1100, cx = r() * PW, w = 300 + r() * 500, h = 26 + r() * 40;
    g.fillStyle = rgba(P.sky0, 0.55); g.beginPath(); g.ellipse(cx, cy, w, h, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = rgba(P.sun, 0.35); g.beginPath(); g.ellipse(cx + 20, cy + h * 0.6, w * 0.8, h * 0.35, 0, 0, Math.PI * 2); g.fill();
  }
  g.restore();
  // the city: a far row and a near row of blocks, the near one with lit windows (on the glow plate too)
  const city = (base, col, hMin, hMax, lit) => {
    let x = -20;
    while (x < PW) {
      const w = 50 + r() * 110, h = hMin + r() * (hMax - hMin);
      g.fillStyle = col; g.fillRect(x, base - h, w, h + H);
      if (r() < 0.25) g.fillRect(x + w * 0.45, base - h - 40, 4, 40);
      if (lit) for (let wy = base - h + 16; wy < base - 12; wy += 22) for (let wx = x + 10; wx < x + w - 14; wx += 18) {
        if (r() < 0.32) { const c = r() < 0.35 ? P.accent : P.light; g.fillStyle = c; g.fillRect(wx, wy, 8, 11); e.fillStyle = c; e.fillRect(wx - 3, wy - 3, 14, 17); g.fillStyle = col; }
      }
      x += w + r() * 8;
    }
  };
  city(hz + 10, P.cityFar, 120, 320, false);
  city(hz + 70, P.city, 60, 230, true);
  // the wet street: the lit windows again, streaked down
  g.fillStyle = P.city; g.fillRect(0, hz + 70, PW, H);
  const wet = document.createElement('canvas'); wet.width = PW; wet.height = H; const wg = wet.getContext('2d');
  for (let i = 0; i < 70; i++) { const c = r() < 0.4 ? P.accent : P.light, x = r() * PW, y = hz + 90 + r() * 240;
    wg.fillStyle = rgba(c, 0.2 + r() * 0.25); wg.fillRect(x, y, 4 + r() * 8, 30 + r() * 90); }
  g.save(); g.filter = 'blur(4px)'; g.drawImage(wet, 0, 0); g.restore();
  g.fillStyle = rgba(P.sky1, 0.25); for (let y = hz + 100; y < H; y += 18) g.fillRect(0, y, PW, 2);     // ripple bands on the wet street
  const blur = document.createElement('canvas'); blur.width = PW; blur.height = H;
  const b = blur.getContext('2d'); b.filter = 'blur(10px)'; b.drawImage(glow, 0, 0); b.filter = 'blur(3px)'; b.drawImage(glow, 0, 0);
  const out = { color, glow: blur, PW };
  plates.set(id, out); return out;
}

// The tape: scanlines and a dark rim, once; and four grains of tape noise picked by the drawing.
const tapes = new Map();
export function tape(W, H, P) {
  if (tapes.has(P.night)) return tapes.get(P.night);
  const lines = document.createElement('canvas'); lines.width = W; lines.height = H;
  const g = lines.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,0.16)'; for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1.5);
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)');
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  const noise = [0, 1, 2, 3].map((k) => {
    const c = document.createElement('canvas'); c.width = W / 4; c.height = H / 4;
    const n = c.getContext('2d'), r = rng(700 + k);
    for (let i = 0; i < 2600; i++) { n.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)'; n.fillRect(r() * c.width, r() * c.height, 1 + r() * 3, 1); }
    return c;
  });
  const out = { lines, noise }; tapes.set(P.night, out); return out;
}
export function playback(ctx, W, H, P, t) {
  const tp = tape(W, H, P), k = Math.floor(t * 24) % 4;
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(tp.noise[(k + 4) % 4], 0, 0, W, H); ctx.restore();
  ctx.drawImage(tp.lines, 0, 0);
}

// A slide-in on the drawings: p (0..1, already on held time) -> horizontal offset from the reading side. Returns { dx, streak }.
export function slide(p, reach, rtl) {
  const q = E(clamp(p)), dx = (1 - q) * reach * (rtl ? 1 : -1);
  return { dx, streak: p > 0 && p < 1 };
}

// Cel lettering. Draws a fitted text in three passes: a fringe of the accent just off it (the tape's colour bleed), the cel itself
// (outline, flat fill; the key words backlit: a glow of the accent behind them), and a hard shadow band across the lower part of each
// word. o: { x0, x1, y, align, P, at(w, i) -> progress 0..1 on held time or false, rtl, glint }
export function cel(kit, ctx, f, o) {
  const { P } = o, size = f.size, reach = size * 2.6;
  const move = (w, i, b, c) => {
    const p = o.at ? o.at(w, i, b) : 1;
    if (p === false || p <= 0) return false;
    const s = slide(p, reach, o.rtl); c.translate(s.dx, 0);
    return s;
  };
  const strokeWord = (c, w, b, color, width) => {
    c.lineJoin = 'round'; c.direction = w.arabic ? 'rtl' : 'ltr'; c.textAlign = w.arabic ? 'right' : 'left';
    c.strokeStyle = color; c.lineWidth = width; c.strokeText(w.w, w.arabic ? b.x + b.width : b.x, b.y);
  };
  // the colour fringe
  kit.drawText(ctx, f, { x0: o.x0 - 5, x1: o.x1 - 5, y: o.y + 2, align: o.align, decor: true, color: rgba(P.accent, 0.45), key: rgba(P.accent, 0.45),
    each: (w, i, b, c) => { if (move(w, i, b, c) === false) return false; } });
  // the cel: streaks, glow, outline, fill
  kit.drawText(ctx, f, { x0: o.x0, x1: o.x1, y: o.y, align: o.align, color: P.light, key: P.key,
    each: (w, i, b, c) => {
      const s = move(w, i, b, c); if (s === false) return false;
      if (s.streak) {                                                // speed streaks trail the word on its way in
        c.save(); c.fillStyle = rgba(P.light, 0.5);
        const len = Math.abs(s.dx) + b.width * 0.4, x = o.rtl ? b.x + b.width * 0.6 : b.x + b.width * 0.4 - len;
        for (const k of [-0.28, 0, 0.26]) c.fillRect(x, b.y + size * k, len, size * 0.05);
        c.restore();
      }
      if (w.key && o.onKey) o.onKey(b, s.dx);
      if (w.key && !P.glows) {                                        // an accent too dark to glow becomes a lit cel plate behind the word
        c.save(); c.shadowColor = P.halo; c.shadowBlur = size * 0.4; c.fillStyle = P.accent; const k = size * 0.18;
        c.beginPath(); c.moveTo(b.x - k + k, b.y - size * 0.62); c.lineTo(b.x + b.width + k * 2, b.y - size * 0.62); c.lineTo(b.x + b.width + k, b.y + size * 0.62); c.lineTo(b.x - k * 1.5, b.y + size * 0.62); c.closePath(); c.fill(); c.restore();
      }
      if (w.key && P.glows) { c.save(); c.shadowColor = P.halo; c.shadowBlur = size * 0.5; strokeWord(c, w, b, P.halo, size * 0.24); c.restore(); }
      strokeWord(c, w, b, P.line, size * 0.17);
    } });
  // the hard shadow band: the lower part of every word again in the shade colour
  kit.drawText(ctx, f, { x0: o.x0, x1: o.x1, y: o.y, align: o.align, decor: true, color: P.shade, key: P.keyShade,
    each: (w, i, b, c) => {
      if (move(w, i, b, c) === false) return false;
      c.beginPath(); c.moveTo(b.x - 20, b.y + size * 0.16); c.lineTo(b.x + b.width + 20, b.y + size * 0.02); c.lineTo(b.x + b.width + 20, b.y + size); c.lineTo(b.x - 20, b.y + size); c.clip();
    } });
}

// A four-point star glint: light catching the cel. p: 0..1 of its life (grows, turns a little, shrinks).
export function glint(ctx, x, y, r, p, color) {
  if (p <= 0 || p >= 1) return;
  const s = Math.sin(Math.PI * p) * r, a = p * 0.6;
  ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = color; ctx.beginPath();
  for (let i = 0; i < 8; i++) { const rr = i % 2 ? s * 0.16 : s, th = (i / 8) * Math.PI * 2; ctx.lineTo(Math.cos(th) * rr, Math.sin(th) * rr); }
  ctx.closePath(); ctx.shadowColor = color; ctx.shadowBlur = 18; ctx.fill(); ctx.restore();
}

// A plate under words: a flat dark cel with slanted ends and a thin accent rule along its top and bottom edges.
export function bar(ctx, x, y, w, h, P, p = 1) {
  if (p <= 0) return;
  const sl = h * 0.35, ww = w * E(p);
  ctx.save(); ctx.fillStyle = P.plate; ctx.beginPath();
  ctx.moveTo(x + w - ww + sl, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w - sl, y + h); ctx.lineTo(x + w - ww, y + h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = P.accent; ctx.fillRect(x + w - ww + sl, y - 3, ww - sl, 3); ctx.fillRect(x + w - ww, y + h, ww - sl, 3);
  ctx.restore();
}

// Wrapped text with even rows (narrowed at the same size while the row count holds).
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
