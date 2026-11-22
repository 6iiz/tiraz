// A list as pasted couplets: each item is pasted on a deep red banner with swallow-tail ends, one per beat, on two drawings, beside a
// small window flower that snaps open as its bullet. A key word is cut out of its banner: it shows through a window of the sheet's own
// paper. The title is pasted first, on the sheet, over a sawtooth rule. spec: { duration, at?, says: { title?, items } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const maxW = SAFE.right - SAFE.left, bullet = 84, bw = maxW - bullet - 10;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: bw - 150, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 800, maxW, single: true, where: 'the list title' }) : null;
  const bh = rows[0].size * 1.85, gap = 22, head = title ? title.size * 1.6 + 50 : 0;
  const top = kit.place(head + items.length * (bh + gap) - gap, 720), y0 = top + head;
  const ban = M.banner(bw, bh, P.deep, 24), flower = M.rosette(bullet / 2 - 2, P.red, 0, 12);
  const holes = new Map();
  const bx = rtl ? SAFE.left + bw / 2 : SAFE.right - bw / 2, fx = rtl ? SAFE.right - bullet / 2 : SAFE.left + bullet / 2;
  const tItem = (k) => at + 0.25 + k * T.beat;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d);
      if (title && out < 1) {
        const k = M.paste(t, at);
        if (k > 0) {
          const yt = top + title.size * 0.8; ctx.save(); ctx.translate(0, M.steps12(out) * 100);
          ctx.fillStyle = P.red; const w = title.width + 40, x0 = rtl ? SAFE.right - w : SAFE.left, yr = yt + title.size * 0.78;
          ctx.beginPath(); ctx.moveTo(x0, yr); for (let x = 0; x <= w; x += 16) { ctx.lineTo(x0 + x + 8, yr + 10); ctx.lineTo(x0 + x + 16, yr); } ctx.lineTo(x0 + w, yr + 4); ctx.lineTo(x0, yr + 4); ctx.fill();
          ctx.translate(W / 2, yt); ctx.scale(k, k); ctx.translate(-W / 2, -yt);
          kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: yt, align: 'start', color: P.txt });
          ctx.restore();
        }
      }
      items.forEach((_, i) => {
        const t0 = tItem(i), k = M.paste(t, t0); if (k <= 0) return;
        const o = span(t, d - T.dur.out + i * 0.04, d); if (o >= 1) return;
        const ym = y0 + i * (bh + gap) + bh / 2, jig = (i % 2 ? -1 : 1) * 10;
        ctx.save(); ctx.translate(jig, M.steps12(o) * 110);
        M.unfold(ctx, flower, fx, ym, t - t0, { gap: 0.1, dur: 0.08 });
        M.lay(ctx, ban, bx, ym, k);
        ctx.translate(bx, ym); ctx.scale(k, k); ctx.translate(-bx, -ym);
        const r = rows[i];
        kit.drawText(ctx, r, { x0: bx - bw / 2 + 70, x1: bx + bw / 2 - 70, y: ym + r.size * 0.04, align: 'start', color: P.onDeep, key: P.txt,
          each: (w, j, box, c) => {
            if (!w.key) return;
            const kk = i + '_' + Math.round(box.width);
            if (!holes.has(kk)) holes.set(kk, M.card(box.width + r.space * 0.7, bh * 0.72, P.ground, 50 + holes.size));
            M.lay(c, holes.get(kk), box.x + box.width / 2, ym);
            return P.txt;
          } });
        ctx.restore();
      });
    },
  };
}
