// A list on a deco doorway: a tall lacquer panel with a stepped top opens out from the axis; the title sits under its top step. Each
// row then arrives on the beat: an engraved rule runs out from the axis, a bulb lights at each of its ends, and the words rise from the
// centre outward. Rows with a key word are cast in the metal. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, B = M.bulbs(pal);
  const cx = W / 2, pw = SAFE.right - SAFE.left - 20, textW = pw - 220;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: textW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: pw * 0.6 - 40, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(rows[0].lead + 34, 128), stepH = 30;
  const head = stepH * 2 + (title ? title.lead + 36 : 30);
  const ph = head + pitch * items.length + 40;
  const top = kit.place(ph, 720), y0 = top + head;
  const outline = (c, wf, hf, inset = 0) => {                       // the doorway: three steps up to the centre
    const w = pw * wf - inset * 2, x0 = cx - w / 2, x1 = cx + w / 2, yb = top + ph - inset, h = ph * hf - inset * 2, yt = yb - h, s = Math.min(stepH, h / 6);
    const w1 = w * 0.8, w2 = w * 0.6;
    c.beginPath();
    c.moveTo(x0, yb); c.lineTo(x0, yt + 2 * s); c.lineTo(cx - w1 / 2, yt + 2 * s); c.lineTo(cx - w1 / 2, yt + s); c.lineTo(cx - w2 / 2, yt + s); c.lineTo(cx - w2 / 2, yt);
    c.lineTo(cx + w2 / 2, yt); c.lineTo(cx + w2 / 2, yt + s); c.lineTo(cx + w1 / 2, yt + s); c.lineTo(cx + w1 / 2, yt + 2 * s); c.lineTo(x1, yt + 2 * s); c.lineTo(x1, yb); c.closePath();
  };
  const ro = rows.map((r, k) => ({ x0: cx - r.width / 2, x1: cx + r.width / 2, y: y0 + k * pitch + pitch / 2 - 8, align: 'center' }));
  const ranks = rows.map((r, k) => M.centreOut(kit, r, ro[k]).rank);
  const to = title ? { x0: cx - title.width / 2, x1: cx + title.width / 2, y: top + stepH * 2 + 6 + title.lead / 2, align: 'center' } : null;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const time = t + clock, out = span(t, d - T.dur.out, d), keep = 1 - M.E(out), sh = M.sheenAt(time, 3.4);
      const pw0 = M.E(span(t, at, at + 0.3)), ph0 = M.E(span(t, at + 0.15, at + 0.5));
      const wf = pw0 * (1 - M.E(span(out, 0.4, 1))), hf = ph0 * (1 - M.E(span(out, 0, 0.6)));
      if (wf <= 0) return;
      const paint = M.metal(ctx, cx - pw / 2, top, cx + pw / 2, top + ph, pal, sh);
      if (hf < 0.02) { M.gline(ctx, (c) => { c.beginPath(); c.moveTo(cx - pw * wf / 2, top + ph); c.lineTo(cx + pw * wf / 2, top + ph); }, 2.4, pal, paint); return; }
      outline(ctx, wf, hf); ctx.fillStyle = pal.lacquer; ctx.fill();
      M.gline(ctx, (c) => outline(c, wf, hf), 3, pal, paint);
      if (ph * hf > 60) M.gline(ctx, (c) => outline(c, wf, hf, 12), 1.2, pal, paint);
      ctx.save(); outline(ctx, wf, hf); ctx.clip();
      if (title) {
        M.flank(ctx, cx, to.y, title.width / 2 + 22, 60, pal, span(t, at + 0.35, at + 0.8) * keep, sh);
        kit.drawText(ctx, title, { ...to, color: pal.muted, each: (w, i, box, c) => M.rise(c, span(t, at + 0.35 + i * T.dur.stagger, at + 0.35 + i * T.dur.stagger + T.dur.in), out, title.size) });
      }
      items.forEach((_, k) => {
        const t0 = at + 0.45 + k * T.beat, o = ro[k], r = rows[k];
        const rp = M.E(span(t, t0, t0 + 0.25)), half = (r.width / 2 + 56) * rp, yr = o.y + r.size * 0.82;
        if (rp > 0) {
          M.gline(ctx, (c) => { c.beginPath(); c.moveTo(cx - half, yr); c.lineTo(cx + half, yr); }, 1.6, pal, paint);
          M.diamond(ctx, cx, yr, 5 * rp, pal.gold);
          const lvl = M.ignite(span(t, t0 + 0.2, t0 + 0.9)) * keep;
          for (const s of [-1, 1]) B.draw(ctx, cx + s * (r.width / 2 + 56), o.y, lvl * Math.min(1, rp * 3), 7);
        }
        kit.drawText(ctx, r, { ...o, color: pal.ivory, key: pal.gold,
          each: (w, i, box, c) => {
            const tw = t0 + 0.15 + ranks[k][i] * T.dur.stagger;
            if (M.rise(c, span(t, tw, tw + T.dur.in), out, r.size) === false) return false;
            if (w.key) c.fillStyle = M.metal(c, box.x, box.y - r.size / 2, box.x + box.width, box.y + r.size / 2, pal, M.sheenAt(time, 2.6, k * 0.4), true);
          } });
      });
      ctx.restore();
    },
  };
}
