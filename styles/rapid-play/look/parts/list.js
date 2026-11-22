// A list as a catching game on ruled paper: the screen becomes a notebook page with a margin rule in the accent, the title is taped on
// at the top, and the items drop in from above one per beat (faster at later stages), land with a squash on their ruled line, and get
// a hand-drawn tick in the margin. Key items (*…*) are scribbled over with an accent highlighter. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, rng } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, TV = ground.TV;
  const margin = 130, x0 = TV.x + 60, x1 = TV.x + TV.w - margin - 30;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead, weight: 700, maxW: 640, minPx: 44, where: 'the list title' }) : null;
  const pitch = Math.max(rows[0].size * 1.75, 112), tH = title ? title.height + 26 : 0, tW = title ? title.width + 80 : 0;
  const top = TV.y + 70 + (title ? tH + 40 : 0), block = pitch * items.length, y0 = top + Math.max(0, (TV.y + TV.h - 60 - top - block) / 2) * 0.8;
  const beat = T.beat / ground.speed, t0 = (k) => at + 0.3 + k * beat, mx = rtl ? TV.x + TV.w - margin : TV.x + margin;
  const tx0 = rtl ? x0 : TV.x + margin + 30, tx1 = rtl ? x1 : TV.x + TV.w - 60;
  const ticks = items.map((_, k) => { const r = rng(900 + k), cx = rtl ? TV.x + TV.w - margin / 2 : TV.x + margin / 2, cy = y0 + k * pitch + pitch / 2;
    return [[cx - 30, cy - 2 + r() * 6], [cx - 8, cy + 24 + r() * 6], [cx + 34, cy - 30 + r() * 8]]; });
  const keyBoxes = rows.map((f, k) => M.keyBoxes(kit, f, { x0: tx0, x1: tx1, y: y0 + k * pitch + pitch / 2, align: 'start' }));
  const hi = (await import('/engine/kit.js')).mix(P.a, P.l, 0.25);
  const scribble = (c, b, size, k, p) => {                                  // a highlighter zigzag behind a key word
    const r = rng(77 + k), x0 = b.x - 14, x1 = b.x + b.width + 14, n = Math.max(4, Math.round(b.width / 26));
    c.save(); c.beginPath(); c.rect(rtl ? x1 - (x1 - x0) * p : x0, b.y - size, (x1 - x0) * p, size * 2); c.clip();
    c.fillStyle = hi; c.beginPath();                                       // a rough highlighter band, ragged top and bottom
    for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n; c[i ? 'lineTo' : 'moveTo'](x, b.y - size * (0.42 + r() * 0.12)); }
    for (let i = n; i >= 0; i--) { const x = x0 + ((x1 - x0) * i) / n; c.lineTo(x, b.y + size * (0.42 + r() * 0.12)); }
    c.closePath(); c.fill(); c.restore();
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = M.in2(span(t, d - 0.3, d));
      ground.screen(ctx, (c) => {
        c.fillStyle = P.paper; c.fillRect(TV.x, TV.y, TV.w, TV.h);
        c.fillStyle = P.rule; for (let y = y0 + pitch - 8; y < TV.y + TV.h; y += pitch) c.fillRect(TV.x, y, TV.w, 3);
        c.fillStyle = P.a; c.fillRect(mx - 2, TV.y, 4, TV.h);
        if (title) { const q = M.back(span(t, at, at + 0.3)) * (1 - out), x = rtl ? TV.x + TV.w - tW - 70 : TV.x + 70, y = TV.y + 60;
          if (q > 0) { c.save(); c.translate(x + tW / 2, y + tH / 2); c.rotate(rtl ? 0.03 : -0.03); c.scale(q, q); c.translate(-(x + tW / 2), -(y + tH / 2));
            M.toon(c, M.rect(x, y, tW, tH, 8), P.tint2, P, 8, 6);
            kit.drawText(c, title, { x0: x + 40, x1: x + tW - 40, y: y + 13 + title.lead / 2, align: 'start', color: P.d, key: P.d }); c.restore(); } }
        items.forEach((_, k) => {
          const p = span(t, t0(k), t0(k) + 0.24); if (p <= 0) return;
          const ym = y0 + k * pitch + pitch / 2, fall = (1 - p) ** 2 * -420, land = span(t, t0(k) + 0.24, t0(k) + 0.4);
          const sq = land > 0 && land < 1 ? 1 - 0.16 * Math.sin(land * Math.PI) : 1;
          c.save(); c.translate(0, fall * (1 - out) + out * 40); c.globalAlpha = 1 - out;
          c.translate(0, ym); c.scale(1 / Math.sqrt(sq), sq); c.translate(0, -ym);
          keyBoxes[k].forEach((b) => scribble(c, b, rows[k].size, k, M.out3(span(t, t0(k) + 0.3, t0(k) + 0.55))));
          kit.drawText(c, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: P.d, key: P.d });
          c.restore();
          const tk = span(t, t0(k) + 0.24, t0(k) + 0.42);                  // the tick, drawn in one stroke
          if (tk > 0 && out < 1) { const pts = ticks[k]; c.save(); c.globalAlpha = 1 - out; c.strokeStyle = P.d; c.lineWidth = 12; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
            c.moveTo(...pts[0]); if (tk < 0.4) c.lineTo(pts[0][0] + (pts[1][0] - pts[0][0]) * tk / 0.4, pts[0][1] + (pts[1][1] - pts[0][1]) * tk / 0.4);
            else { c.lineTo(...pts[1]); const q = (tk - 0.4) / 0.6; c.lineTo(pts[1][0] + (pts[2][0] - pts[1][0]) * q, pts[1][1] + (pts[2][1] - pts[1][1]) * q); }
            c.stroke(); c.restore(); }
        });
      });
      ground.fuse(ctx, t, d, at);
    },
  };
}
