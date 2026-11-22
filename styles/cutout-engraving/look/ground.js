// The cut-out ground: a paper table (the brand's light colour, a shade down, with fibres) and a collage glued on it. Torn sheets of
// flat colour make the space: a big torn disc of the accent in the far upper corner, a pale accent sheet torn on a slant across the
// middle, a dark sheet along the bottom. Three cut-outs of engravings sit on it, each hatched in swelling lines on a card with a
// white cut margin and a real shadow: a globe, a column and a crescent moon. They are pinned and rock a little on twos.
// Sheets and engravings are drawn once (engravings once per page); a frame draws one image and the three pieces.
import { rng, rgba, mix } from '/engine/kit.js';
import { palette, twos, torn } from './motion.js';

const cache = {};
// Engraving: a card with the figure hatched in lines whose width follows the shade (thick in shadow, hair-thin in light).
function engrave(kind, P) {
  const id = kind + P.ink + P.paper; if (cache[id]) return cache[id];
  const S = 360, c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d'), r = rng(kind.length * 97);
  const L = [-0.6, -0.55, 0.58];
  const line = (pts, wOf) => { for (let i = 1; i < pts.length; i++) { const w = wOf(pts[i]); if (w < 0.25) continue; g.lineWidth = w; g.beginPath(); g.moveTo(...pts[i - 1]); g.lineTo(...pts[i]); g.stroke(); } };
  g.strokeStyle = P.ink; g.lineCap = 'round'; g.fillStyle = P.ink;
  // the cut silhouette (margin) is traced by outline(); figure drawn inside
  let outline;
  if (kind === 'globe') {
    const R = 140, cx = S / 2, cy = S / 2;
    const shade = (x, y) => { const nx = (x - cx) / R, ny = (y - cy) / R, d = 1 - nx * nx - ny * ny; if (d <= 0) return 1; const nz = Math.sqrt(d); return 1 - Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]); };
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
    for (let y = cy - R + 4; y < cy + R; y += 7) {
      const hw = Math.sqrt(Math.max(0, R * R - (y - cy) ** 2)), pts = [];
      for (let x = cx - hw; x <= cx + hw; x += 4) pts.push([x, y + 0.16 * (y - cy) * (1 - ((x - cx) / (hw || 1)) ** 2)]);
      line(pts, ([x, y2]) => 0.3 + 4.2 * shade(x, y2) ** 1.4);
    }
    for (let k = -3; k <= 3; k++) { const pts = []; for (let a = -1.5; a <= 1.5; a += 0.05) pts.push([cx + Math.sin(k * 0.42) * Math.cos(a) * R, cy + Math.sin(a) * R]);
      line(pts, ([x, y]) => 0.6 + 1.6 * shade(x, y)); }
    for (let x = cx - R; x < cx + R; x += 9) { const pts = []; for (let y = cy - R; y < cy + R; y += 4) { const nx = (x - cx) / R, ny = (y - cy) / R; if (nx * nx + ny * ny < 1 && shade(x, y) > 0.72) pts.push([x + (y - cy) * 0.5, y]); }
      if (pts.length > 1) line(pts, () => 1.1); }
    g.restore();
    g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
    outline = (h) => { h.arc(cx, cy, R + 16, 0, Math.PI * 2); };
  } else if (kind === 'column') {
    const x0 = 120, x1 = 240, top = 70, bot = 320;
    for (let x = x0 + 3; x < x1; x += 6) { const u = (x - x0) / (x1 - x0) * 2 - 1, sh = 1 - Math.max(0, -u * 0.7 + Math.sqrt(1 - u * u) * 0.6);
      line([[x, top + 30], [x, bot - 26]].flatMap(([a, b]) => [[a, b]]).concat([]), () => 0.4 + 4.4 * sh ** 1.3); }
    for (const [ya, yb, xa, xb] of [[top, top + 30, x0 - 26, x1 + 26], [bot - 26, bot, x0 - 30, x1 + 30], [top - 16, top, x0 - 34, x1 + 34]]) {
      for (let y = ya + 3; y < yb; y += 5) line([[xa, y], [xb, y]], () => 0.5 + 2.6 * ((y - ya) / (yb - ya)));
      g.lineWidth = 2; g.strokeRect(xa, ya, xb - xa, yb - ya);
    }
    g.lineWidth = 2.5; g.strokeRect(x0, top + 30, x1 - x0, bot - 26 - top - 30);
    outline = (h) => { h.rect(x0 - 50, top - 32, x1 - x0 + 100, bot - top + 50); };
  } else {
    const cx = S / 2, cy = S / 2, R = 130, o = 62;
    const inMoon = (x, y) => (x - cx) ** 2 + (y - cy) ** 2 < R * R && (x - cx - o) ** 2 + (y - cy + 20) ** 2 > (R * 0.9) ** 2;
    for (let y = cy - R; y < cy + R; y += 6) { let seg = []; for (let x = cx - R; x <= cx + R; x += 3) { if (inMoon(x, y)) seg.push([x, y]); else if (seg.length) { line(seg, ([x2]) => 0.5 + 3 * Math.max(0, (cx - x2 + R * 0.2) / R)); seg = []; } }
      if (seg.length) line(seg, ([x2]) => 0.5 + 3 * Math.max(0, (cx - x2 + R * 0.2) / R)); }
    g.lineWidth = 2.5; g.beginPath(); g.arc(cx, cy, R, 0.3, Math.PI * 2 - 0.9); g.stroke();
    outline = (h) => { h.arc(cx, cy, R + 16, 0, Math.PI * 2); };
  }
  // the card: a paper cut-out round the figure with a slightly rough margin
  const card = document.createElement('canvas'); card.width = card.height = S; const k = card.getContext('2d');
  k.fillStyle = P.paper; k.beginPath(); outline(k); k.fill(); k.strokeStyle = P.edge; k.lineWidth = 1.5; k.stroke();
  k.drawImage(c, 0, 0);
  for (let i = 0; i < 700; i++) { k.fillStyle = rgba(P.ink, 0.05); k.fillRect(r() * S, r() * S, 1.5, 1.5); }
  return (cache[id] = { img: card, outline, S });
}

export function create({ W, H, brand, look, clock = 0 }) {
  const P = palette(brand), rtl = brand.dir !== 'ltr';
  const id = 'table' + P.paper + P.ink + P.accent + rtl;
  if (!cache[id]) {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), r = rng(1888);
    g.fillStyle = P.table; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 2600; i++) { g.strokeStyle = rgba(r() < 0.5 ? P.ink : P.paper, 0.06 + r() * 0.06); g.lineWidth = 1; const x = r() * W, y = r() * H, a = r() * 6.3, l = 4 + r() * 16; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    const sheet = (shape, fill, rot, cx, cy) => {
      g.save(); g.translate(cx + 8, cy + 10); g.rotate(rot); g.filter = 'blur(6px)'; g.fillStyle = P.shadow; g.beginPath(); shape(g); g.fill(); g.restore();
      g.save(); g.translate(cx, cy); g.rotate(rot); g.fillStyle = P.paper; g.beginPath(); shape(g); g.fill();      // the white fibre fringe
      g.scale(0.985, 0.97); g.fillStyle = fill; g.beginPath(); shape(g); g.fill(); g.restore();
    };
    const disc = (R, seed) => { const rr = rng(seed), pts = []; for (let a = 0; a < Math.PI * 2; a += 0.09) pts.push([Math.cos(a) * (R + (rr() - 0.5) * 12), Math.sin(a) * (R + (rr() - 0.5) * 12)]);
      return (h) => { h.moveTo(...pts[0]); pts.forEach((p) => h.lineTo(...p)); h.closePath(); }; };
    sheet(torn(1500, 560, 11, 40, true), P.sheet, -0.16 * (rtl ? 1 : -1), W / 2, 900);
    sheet(disc(250, 5), P.accent, 0, rtl ? 150 : W - 150, 300);
    sheet(torn(1400, 520, 23, 30, true), P.dusk, 0.05, W / 2, 1720);
    cache[id] = c;
  }
  const table = cache[id];
  const pieces = [
    { e: engrave('globe', P), x: rtl ? W - 230 : 230, y: 1520, s: 0.95, pin: [0, -150], amp: 2.2, ph: 0 },
    { e: engrave('column', P), x: rtl ? 250 : W - 250, y: 1580, s: 1.05, pin: [0, -140], amp: 1.4, ph: 1.3 },
    { e: engrave('moon', P), x: rtl ? W - 150 : 150, y: 150, s: 0.62, pin: [0, -120], amp: 3, ph: 2.1 },
  ];
  return {
    P, paper: P.paper, ink: P.ink,
    draw(ctx, t) {
      const time = twos(t + clock);
      ctx.drawImage(table, 0, 0);
      for (const p of pieces) {
        const rot = (Math.sin(time * 1.3 + p.ph) * p.amp * Math.PI) / 180, S = p.e.S * p.s;
        ctx.save(); ctx.translate(p.x + p.pin[0] * p.s, p.y + p.pin[1] * p.s); ctx.rotate(rot); ctx.translate(-p.pin[0] * p.s, -p.pin[1] * p.s);
        ctx.save(); ctx.translate(9, 12); ctx.filter = 'blur(5px)'; ctx.fillStyle = P.shadow; ctx.translate(-S / 2, -S / 2); ctx.scale(p.s, p.s); ctx.beginPath(); p.e.outline(ctx); ctx.fill(); ctx.restore();
        ctx.drawImage(p.e.img, -S / 2, -S / 2, S, S);
        ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(p.pin[0] * p.s, p.pin[1] * p.s, 6, 0, Math.PI * 2); ctx.fill();   // the pin
        ctx.restore();
      }
    },
  };
}
