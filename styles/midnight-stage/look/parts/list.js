// A list as wagons rolled on from the wings: each item is a low sign plate that rolls in from the side curtains, alternately left and
// right, one per beat, and stops; a follow-spot travels to each one as it lands. An item with a key phrase gets a marquee of bulbs
// round that phrase. The title (optional) is lit on the wall above. At the end the wagons roll off and the light goes down.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, lerp, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const padX = 56, rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: maxW - padX * 2 - 40, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW, minScale: 0.9, where: 'the list title' }) : null;
  const ph = rows[0].size * 1.5 + 34, gap = 30, head = title ? title.height + 46 : 0;
  const top = kit.place(head + (ph + gap) * items.length - gap, 730), y0 = top + head;
  const pw = Math.min(maxW, Math.max(...rows.map((r) => r.width)) + padX * 2 + 40);
  const boxes = rows.map((f, k) => M.layout(kit, f, { x0: (W - pw) / 2 + padX, x1: (W + pw) / 2 - padX, y: y0 + k * (ph + gap) + ph / 2, align: 'center' }));
  const runs = boxes.map((b) => M.keyRuns(b));
  const bulb = M.bulbSprite(pal), sprite = M.pool(pal.light, 800, 0.13, 0.75);
  const inAt = (k) => at + 0.2 + k * T.beat, roll = T.dur.roll;
  const outP = (t, k) => span(t, d - T.dur.out - 0.05 * (items.length - 1 - k), d - 0.05 * (items.length - 1 - k));
  const ym = (k) => y0 + k * (ph + gap) + ph / 2;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      // the follow-spot moves to the newest wagon
      let k = 0; while (k + 1 < items.length && t >= inAt(k + 1)) k++;
      const prev = Math.max(0, k - 1), mv = M.IN(span(t, inAt(k), inAt(k) + roll)), sy = k === 0 ? ym(0) : lerp(ym(prev), ym(k), mv);
      const spotOn = M.IN(span(t, at, at + 0.4)) * (1 - M.OUT(span(t, d - T.dur.out, d)));
      M.spot(ctx, sprite, W / 2, sy, (pw / 2 + 120) * spotOn, (ph + 100) * spotOn);
      if (title) {
        const q = M.IN(span(t, at, at + 0.35)) * (1 - M.OUT(span(t, d - T.dur.out, d)));
        if (q > 0) kit.drawText(ctx, title, { x0, x1, y: top + title.lead / 2, align: 'center', color: pal.dim, each: () => M.lit(pal, q, pal.dim) });
      }
      ctx.save(); ctx.beginPath(); ctx.rect(M.LEGS, 0, W - 2 * M.LEGS, H); ctx.clip();      // wagons come out of the wings
      items.forEach((_, i) => {
        const p = M.FLY(span(t, inAt(i), inAt(i) + roll)), o = M.OUT(outP(t, i)); if (p <= 0 || o >= 1) return;
        const side = (i % 2 === 0) === rtl ? 1 : -1, dx = side * ((1 - p) - o) * (W / 2 + pw / 2 + 20);
        const y = ym(i), xa = (W - pw) / 2 + dx;
        ctx.save(); ctx.translate(dx, 0);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(xa - dx + 10, y + ph / 2, pw - 20, 10);
        ctx.fillStyle = pal.plate; ctx.fillRect((W - pw) / 2, y - ph / 2, pw, ph);
        ctx.strokeStyle = pal.rim; ctx.lineWidth = 2; ctx.strokeRect((W - pw) / 2 + 8, y - ph / 2 + 8, pw - 16, ph - 16);
        for (const run of runs[i]) M.marquee(ctx, pal, bulb, run.x0 - rows[i].space * 0.45, y - ph / 2 + 2, run.x1 + rows[i].space * 0.45, y + ph / 2 - 2, t + clock, span(t, inAt(i) + roll * 0.6, inAt(i) + roll * 0.6 + T.dur.marquee), true, false);
        kit.drawText(ctx, rows[i], { x0: (W - pw) / 2 + padX, x1: (W + pw) / 2 - padX, y, align: 'center', color: pal.light, key: pal.light, decor: Math.abs(dx) > 4 });
        ctx.restore();
      });
      ctx.restore();
    },
  };
}
