// A list as floors: each item is an ink beam slammed in on the beat from alternate sides, with its number stamped on a red block at
// the beam's reading end; a key word is a red segment of its beam. A tall film strip on the far side cuts to a new shot each time a floor
// lands, so the list is counted by the cuts. The title is an ink tab with a red rivet. spec: { duration, at?, says: { title?, items } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const stripW = 190, gapS = 26, idx = 84, textW = SAFE.right - SAFE.left - stripW - gapS - idx - 60;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: textW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 800, maxW: SAFE.right - SAFE.left - 80, single: true, where: 'the list title' }) : null;
  const bh = rows[0].size * 1.62, gap = 22, head = title ? title.size * 1.6 + 44 : 0;
  const top = kit.place(head + items.length * (bh + gap) - gap, 760), y0 = top + head;
  const tItem = (k) => at + 0.2 + k * T.beat;
  const sx0 = rtl ? SAFE.left : SAFE.right - stripW, bx0 = rtl ? SAFE.left + stripW + gapS : SAFE.left, bx1 = rtl ? SAFE.right : SAFE.right - stripW - gapS;
  const listBottom = y0 + items.length * (bh + gap) - gap;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), o = M.I(out);
      if (title) {
        const p = M.E(span(t, at, at + T.dur.slam)), dx = (rtl ? 1 : -1) * ((1 - p) * W + o * -W);
        if (p > 0) {
          const b = M.beamRow(kit, ctx, title, title.rows[0], { x0: SAFE.left, x1: SAFE.right, y: top + title.size * 0.8, pad: 18, fill: P.ink, ink: P.paper, keyFill: P.red, keyInk: P.onRed, dx });
          ctx.fillStyle = P.red; ctx.fillRect((rtl ? b.left - 36 : b.left + b.w + 12) + dx, top + title.size * 0.8 - 12, 24, 24);
        }
      }
      // the film strip: opens downward with the first floor, then cuts each time a floor lands
      const ps = M.E(span(t, tItem(0) - 0.1, tItem(0) + 0.2)), sh = (listBottom - y0) * ps;
      if (sh > 2) {
        let k = 0; for (let i = 0; i < items.length; i++) if (t >= tItem(i)) k = i;
        const u = t - tItem(k), last = tItem(items.length - 1);
        const c = t > last + T.beat ? M.cutAt(t, last + T.beat, T.beat, k * 2 + 3) : { k: k * 2 + 1, u: Math.max(0, u) };
        M.window(ctx, sx0, y0 - o * H, stripW, sh, c.k, c.u, t, P, 5);
      }
      items.forEach((_, k) => {
        const t0 = tItem(k), p = span(t, t0, t0 + T.dur.slam); if (p <= 0) return;
        const ok = M.I(span(t, d - T.dur.out + k * 0.04, d)); if (ok >= 1) return;
        const side = k % 2 ? -1 : 1, dx = ((1 - M.E(p)) * side - ok * side) * W, dy = M.kick(t - t0 - T.dur.slam, 5);
        const ym = y0 + k * (bh + gap) + bh / 2, fill = P.ink, ink = P.paper;
        ctx.save(); ctx.translate(dx, dy);
                ctx.fillStyle = fill; ctx.fillRect(bx0, ym - bh / 2, bx1 - bx0, bh);
        // the number, stamped on a red block (an ink block on the red beam) at the reading end
        const ix = rtl ? bx1 - idx : bx0;
        ctx.fillStyle = P.red; ctx.fillRect(ix, ym - bh / 2, idx, bh);
        ctx.font = `800 ${T.size.index}px "${mono}"`; ctx.fillStyle = P.onRed; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        ctx.fillText(String(k + 1), ix + idx / 2, ym + 2);
        kit.rec(ix + dx, ix + idx + dx, ym - 24, ym + 24, String(k + 1), { decor: true });
        kit.drawText(ctx, rows[k], { x0: rtl ? bx0 + 30 : bx0 + idx + 26, x1: rtl ? bx1 - idx - 26 : bx1 - 30, y: ym + rows[k].size * 0.04, align: 'start', color: ink, key: P.onRed,
          each: (w, i, box, c) => { if (w.key) { c.fillStyle = P.red; c.fillRect(box.x - rows[k].space * 0.45, ym - bh / 2, box.width + rows[k].space * 0.9, bh); return P.onRed; } } });
        ctx.restore();
      });
    },
  };
}
