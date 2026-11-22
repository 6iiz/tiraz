// A list as a stack of faceted gem bars, flush to the reading side, each as wide as its own words. The bars drop in one per beat and
// land with the bounce; each carries its index in the mono face inside a small hexagon at its far end. A key phrase inside an item is
// inlaid in the accent on the bar's face (one inlay for the whole phrase). The title sits above in the quieter tone.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const idxW = 74, padX = 30, tip = 40, fullW = SAFE.right - SAFE.left - tip * 2 - idxW - padX * 2;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: fullW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: SAFE.right - SAFE.left, minPx: 44, where: 'the list title' }) : null;
  const bh = rows[0].size * 1.3, pitch = bh * 1.62, head = title ? title.height + 40 : 0;
  const top = kit.place(head + pitch * items.length, 760), y0 = top + head;
  const bars = rows.map((f, k) => {
    const ym = y0 + k * pitch + pitch / 2, w = f.width + idxW + padX * 2;
    const bx1 = rtl ? SAFE.right - tip : SAFE.left + tip + w, bx0 = bx1 - w;
    const tx0 = rtl ? bx0 + idxW + padX : bx0 + padX, tx1 = rtl ? bx1 - padX : bx1 - idxW - padX;
    const inlays = M.runs(M.layout(f, tx0, tx1, ym, rtl));
    return { ym, bx0, bx1, tx0, tx1, inlays, ix: rtl ? bx0 + idxW / 2 + 8 : bx1 - idxW / 2 - 8 };
  });
  const ink = P.on(P.panel);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d);
      if (title) kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: top + title.lead / 2, align: 'start', color: P.muted,
        each: (w, i, box, c) => { const t0 = at + i * 0.05; if (M.drop(c, span(t, t0, t0 + T.dur.in), 50) === false) return false; if (M.lift(c, out) === false) return false; } });
      bars.forEach((b, k) => {
        const t0 = at + 0.2 + k * T.dur.beat, p = span(t, t0, t0 + T.dur.in), o = span(t, d - T.dur.out + k * 0.03, d);
        if (p <= 0 || o >= 1) return;
        ctx.save();
        M.hover(ctx, (b.bx0 + b.bx1) / 2, b.ym + bh / 2 + 30, b.bx1 - b.bx0, Math.min(1, p * 2) * (1 - o) * 0.7);
        M.drop(ctx, p, 90); M.lift(ctx, o);
        M.gemBar(ctx, P, b.bx0, b.bx1, b.ym - bh / 2, b.ym + bh / 2, P.panel);
        for (const r of b.inlays) {                       // the key phrase, inlaid in the accent with a lit upper edge
          const px = Math.min(rows[k].size * 0.16, rows[k].space * 0.4), y0r = b.ym - rows[k].size * 0.56, y1r = b.ym + rows[k].size * 0.52;
          ctx.fillStyle = P.accent; ctx.fillRect(r.x0 - px, y0r, r.x1 - r.x0 + px * 2, y1r - y0r);
          ctx.fillStyle = P.tone(P.accent, 0.9); ctx.fillRect(r.x0 - px, y0r, r.x1 - r.x0 + px * 2, 5);
          ctx.fillStyle = P.tone(P.accent, -0.7); ctx.fillRect(r.x0 - px, y1r - 4, r.x1 - r.x0 + px * 2, 4);
        }
        // the index in a small hexagon
        ctx.strokeStyle = ink; ctx.lineWidth = 2.5; ctx.beginPath();
        for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + (i * Math.PI) / 3, x = b.ix + Math.cos(a) * 25, y = b.ym + Math.sin(a) * 25; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.closePath(); ctx.stroke();
        ctx.font = `700 ${T.size.index}px "${mono}"`; ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        ctx.fillText(String(k + 1), b.ix, b.ym + 2);
        kit.rec(b.ix - 25, b.ix + 25, b.ym - 25, b.ym + 25, String(k + 1), { decor: true });
        kit.drawText(ctx, rows[k], { x0: b.tx0, x1: b.tx1, y: b.ym, align: 'start', color: ink, key: P.onAccent });
        ctx.restore();
      });
    },
  };
}
