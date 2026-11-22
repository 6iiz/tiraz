// A list: each item is a paper lever hinged at the reading side. It stands upright, swings down a quarter turn and locks level, one
// per beat; its hinge is an accent square holding the index in the mono face, and the rolling square types the item along the lever.
// The title, when there is one, sits on a small plate of two triangles. Levers leave by swinging on down.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const full = SAFE.right - SAFE.left, pitch = 132, bh = 108, cellW = bh, inPad = 30;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: full - cellW - inPad * 2, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: full - 60, single: true, where: 'the list title' }) : null;
  const titleH = title ? title.lead + 36 : 0, gapT = title ? 30 : 0;
  const top = kit.place(titleH + gapT + pitch * items.length, 740);
  const tplate = title ? { x: rtl ? SAFE.right - title.width - 60 : SAFE.left, y: top, w: title.width + 60, h: titleH } : null;
  const y0 = top + titleH + gapT, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const hinge = rtl ? SAFE.right : SAFE.left, up = rtl ? M.Q : -M.Q;
  const t0 = at + (title ? 0.3 : 0.05);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d);
      if (tplate) M.stage(ctx, tplate, span(t, at, at + T.dur.stage), out, P.paper, () =>
        M.typeset(ctx, kit, title, { x0: tplate.x + 30, x1: tplate.x + tplate.w - 30, y: top + titleH / 2, t, t0: at + T.dur.stage, pal: P, T, color: P.grey, square: false }));
      items.forEach((_, k) => {
        const ts = t0 + k * T.beat, pin = span(t, ts, ts + T.dur.lever);
        const po = span(t, d - T.dur.out + k * 0.03, d), ym = y0 + k * pitch + pitch / 2;
        if (pin <= 0 || po >= 1) return;
        const ang = up * (1 - M.SNAP(pin)) - up * M.OUT(po);
        ctx.save(); ctx.translate(hinge, ym); ctx.rotate(ang); ctx.translate(-hinge, -ym);
        ctx.fillStyle = P.paper; ctx.fillRect(SAFE.left, ym - bh / 2, full, bh);
        const cx = rtl ? SAFE.right - cellW : SAFE.left;
        ctx.fillStyle = P.accent; ctx.fillRect(cx, ym - bh / 2, cellW, bh);
        ctx.fillStyle = P.on; ctx.font = `600 ${T.size.index}px "${mono}"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        ctx.fillText(String(k + 1).padStart(2, '0'), cx + cellW / 2, ym + 2);
        const tx0 = rtl ? SAFE.left + inPad : SAFE.left + cellW + inPad, tx1 = rtl ? SAFE.right - cellW - inPad : SAFE.right - inPad;
        M.typeset(ctx, kit, rows[k], { x0: tx0, x1: tx1, y: ym, t, t0: ts + T.dur.lever * 0.7, pal: P, T });
        ctx.restore();
      });
    },
  };
}
