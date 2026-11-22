// A list as the bulletin's rundown: an ink card of numbered rows. A highlight steps down the card one row at a time; each row's
// story rolls up as the highlight reaches it, its number on an accent block, and the rows already passed are dimmed (ticked off).
// The title, when there is one, is the headline on the strap and the card fills the picture panel; without a title the card stands
// alone in the middle of the frame. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, D = T.dur, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const box = 72, gap = 30, x0 = SAFE.left, x1 = SAFE.right;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0 - box - gap * 3 - 20, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: Math.round(T.size.strap * 0.85), weight: T.weight.strap, maxW: SAFE.right - SAFE.left - T.strap.end - 66, minScale: 0.7, where: 'the list title' }) : null;
  const n = items.length;
  let cy0, ch;
  if (title) { cy0 = T.panel.y; ch = T.panel.h; } else { ch = Math.min(T.panel.h + 120, 60 + n * 150); cy0 = kit.place(ch, 740); }
  const pitch = Math.min(150, (ch - 50) / n), top = cy0 + (ch - pitch * n) / 2 + 4;
  const st = title ? M.strap({ kit, brand, P, T, tab: null, text: title }) : null;
  const tk = (k) => at + 0.25 + k * D.row;
  const bx = rtl ? x1 - 24 - box : x0 + 24;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - D.fold, d), fold = M.I(out);
      // the card: it opens from its top edge, under the accent rule
      const open = M.Q(span(t, at - 0.1, at + 0.2)) * (1 - fold);
      if (open > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(x0, cy0, x1 - x0, ch * open); ctx.clip();
        ctx.fillStyle = P.ink; ctx.fillRect(x0, cy0, x1 - x0, ch);
        items.forEach((_, k) => {
          const y = top + k * pitch, ym = y + pitch / 2, t0 = tk(k), next = k + 1 < n ? tk(k + 1) : Infinity;
          if (k) { ctx.fillStyle = P.raise; ctx.fillRect(x0 + 24, y - 1, x1 - x0 - 48, 2); }
          if (t < t0) return;
          const active = t < next, hl = M.Q(span(t, t0, t0 + 0.2)) * (active ? 1 : 1 - M.Q(span(t, next, next + 0.2)));
          if (hl > 0) { const w = (x1 - x0 - 24) * hl; ctx.fillStyle = P.raise; ctx.fillRect(rtl ? x1 - 12 - w : x0 + 12, y + 8, w, pitch - 16); }
          M.flip(ctx, span(t, t0, t0 + D.flip), 0, y + 8, y + pitch - 8, () => {
            ctx.fillStyle = active ? P.accent : P.rule; ctx.fillRect(bx, ym - box / 2, box, box);
            ctx.font = `700 ${T.size.index}px "${mono}"`; ctx.fillStyle = active ? P.onAccent : P.paper; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
            ctx.fillText(String(k + 1), bx + box / 2, ym + 2);
            kit.rec(bx, bx + box, ym - box / 2, ym + box / 2, String(k + 1), { decor: true });
            kit.drawText(ctx, rows[k], { x0: rtl ? x0 + gap : bx + box + gap, x1: rtl ? bx - gap : x1 - gap, y: ym, align: 'start', color: active ? P.paper : P.muted, key: P.onAccent,
              each: (w, i, b, c) => { if (w.key) { const pad = rows[k].size * 0.16; c.fillStyle = P.accent; c.fillRect(b.x - pad, b.y - rows[k].size * 0.62, b.width + pad * 2, rows[k].size * 1.24); return P.onAccent; } } });
          }, P.ink);
        });
        ctx.restore();
        ctx.fillStyle = P.accent; ctx.fillRect(x0, cy0, x1 - x0, 8);
      }
      if (st) st.draw(ctx, { pTab: span(t, at, at + D.tab), pText: span(t, at + 0.05, at + 0.05 + D.flip), pKey: span(t, at + 0.4, at + 0.4 + D.chip), out });
    },
  };
}
