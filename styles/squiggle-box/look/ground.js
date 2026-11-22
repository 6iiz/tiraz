// The squiggle-box ground: warm paper (the brand's lighter colour) and, in the top part of the frame, an organic window with a grainy
// edge that opens at the start of the reel. Inside it a little model town on a slab, seen from above at the isometric angle: flat
// Memphis fills from the brand's colours and their pastel mixes, a thick ink outline on every face, patterns on the walls (dots,
// stripes, zigzags, terrazzo flecks), hard shadows thrown to one side with a halftone of paper dots, a pond. It is alive in small
// ways: ripples and a boat on the pond, trees swaying, birds crossing, windows lighting one by one through the reel, a cloud's dotted
// shadow drifting over, and a slow camera creep. The static model is painted once; the small motions are drawn per frame.
// draw(ctx, t, { shut }) : shut 0..1 draws the window back into a small circle (the ending uses it).
import { rng, mix, rgba, clamp } from '/engine/kit.js';
import * as M from './motion.js';

export function create({ W, H, brand, look, clock = 0 }) {
  const P = M.palette(brand), F = look.tokens.frame, rtl = brand.dir !== 'ltr';
  const DW = 1000, DH = 720, s = 40, at = M.iso(430, 170, s);
  const cv = document.createElement('canvas'); cv.width = DW; cv.height = DH;
  const g = cv.getContext('2d'), r = rng(1981);
  // backdrop and confetti
  g.fillStyle = P.sky; g.fillRect(0, 0, DW, DH);
  for (let i = 0; i < 26; i++) {
    const x = r() * DW, y = r() * 240, k = Math.floor(r() * 5);
    M.mark(g, P, k, x, y, 14 + r() * 14, [P.pastel, P.accent, P.soft, P.paper][i % 4]);
  }
  const pattern = (pts, kind, color) => {
    g.save(); g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip();
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    g.fillStyle = color; g.strokeStyle = color; g.lineWidth = 3; g.lineCap = 'round';
    if (kind === 'dots') { for (let y = y0 + 6, j = 0; y < y1; y += 14, j++) for (let x = x0 + 6 + (j % 2) * 7; x < x1; x += 14) { g.beginPath(); g.arc(x, y, 2.6, 0, Math.PI * 2); g.fill(); } }
    if (kind === 'stripes') { for (let x = x0 - (y1 - y0); x < x1; x += 15) { g.beginPath(); g.moveTo(x, y1); g.lineTo(x + (y1 - y0), y0); g.stroke(); } }
    if (kind === 'zig') { for (let y = y0 + 8; y < y1 + 10; y += 18) { g.beginPath(); for (let x = x0 - 10, i = 0; x < x1 + 10; x += 9, i++) { const yy = y + (i % 2 ? -5 : 5); if (i) g.lineTo(x, yy); else g.moveTo(x, yy); } g.stroke(); } }
    if (kind === 'terrazzo') { for (let i = 0; i < (x1 - x0) * (y1 - y0) / 260; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0), k = 3 + r() * 4; g.fillStyle = [P.accent, P.ink, P.pastel, P.paper][i % 4]; g.beginPath(); g.moveTo(x, y - k); g.lineTo(x + k, y + k * 0.6); g.lineTo(x - k * 0.8, y + k * 0.4); g.closePath(); g.fill(); } }
    g.restore();
  };
  // the slab
  const top = mix(P.paper, P.pastel, 0.55), SX = 14, SY = 10;
  const slabTop = [at(0, 0), at(SX, 0), at(SX, SY), at(0, SY)];
  const slabL = [at(0, SY), at(SX, SY), at(SX, SY, -1.1), at(0, SY, -1.1)], slabR = [at(SX, 0), at(SX, SY), at(SX, SY, -1.1), at(SX, 0, -1.1)];
  M.poly(g, slabL, P.deep, P); pattern(slabL, 'stripes', P.face(P.deep, -0.25)); M.poly(g, slabL, null, P);
  M.poly(g, slabR, P.face(P.deep, -0.35), P);
  M.poly(g, slabTop, top, P); pattern(slabTop, 'terrazzo'); M.poly(g, slabTop, null, P);
  // the pond, and the path
  const pond = [at(8.3, 0.8), at(12.8, 0.8), at(12.8, 4.6), at(8.3, 4.6)];
  M.poly(g, pond, mix(P.accent, P.paper, 0.35), P, 4);
  g.save(); g.setLineDash([14, 12]); g.strokeStyle = P.ink; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath();
  for (let i = 0; i <= 30; i++) { const u = i / 30, [x, y] = at(5.4 + Math.sin(u * 7) * 0.5, SY - u * 4.6); if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); g.restore();
  // the blocks: [X, Y, w, d, h, base, left pattern, right pattern, top pattern]
  const boxes = [
    [2, 1, 3, 2.5, 3.4, P.pastel, null, 'stripes', 'dots'],
    [1, 5.4, 1.5, 1.6, 5.2, P.soft, 'terrazzo', null, null],
    [6, 6, 2.6, 2.6, 1.9, P.accent, 'zig', null, 'dots'],
    [10, 8.1, 3.2, 1.4, 0.8, P.paper, 'dots', 'stripes', null],
    [11, 6.2, 0.8, 0.8, 2.4, P.paper, null, null, null],
  ];
  // hard shadows first, all on the slab, thrown along +X
  for (const [X, Y, w, d, h] of boxes) {
    const sh = h * 0.55, pts = [at(X, Y), at(X + w + sh, Y), at(X + w + sh, Y + d), at(X, Y + d)];
    g.save(); g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip();
    g.fillStyle = mix(top, P.ink, 0.3); g.fillRect(0, 0, DW, DH);
    g.fillStyle = rgba(P.paper, 0.55); for (let y = 0, j = 0; y < DH; y += 10, j++) for (let x = (j % 2) * 5; x < DW; x += 10) { g.beginPath(); g.arc(x, y, 1.7, 0, Math.PI * 2); g.fill(); }
    g.restore();
  }
  const windows = [];
  boxes.slice().sort((a, b) => a[0] + a[1] + a[2] + a[3] - (b[0] + b[1] + b[2] + b[3])).forEach(([X, Y, w, d, h, base, lp, rp, tp], n) => {
    const L = [at(X, Y + d), at(X + w, Y + d), at(X + w, Y + d, h), at(X, Y + d, h)];
    const R = [at(X + w, Y), at(X + w, Y + d), at(X + w, Y + d, h), at(X + w, Y, h)];
    const Tp = [at(X, Y, h), at(X + w, Y, h), at(X + w, Y + d, h), at(X, Y + d, h)];
    M.poly(g, L, base, P); if (lp) pattern(L, lp, P.face(base, -0.45)); M.poly(g, L, null, P);
    M.poly(g, R, P.face(base, -0.3), P); if (rp) pattern(R, rp, P.face(base, -0.55)); M.poly(g, R, null, P);
    M.poly(g, Tp, P.face(base, 0.35), P); if (tp) pattern(Tp, tp, P.face(base, -0.3)); M.poly(g, Tp, null, P);
    // windows on the right face of the taller blocks
    if (h > 1.5 && w >= 0.8 && d >= 1.4) for (let zi = 0; zi < Math.floor(h / 1.2); zi++) for (let yi = 0; yi < Math.floor(d / 0.9); yi++) {
      const y0 = Y + 0.25 + yi * 0.9, z0 = 0.4 + zi * 1.2;
      windows.push({ pts: [at(X + w, y0, z0), at(X + w, y0 + 0.45, z0), at(X + w, y0 + 0.45, z0 + 0.6), at(X + w, y0, z0 + 0.6)], dark: P.face(base, -0.6), on: 0.6 + windows.length * 1.9 + r() * 0.8 });
    }
  });
  // the ball on the column
  { const [bx, by] = at(11.4, 6.6, 2.4 + 0.75); g.fillStyle = P.accent; g.beginPath(); g.arc(bx, by, 30, 0, Math.PI * 2); g.fill();
    g.save(); g.clip(); g.fillStyle = P.face(P.accent, -0.35); g.beginPath(); g.arc(bx - 14, by - 12, 36, 0, Math.PI * 2); g.rect(bx + 40, by - 40, -80, 80); g.fill('evenodd'); g.restore();
    g.strokeStyle = P.ink; g.lineWidth = 3; g.beginPath(); g.arc(bx, by, 30, 0, Math.PI * 2); g.stroke(); }
  // a halftone sheet for the drifting cloud shadow
  const dots = document.createElement('canvas'); dots.width = DW; dots.height = DH; { const d = dots.getContext('2d'); d.fillStyle = P.ink;
    for (let y = 0, j = 0; y < DH; y += 11, j++) for (let x = (j % 2) * 5.5; x < DW; x += 11) { d.beginPath(); d.arc(x, y, 2.2, 0, Math.PI * 2); d.fill(); } }
  const trees = [[6.8, 4.4, 0], [3.6, 9.2, 1], [9.4, 9.4, 2], [13.2, 6.2, 3], [7.8, 1.0, 4]];
  const birds = [0, 1, 2].map((i) => ({ y: 40 + i * 34, speed: 70 + i * 16, ph: i * 260 }));
  // the window's grainy edge: fixed speckles along the outline, inside (paper) and outside (diorama colours)
  const N = 160, grain = []; for (let i = 0; i < N * 5; i++) grain.push({ u: r(), o: (r() - 0.35) * 26, k: r(), c: r() < 0.6 ? P.paper : r() < 0.5 ? P.pastel : P.soft });
  const paperGrain = document.createElement('canvas'); paperGrain.width = W; paperGrain.height = H; { const pg = paperGrain.getContext('2d');
    pg.fillStyle = P.paper; pg.fillRect(0, 0, W, H); for (let i = 0; i < 9000; i++) { pg.fillStyle = rgba(i % 2 ? P.ink : P.accent, 0.035 + r() * 0.04); pg.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    // the table the model stands on, under the safe area: a wavy-edged cloth of dots with big Memphis shapes peeking in
    const yb = F.table, wave = (x) => yb + Math.sin(x * 0.017 + 0.6) * 13;
    pg.save(); pg.beginPath(); pg.moveTo(-10, H + 10); for (let x = -10; x <= W + 10; x += 12) pg.lineTo(x, wave(x)); pg.lineTo(W + 10, H + 10); pg.closePath();
    pg.fillStyle = mix(P.paper, P.accent, 0.17); pg.fill(); pg.save(); pg.clip();
    pg.fillStyle = rgba(P.ink, 0.22); for (let y = yb + 20, j = 0; y < H; y += 22, j++) for (let x = (j % 2) * 11; x < W; x += 22) { pg.beginPath(); pg.arc(x, y, 2.6, 0, Math.PI * 2); pg.fill(); }
    M.mark(pg, P, 4, 170, H - 30, 260, P.accent); M.mark(pg, P, 1, 880, H - 62, 170, P.pastel); M.mark(pg, P, 3, 560, H - 18, 120, P.soft);
    pg.strokeStyle = P.ink; pg.lineWidth = 7; pg.lineCap = 'round'; pg.beginPath(); for (let i = 0; i <= 12; i++) { const x = 360 + i * 30, y = yb + 120 + (i % 2 ? -14 : 14); if (i) pg.lineTo(x, y); else pg.moveTo(x, y); } pg.stroke();
    pg.restore(); pg.strokeStyle = P.ink; pg.lineWidth = 4; pg.stroke(); pg.restore(); }
  const shape = (time, shut) => {
    const open = M.POP(clamp(time / 0.7)) * 0.4 + 0.6, k = 1 - shut;
    const cx = F.cx, cy = F.cy + (F.shutY - F.cy) * shut, a = (F.a * k + F.r * shut) * (shut ? 1 : open), b = (F.b * k + F.r * shut) * (shut ? 1 : open), n = 4.5 * k + 2 * shut;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const th = (i / N) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
      const rr = Math.pow(Math.abs(c / a) ** n + Math.abs(sn / b) ** n, -1 / n) * (1 + 0.02 * Math.sin(3 * th + 1) + 0.012 * Math.sin(5 * th + time * 0.7));
      pts.push([cx + c * rr, cy + sn * rr, c, sn]);
    }
    return pts;
  };
  return {
    P,
    draw(ctx, t, o = {}) {
      const time = t + clock, shut = clamp(o.shut ?? 0);
      ctx.drawImage(paperGrain, 0, 0);
      const pts = shape(time, shut);
      ctx.save(); ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.clip();
      // the slow camera: a creep and a drift
      const z = 0.86 + 0.025 * Math.sin(time * 0.12), px = Math.sin(time * 0.09) * 14;
      ctx.translate(F.cx + px, F.cy + 6); ctx.scale(z, z); ctx.translate(-DW / 2, -380);
      ctx.drawImage(cv, 0, 0);
      for (const wd of windows) { ctx.fillStyle = time > wd.on ? P.paper : wd.dark; ctx.strokeStyle = P.ink; ctx.lineWidth = 2; ctx.beginPath(); wd.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      // ripples and a boat on the pond
      const [pcx, pcy] = at(10.55, 2.7);
      ctx.strokeStyle = P.ink; ctx.lineWidth = 2.5;
      for (let k = 0; k < 2; k++) { const q = ((time * 0.45 + k * 0.5) % 1); ctx.globalAlpha = 1 - q; ctx.beginPath(); ctx.ellipse(pcx, pcy, 20 + q * 70, (20 + q * 70) * 0.5, 0, 0, Math.PI * 2); ctx.stroke(); }
      ctx.globalAlpha = 1;
      { const u = Math.sin(time * 0.35), [bx, by] = at(9.6 + (u + 1) * 1.2, 1.7 + (u + 1) * 0.9), bob = Math.sin(time * 2.4) * 2;
        ctx.fillStyle = P.ink; ctx.beginPath(); ctx.moveTo(bx - 20, by + bob); ctx.lineTo(bx + 20, by + bob); ctx.lineTo(bx + 13, by + 9 + bob); ctx.lineTo(bx - 13, by + 9 + bob); ctx.closePath(); ctx.fill();
        ctx.fillStyle = P.accent; ctx.strokeStyle = P.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx, by - 34 + bob); ctx.lineTo(bx + 16 * (u > 0 ? 1 : -1), by - 4 + bob); ctx.lineTo(bx, by - 4 + bob); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      // trees: a stick and a disc, swaying
      for (const [X, Y, i] of trees) {
        const [x, y] = at(X, Y), sw = Math.sin(time * 1.3 + i * 1.7) * 3.5;
        ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sw * 0.5, y - 44); ctx.stroke();
        M.mark(ctx, P, 0, x + sw, y - 62, 44, i % 2 ? P.accent : P.pastel);
      }
      // a cloud's dotted shadow drifting over the town
      { const cxs = ((time * 26 + 200) % (DW + 500)) - 250, cys = 360 + Math.sin(time * 0.2) * 30;
        ctx.save(); ctx.beginPath(); ctx.ellipse(cxs, cys, 150, 70, -0.25, 0, Math.PI * 2); ctx.ellipse(cxs + 110, cys - 30, 90, 50, -0.25, 0, Math.PI * 2); ctx.clip();
        ctx.globalAlpha = 0.28; ctx.drawImage(dots, 0, 0); ctx.restore(); }
      // birds
      ctx.strokeStyle = P.ink; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (const b of birds) { const x = rtl ? DW + 60 - ((time * b.speed + b.ph) % (DW + 120)) : ((time * b.speed + b.ph) % (DW + 120)) - 60, f = Math.sin(time * 9 + b.ph) * 6;
        ctx.beginPath(); ctx.moveTo(x - 12, b.y - f); ctx.lineTo(x, b.y); ctx.lineTo(x + 12, b.y - f); ctx.stroke(); }
      ctx.restore();
      // the grainy edge and an ink line just inside it
      ctx.save(); ctx.strokeStyle = P.ink; ctx.lineWidth = 3.5; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.stroke();
      for (const d of grain) { const p = pts[Math.floor(d.u * N) % N]; ctx.fillStyle = d.c; const sz = 2 + d.k * 3; ctx.fillRect(p[0] + p[2] * (d.o + 6), p[1] + p[3] * (d.o + 6), sz, sz); }
      ctx.restore();
    },
  };
}
