// A list as the key to a plate: each item has a small numbered roundel on the reading side, its words engraved in three passes, and a
// burin rule cut along its length beneath it. Items are cut one per beat. A key word is washed with the accent once it is solid.
// The title is engraved above in a soft ink over a rule with a lozenge. To leave, the plate is wiped.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const full = SAFE.right - SAFE.left, rr = 32, textW = full - rr * 2 - 40;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: textW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: T.weight.title, maxW: full, single: true, where: 'the list title' }) : null;
  const pitch = rows[0].lead + 26, head = title ? title.lead + 50 : 0;
  const top = kit.place(head + pitch * items.length, 720), y0 = top + head, cx = W / 2;
  const boxes = items.map(() => ({}));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      M.wiped(ctx, span(t, d - T.dur.out, d), W, H, rtl, () => {
        if (title) {
          kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: top + title.lead / 2, color: P.soft,
            each: (w, i, box, c) => M.engrave(c, span(t, at + i * T.dur.step, at + i * T.dur.step + T.dur.word), box, title.size, P.soft, rtl) });
          M.ornament(ctx, cx, top + title.lead + 14, 520, span(t, at + 0.1, at + 0.6), P);
        }
        items.forEach((_, k) => {
          const t0 = at + 0.2 + k * T.beat, ym = y0 + k * pitch + rows[k].lead / 2, xr = rtl ? SAFE.right - rr : SAFE.left + rr;
          M.roundel(ctx, xr, ym, rr, span(t, t0, t0 + 0.35), P, 2.2);
          if (t >= t0 + 0.1) {
            ctx.save(); ctx.font = `600 30px "${mono}"`; ctx.fillStyle = M.inkFor(ctx, span(t, t0 + 0.1, t0 + 0.5), P.ink); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
            ctx.fillText(String(k + 1), xr, ym + 2); ctx.restore();
            kit.rec(xr - 20, xr + 20, ym - 20, ym + 20, String(k + 1), { decor: true });
          }
          const x0 = rtl ? SAFE.left : SAFE.left + rr * 2 + 30, x1 = rtl ? SAFE.right - rr * 2 - 30 : SAFE.right;
          kit.drawText(ctx, rows[k], { x0, x1, y: ym, align: 'start', color: P.ink, key: P.ink,
            each: (w, i, box, c) => { boxes[k][i] = w.key ? box : null; return M.engrave(c, span(t, t0 + 0.08 * i, t0 + 0.08 * i + T.dur.word), box, rows[k].size, P.ink, rtl); } });
          const g = M.E(span(t, t0 + 0.1, t0 + 0.6)), yl = ym + rows[k].lead / 2 + 8, L = full * g;
          ctx.fillStyle = P.hair; if (g > 0) M.swell(ctx, rtl ? SAFE.right : SAFE.left, yl, rtl ? SAFE.right - L : SAFE.left + L, yl, 1.8);
          Object.values(boxes[k]).forEach((b, j) => {
            if (!b) return;
            M.wash(ctx, b.x + b.width / 2, b.y + 4, b.width / 2 + 30, rows[k].size * 0.66, span(t, t0 + T.dur.word + 0.1, t0 + T.dur.word + 0.1 + T.dur.wash), P, 60 + k + j);
          });
        });
      });
    },
  };
}
