// A list as lanes of traffic: each item sits on its own lane line (a dashed road marking that keeps flowing) and is written by a light
// trail on its own beat; its index is a small mono plate on the far side, and the plate of the item on the current beat lights in the
// accent. A key phrase gets the long-exposure trail. spec: { duration, at?, says: { title?, items } }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const indent = 84, textW = SAFE.right - SAFE.left - indent;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: textW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead, weight: 600, maxW: SAFE.right - SAFE.left, minScale: 1, where: 'the list title' }) : null;
  const pitch = Math.max(130, rows[0].size * 1.95);
  const top = kit.place((title ? title.height + 34 : 0) + pitch * items.length, 700);
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const tx0 = rtl ? SAFE.left : SAFE.left + indent, tx1 = rtl ? SAFE.right - indent : SAFE.right;
  const yTitle = top + (title ? title.lead / 2 : 0), y0 = top + (title ? title.height + 34 : 0);
  const step = Math.min(T.beat, (d - 1.2) / Math.max(1, items.length));
  const lay = rows.map((f, k) => M.layout(kit, f, { x0: tx0, x1: tx1, y: y0 + k * pitch + pitch / 2 }));
  const out0 = d - T.dur.out - 0.12;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, out0 + T.dur.out);
      if (title) kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: yTitle, align: 'start', color: pal.grey, key: pal.key,
        each: (w, i, box, c) => {
          if (M.streakIn(c, span(t, at + i * T.dur.step, at + i * T.dur.step + T.dur.in), box, title.size, rtl, pal) === false) return false;
          if (M.streakOut(c, out, box, title.size, rtl, pal) === false) return false;
        } });
      const lastIn = at + 0.25 + (items.length - 1) * step;
      items.forEach((_, k) => {
        const ta = at + 0.25 + k * step, ym = y0 + k * pitch + pitch / 2, yl = y0 + (k + 1) * pitch - 14;
        // the lane marking: dashes run in toward the reading end, then keep flowing
        const lp = M.E(span(t, ta - 0.2, ta + 0.1)) * (1 - M.A(out));
        if (lp > 0) {
          ctx.save(); ctx.strokeStyle = rgba(pal.light, 0.22); ctx.lineWidth = 3; ctx.setLineDash([26, 18]);
          ctx.lineDashOffset = (rtl ? 1 : -1) * ((t + clock) * 120);
          const len = (SAFE.right - SAFE.left) * lp; ctx.beginPath();
          if (rtl) { ctx.moveTo(SAFE.right, yl); ctx.lineTo(SAFE.right - len, yl); } else { ctx.moveTo(SAFE.left, yl); ctx.lineTo(SAFE.left + len, yl); }
          ctx.stroke(); ctx.restore();
        }
        const ip = span(t, ta - 0.05, ta + 0.05);
        if (ip > 0 && out < 1) {
          // the plate of the newest item is lit; once all are in, the light steps down the list on the beat
          const cur = t < lastIn + T.beat ? Math.min(items.length - 1, Math.floor((t - at - 0.25) / step)) : Math.floor((t + clock) / T.beat) % items.length;
          const xi = rtl ? SAFE.right - 56 : SAFE.left, on = k === cur;
          ctx.save(); ctx.globalAlpha = 1 - out;
          ctx.fillStyle = on ? pal.accent : rgba(pal.light, 0.14); ctx.fillRect(xi, ym - 24, 56, 48);
          ctx.font = `600 ${T.size.index}px "${mono}"`; ctx.fillStyle = on ? M.onFill(pal) : pal.light; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
          ctx.fillText(String(k + 1).padStart(2, '0'), xi + 28, ym + 1); ctx.restore();
          kit.rec(xi, xi + 56, ym - 24, ym + 24, String(k + 1), { decor: true });
        }
        for (const r of M.runs(lay[k])) M.trail(ctx, r, rows[k].size, span(t, ta, ta + 0.35), rtl, pal, 1 - out);
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: pal.light, key: pal.key,
          each: (w, i, box, c) => {
            const s = ta + i * T.dur.step * 0.8;
            if (M.streakIn(c, span(t, s, s + T.dur.in), box, rows[k].size, rtl, pal) === false) return false;
            if (M.streakOut(c, span(t, out0 + k * 0.03, out0 + k * 0.03 + T.dur.out), box, rows[k].size, rtl, pal) === false) return false;
          } });
      });
    },
  };
}
