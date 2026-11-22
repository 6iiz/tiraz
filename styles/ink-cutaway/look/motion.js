// Ink Cutaway: a technical drawing in ink on paper. The object is a cylinder seen a little from the side, drawn with a hierarchy of
// line weights (silhouette heaviest, edges medium, small parts thin and grey), light grey values only to separate planes, a section
// window cut into its upper front with 45-degree hatching on the cut faces, and one accent line: the path that runs through it.
// Hidden things are dashed, visible things are solid. Everything here is plain canvas strokes; nothing is cached per frame.
import { clamp, mix, contrast } from '/engine/kit.js';

export const E = (p) => { p = clamp(p); return p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2; };
export const soft = (p) => 1 - (1 - clamp(p)) ** 3;

// Paper is the brand's lighter colour, ink the darker one. The path is the accent, darkened only as far as it takes to show on
// paper; a key word takes the same hue, darkened until it reads as text.
export function palette(brand) {
  const c = brand.colors, lum = (h) => contrast(h, '#000000');
  const ink = lum(c.bg) <= lum(c.text) ? c.bg : c.text, paper = ink === c.bg ? c.text : c.bg;
  const toward = (min) => { let k = c.accent; for (let i = 0.1; contrast(k, paper) < min && i <= 1.001; i += 0.1) k = mix(c.accent, ink, i); return k; };
  return {
    ink, paper, accent: c.accent, path: toward(3), key: toward(4.5),
    grey: mix(ink, paper, 0.4), thin: mix(ink, paper, 0.55), faint: mix(paper, ink, 0.07),
    tone1: mix(paper, ink, 0.05), tone2: mix(paper, ink, 0.13), tone3: mix(paper, ink, 0.24),
  };
}

export function boxes(kit, f, x0, x1, y, align = 'start') {
  const out = [];
  f.rows.forEach((row, r) => {
    const yy = y + r * f.lead, atStart = kit.rtl ? x1 - row.width : x0, atEnd = kit.rtl ? x0 : x1 - row.width;
    const left = align === 'center' ? (x0 + x1 - row.width) / 2 : (align === 'start' ? atStart : atEnd);
    let cur = kit.rtl ? left + row.width : left;
    for (const w of row.words) { const wl = kit.rtl ? cur - w.width : cur; out.push({ x: wl, y: yy, width: w.width, row: r, key: w.key }); cur = kit.rtl ? wl - f.space : wl + w.width + f.space; }
  });
  return out;
}
export function keyRuns(bx) {
  const runs = []; let cur = null;
  bx.forEach((b, i) => {
    if (b.key && cur && cur.row === b.row && cur.last === i - 1) { cur.x0 = Math.min(cur.x0, b.x); cur.x1 = Math.max(cur.x1, b.x + b.width); cur.last = i; }
    else if (b.key) { cur = { x0: b.x, x1: b.x + b.width, y: b.y, row: b.row, first: i, last: i }; runs.push(cur); }
    else cur = null;
  });
  return runs;
}

// A word is inked from the reading side: a clip that opens across it. It is rubbed out the other way. false = nothing to draw.
export function inked(c, t, t0, dur, out0, out1, box, size, rtl) {
  const p = soft((t - t0) / dur); if (p <= 0) return false;
  const q = out1 > out0 ? E((t - out0) / (out1 - out0)) : 0; if (q >= 1) return false;
  const pad = 10, x0 = box.x - pad, w = box.width + pad * 2;
  let a = 0, b = w * p;                      // the inked span, measured from the reading side
  if (q > 0) a = w * q;
  c.beginPath();
  if (rtl) c.rect(x0 + w - b, box.y - size, b - a, size * 2); else c.rect(x0 + a, box.y - size, b - a, size * 2);
  c.clip();
}

// Plain drafting marks.
export function arrowHead(ctx, x, y, ang, s, color) {
  ctx.save(); ctx.fillStyle = color; ctx.translate(x, y); ctx.rotate(ang);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-s, -s * 0.36); ctx.lineTo(-s, s * 0.36); ctx.closePath(); ctx.fill(); ctx.restore();
}
// A polyline drawn along its length to p. Returns the point reached and the heading there.
export function stroke(ctx, pts, p, { color, width = 2, dash = null, offset = 0 } = {}) {
  const segs = []; let total = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(l); total += l; }
  let left = total * clamp(p), end = pts[0], ang = 0;
  if (left <= 0) return null;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
  if (dash) { ctx.setLineDash(dash); ctx.lineDashOffset = offset; }
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length && left > 0; i++) {
    const k = Math.min(1, left / (segs[i - 1] || 1));
    end = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k];
    ang = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]);
    ctx.lineTo(end[0], end[1]); left -= segs[i - 1];
  }
  ctx.stroke(); ctx.restore();
  return { end, ang };
}
// Hatching at 45 degrees inside the current clip, over a box.
export function hatch(ctx, x0, y0, x1, y1, gap, color, width = 1.4) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath();
  for (let k = x0 - (y1 - y0); k < x1; k += gap) { ctx.moveTo(k, y1); ctx.lineTo(k + (y1 - y0), y0); }
  ctx.stroke(); ctx.restore();
}
// A numbered balloon with its leader: dot on the part, thin line, circle with the number in the mono face.
export function balloon(ctx, pal, mono, from, at, n, p) {
  if (p <= 0) return;
  const r = 24, d = Math.hypot(at[0] - from[0], at[1] - from[1]) || 1, ux = (at[0] - from[0]) / d, uy = (at[1] - from[1]) / d;
  const lp = clamp(p * 1.6), cp = clamp(p * 1.6 - 0.6);
  ctx.save();
  ctx.fillStyle = pal.ink; ctx.beginPath(); ctx.arc(from[0], from[1], 4.5, 0, Math.PI * 2); ctx.fill();
  stroke(ctx, [from, [at[0] - ux * r, at[1] - uy * r]], lp, { color: pal.ink, width: 1.6 });
  if (cp > 0) {
    ctx.strokeStyle = pal.ink; ctx.lineWidth = 2; ctx.fillStyle = pal.paper;
    ctx.beginPath(); ctx.arc(at[0], at[1], r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cp); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = clamp(cp * 3 - 2); ctx.fillStyle = pal.ink; ctx.font = `600 24px "${mono}"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
    ctx.fillText(String(n), at[0], at[1] + 1);
  }
  ctx.restore();
}
// A dimension: extension lines, a line with two arrowheads, drawn out from the middle by p.
export function dimension(ctx, pal, xa, xb, y, ya, yb, p) {
  if (p <= 0) return;
  ctx.save(); ctx.strokeStyle = pal.grey; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xa, y - 14); ctx.moveTo(xb, yb); ctx.lineTo(xb, y - 14); ctx.stroke();
  const m = (xa + xb) / 2, h = (xb - xa) / 2 * soft(p);
  ctx.strokeStyle = pal.ink; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(m - h, y); ctx.lineTo(m + h, y); ctx.stroke();
  if (p >= 1) { arrowHead(ctx, xa, y, Math.PI, 16, pal.ink); arrowHead(ctx, xb, y, 0, 16, pal.ink); }
  ctx.restore();
}

// ---------- the specimen: a cylinder with an inner tube, a coil and a through path ----------
// g: { cx, cy, L, R } in frame pixels. state: { draw 0..1 (pen wipe from the reading side), cut 0..1 (the section window opening),
// flow (seconds, moves the path's dashes), flowP 0..1 (how far the path has run), plug 0..1 (a plug in the tube; 1 solid, fades to
// dashed as it goes), rtl }
export function specimen(ctx, pal, g, s) {
  const { cx, cy, L, R } = g, e = 0.34, x0 = cx - L / 2, x1 = cx + L / 2, Ri = R - 20, r = R * 0.36, rx = R * e, low = cy + R * 0.28;
  const wa = x0 + L * 0.16, wbFull = x1 - L * 0.12;
  const wb = s.rtl ? wbFull : wa + (wbFull - wa) * s.cut, wa2 = s.rtl ? wbFull - (wbFull - wa) * s.cut : wa;
  ctx.save();
  // the pen: everything is revealed by a wipe from the reading side
  if (s.draw < 1) { const w = (L + 400) * soft(s.draw); ctx.beginPath(); if (s.rtl) ctx.rect(x1 + 200 - w, cy - R - 200, w, 2 * R + 400); else ctx.rect(x0 - 200, cy - R - 200, w, 2 * R + 400); ctx.clip(); }
  const body = new Path2D();
  body.moveTo(x0, cy - R); body.lineTo(x1, cy - R); body.ellipse(x1, cy, rx, R, 0, -Math.PI / 2, Math.PI / 2); body.lineTo(x0, cy + R); body.ellipse(x0, cy, rx, R, 0, Math.PI / 2, Math.PI * 1.5); body.closePath();
  // inlet pipe, hidden end first
  ctx.fillStyle = pal.tone1; ctx.strokeStyle = pal.ink; ctx.lineWidth = 2.6;
  ctx.beginPath(); ctx.rect(x0 - 120, cy - 30, 120, 60); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x0, cy - 30); ctx.lineTo(x0 - 120, cy - 30); ctx.moveTo(x0, cy + 30); ctx.lineTo(x0 - 120, cy + 30); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x0 - 120, cy, 30 * e, 30, 0, 0, Math.PI * 2); ctx.fillStyle = pal.paper; ctx.fill(); ctx.stroke();
  ctx.fillStyle = pal.tone1; ctx.fill(body);
  // surface tone: a few thin lines along the lower body
  ctx.save(); ctx.clip(body); ctx.strokeStyle = pal.tone3; ctx.lineWidth = 1.1; ctx.beginPath();
  for (const k of [0.5, 0.66, 0.78, 0.87, 0.94]) { ctx.moveTo(x0 - rx, cy + R * k); ctx.lineTo(x1, cy + R * k); }
  ctx.stroke(); ctx.restore();
  // hidden path inside the body: dashed accent
  ctx.save(); ctx.clip(body); stroke(ctx, [[x0 - 60, cy], [x1, cy]], s.flowP, { color: pal.path, width: 2, dash: [12, 9], offset: -s.flow * 40 }); ctx.restore();
  // the section window
  if (wb - wa2 > 2) {
    const win = new Path2D();
    win.moveTo(wa2, cy - R); win.lineTo(wb, cy - R); win.ellipse(wb, cy, rx, R, 0, -Math.PI / 2, Math.asin(0.28)); win.lineTo(wa2 + rx * Math.cos(Math.asin(0.28)), low); win.ellipse(wa2, cy, rx, R, 0, Math.asin(0.28), -Math.PI / 2, true); win.closePath();
    ctx.save(); ctx.clip(win);
    ctx.fillStyle = pal.tone2; ctx.fillRect(wa2 - rx, cy - R, wb - wa2 + rx * 2, R * 1.4);
    ctx.strokeStyle = pal.tone3; ctx.lineWidth = 1.2; ctx.beginPath();
    for (const k of [0.72, 0.58, 0.44]) { ctx.moveTo(wa2 - rx, cy - R * k); ctx.lineTo(wb + rx, cy - R * k); } ctx.stroke();
    // the coil behind the tube
    ctx.strokeStyle = pal.thin; ctx.lineWidth = 1.2;
    for (let x = wa + 10; x < wbFull; x += 36) { ctx.beginPath(); ctx.ellipse(x, cy, 9, r + 22, 0.22, Math.PI / 2, Math.PI * 1.5); ctx.stroke(); }
    // the tube
    ctx.fillStyle = pal.paper; ctx.fillRect(wa2 - rx, cy - r, wb - wa2 + 2 * rx, 2 * r);
    ctx.strokeStyle = pal.ink; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(wa2 - rx, cy - r); ctx.lineTo(wb + rx, cy - r); ctx.moveTo(wa2 - rx, cy + r); ctx.lineTo(wb + rx, cy + r); ctx.stroke();
    ctx.strokeStyle = pal.tone3; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(wa2 - rx, cy - r * 0.55); ctx.lineTo(wb + rx, cy - r * 0.55); ctx.stroke();
    // the plug, solid when in, dashed (hidden line) as it goes
    if (s.plug > 0) {
      const px = cx + L * 0.06, pw = 46;
      ctx.save(); ctx.globalAlpha = Math.min(1, s.plug * 1.4);
      if (s.plug >= 0.999) { ctx.save(); ctx.beginPath(); ctx.rect(px - pw / 2, cy - r, pw, 2 * r); ctx.clip(); ctx.fillStyle = pal.paper; ctx.fill(); hatch(ctx, px - pw / 2, cy - r, px + pw / 2, cy + r, 9, pal.ink, 1.6); ctx.restore(); }
      ctx.strokeStyle = pal.ink; ctx.lineWidth = 2.4; if (s.plug < 0.999) ctx.setLineDash([10, 7]);
      ctx.strokeRect(px - pw / 2, cy - r, pw, 2 * r); ctx.restore();
    }
    // the path, visible: a solid accent line with chevrons moving along it
    const fx1 = s.plug >= 0.999 ? cx + L * 0.06 - 30 : x1 + 30;
    const reach = x0 - 60 + (x1 + 30 - (x0 - 60)) * s.flowP, fe = Math.min(reach, fx1);
    if (fe > wa2 - rx) {
      ctx.strokeStyle = pal.path; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(wa2 - rx, cy); ctx.lineTo(fe, cy); ctx.stroke();
      for (let x = wa2 - rx + ((s.flow * 90) % 70); x < fe - 14; x += 70) arrowHead(ctx, x + 14, cy, 0, 14, pal.path);
      if (s.plug >= 0.999 && reach >= fx1) { ctx.strokeStyle = pal.path; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx1 - 8, cy - 10); ctx.lineTo(fx1 + 8, cy + 10); ctx.moveTo(fx1 + 8, cy - 10); ctx.lineTo(fx1 - 8, cy + 10); ctx.stroke(); }
    }
    // the coil in front of the tube
    ctx.strokeStyle = pal.ink; ctx.lineWidth = 1.6;
    for (let x = wa + 10; x < wbFull; x += 36) { ctx.beginPath(); ctx.ellipse(x, cy, 9, r + 22, 0.22, -Math.PI / 2, Math.PI / 2); ctx.stroke(); }
    ctx.restore();
    // cut faces: the wall seen in section at both ends and along the floor of the window, hatched
    const face = (xc, dir) => {
      const f = new Path2D(), a1 = Math.asin(0.28);
      f.ellipse(xc, cy, rx, R, 0, -Math.PI / 2, a1); f.ellipse(xc, cy, rx * Ri / R, Ri, 0, a1, -Math.PI / 2, true); f.closePath();
      ctx.save(); ctx.fillStyle = pal.paper; ctx.fill(f); ctx.clip(f); hatch(ctx, xc - rx, cy - R, xc + rx + 10, low, 10, pal.ink, 1.3); ctx.restore();
      ctx.strokeStyle = pal.ink; ctx.lineWidth = 2.2; ctx.stroke(f);
    };
    face(wa2, -1); face(wb, 1);
    const fl = new Path2D(); fl.rect(wa2 + rx * 0.96, low - 1, wb - wa2, 12);
    ctx.save(); ctx.fillStyle = pal.paper; ctx.fill(fl); ctx.clip(fl); hatch(ctx, wa2, low - 2, wb + rx, low + 12, 10, pal.ink, 1.3); ctx.restore();
    ctx.strokeStyle = pal.ink; ctx.lineWidth = 2.2; ctx.stroke(fl);
  }
  // the end face and the outlet
  ctx.fillStyle = pal.tone1; ctx.strokeStyle = pal.ink; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.ellipse(x1, cy, rx, R, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 1.2; ctx.strokeStyle = pal.grey; ctx.beginPath(); ctx.ellipse(x1, cy, rx * Ri / R, Ri, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = pal.tone1; ctx.beginPath(); ctx.rect(x1, cy - 30, 110, 60); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x1, cy, 30 * e, 30, 0, 0, Math.PI * 2); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
  ctx.lineWidth = 2.6; ctx.strokeStyle = pal.ink; ctx.beginPath(); ctx.moveTo(x1, cy - 30); ctx.lineTo(x1 + 110, cy - 30); ctx.moveTo(x1, cy + 30); ctx.lineTo(x1 + 110, cy + 30); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x1 + 110, cy, 30 * e, 30, 0, 0, Math.PI * 2); ctx.fillStyle = pal.paper; ctx.fill(); ctx.stroke();
  // the silhouette, heaviest line
  ctx.lineWidth = 4.2; ctx.strokeStyle = pal.ink; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x1, cy - R); ctx.lineTo(x0, cy - R); ctx.ellipse(x0, cy, rx, R, 0, -Math.PI / 2, -Math.PI * 1.5, true); ctx.lineTo(x1, cy + R); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x1, cy, rx, R, 0, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  // the outlet's own path stub
  if (s.flowP >= 0.999 && s.plug < 0.999) stroke(ctx, [[x1, cy], [x1 + 110, cy]], 1, { color: pal.path, width: 6 });
  ctx.restore();
  // the cutting plane: a chain line crossing while the window opens
  if (s.cut > 0 && s.cut < 1) {
    const xp = s.rtl ? wa2 : wb;
    ctx.save(); ctx.strokeStyle = pal.ink; ctx.lineWidth = 1.6; ctx.setLineDash([34, 7, 4, 7]);
    ctx.beginPath(); ctx.moveTo(xp, cy - R - 70); ctx.lineTo(xp, cy + R + 70); ctx.stroke(); ctx.setLineDash([]);
    ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(xp, cy - R - 70); ctx.lineTo(xp, cy - R - 50); ctx.moveTo(xp, cy + R + 50); ctx.lineTo(xp, cy + R + 70); ctx.stroke();
    const dir = s.rtl ? Math.PI : 0;
    arrowHead(ctx, xp + Math.cos(dir) * 30, cy - R - 70, dir, 16, pal.ink); arrowHead(ctx, xp + Math.cos(dir) * 30, cy + R + 70, dir, 16, pal.ink);
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xp, cy - R - 70); ctx.lineTo(xp + Math.cos(dir) * 18, cy - R - 70); ctx.moveTo(xp, cy + R + 70); ctx.lineTo(xp + Math.cos(dir) * 18, cy + R + 70); ctx.stroke();
    ctx.restore();
  }
  // points where labels hang: the shell, the tube, the coil, the path, the end face
  return { shell: [x0 + L * 0.08, cy + R * 0.6], tube: [cx - L * 0.12, cy - r * 0.6], coil: [wa + 46, cy - r - 20], path: [cx + L * 0.2, cy], end: [x1, cy + R * 0.55],
    outlet: [x1 + 110 + 30 * e, cy], box: [x0 - 120, cy - R, x1 + 120, cy + R] };
}

// The route the accent path takes from the outlet down to a key run under the text: out to the margin, down, then along under the
// run (dashed where it passes under other words, solid and heavy under the key run, with an arrowhead at its end).
export function pathToKey(ctx, pal, out, run, size, p, rtl, margin) {
  if (!run || p <= 0) return;
  const yu = run.y + size * 0.7, xm = margin, xe = rtl ? run.x0 - 4 : run.x1 + 4, xs = rtl ? run.x1 + 8 : run.x0 - 8;
  const pts = [out, [xm, out[1]], [xm, yu], [xs, yu]];
  const tot = pts.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0), under = Math.abs(xe - xs);
  const a = clamp(p * (tot + under) / tot), b = clamp((p * (tot + under) - tot) / under);
  stroke(ctx, pts, a, { color: pal.path, width: 2.4, dash: [12, 8] });
  if (b > 0) {
    const x = xs + (xe - xs) * soft(b);
    ctx.save(); ctx.strokeStyle = pal.path; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(xs, yu); ctx.lineTo(x, yu); ctx.stroke(); ctx.restore();
    arrowHead(ctx, x + (rtl ? -10 : 10), yu, rtl ? Math.PI : 0, 20, pal.path);
  }
}
