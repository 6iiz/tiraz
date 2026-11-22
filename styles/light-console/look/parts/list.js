// A list as callouts. A rail of light runs down the reading side; one row per beat a node lights on it, a plate opens beside it and the
// item resolves under the scan bar; key words (*…*) get locked by brackets and take the hue. Below, the subject is an exploded stack:
// one slab per item, and each slab pulls away from the others as its item arrives. spec: { duration, at?, says: { title?, items: [ … ] } }
import { need, span, rgba, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, sub = T.subject;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const railX = rtl ? SAFE.right - 18 : SAFE.left + 18, node = 34, padX = 30, inset = 60;
  const maxW = SAFE.right - SAFE.left - inset - padX * 2;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead, weight: T.weight.lead, maxW: SAFE.right - SAFE.left - inset, single: true, where: 'the list title' }) : null;
  const ph = rows[0].lead + 22, gap = 22, head = title ? title.lead + 30 : 0;
  const top = kit.place(head + items.length * (ph + gap), 600), y0 = top + head;
  const rowAt = (k) => at + 0.2 + k * T.dur.beat;
  const out0 = d - T.dur.out, n = items.length;
  const geo = rows.map((f, k) => {
    const w = f.width + padX * 2, y = y0 + k * (ph + gap), px = rtl ? SAFE.right - inset - w : SAFE.left + inset;
    const o = { x0: px + padX, x1: px + w - padX, y: y + ph / 2, align: 'start' };
    const bx = M.boxes(kit, f, o), keys = bx.filter((b) => b.key);
    const kb = keys.length ? { x0: Math.min(...keys.map((b) => b.x)), x1: Math.max(...keys.map((b) => b.x + b.width)), y0: o.y - f.size * 0.55, y1: o.y + f.size * 0.55 } : null;
    return { f, w, y, px, o, kb };
  });
  const slab = (k) => M.meshes.box(0.95, 0.16, 0.95);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d), alive = 1 - M.I(out);
      // the exploded stack
      const yaw = (t + clock) * 0.35;
      for (let k = 0; k < n; k++) {
        const pull = M.E(span(t, rowAt(k), rowAt(k) + 0.4)), yy = (k - (n - 1) / 2) * (0.36 + 0.34 * pull);
        M.wire(ctx, M.meshes.move(slab(k), 0, -yy, 0), { cx: sub.x, cy: sub.y, s: sub.s * 0.9, a: yaw, b: 0.5, pal, alpha: alive * (0.35 + 0.65 * pull) * Math.min(1, span(t, at, at + 0.3) * 2), hot: Math.max(0, 1 - Math.abs(t - rowAt(k) - 0.2) / 0.25) });
      }
      if (title) {
        kit.drawText(ctx, title, { x0: rtl ? SAFE.left : SAFE.left + inset, x1: rtl ? SAFE.right - inset : SAFE.right, y: top + title.lead / 2, align: 'start', color: pal.soft,
          each: (w, i, box, c) => (out >= 1 ? false : M.resolve(c, span(t, at + i * T.dur.step, at + i * T.dur.step + T.dur.scan), box, title.size, pal, rtl)) });
      }
      // the rail
      const rl = M.E(span(t, at, at + 0.3 + n * T.dur.beat)) * alive, ry0 = y0 - 10, ry1 = y0 + n * (ph + gap) - gap + 10;
      ctx.fillStyle = rgba(pal.hue, 0.55); ctx.fillRect(railX - 1, ry0, 2, (ry1 - ry0) * rl);
      geo.forEach(({ f, w, y, px, o, kb }, k) => {
        const tk = rowAt(k), lit = span(t, tk - 0.05, tk + 0.1) * alive;
        if (lit > 0) {
          const ny = y + ph / 2;
          ctx.save(); ctx.globalAlpha = lit; ctx.strokeStyle = pal.hue; ctx.lineWidth = 2; ctx.fillStyle = rgba(pal.plate, 0.9);
          ctx.fillRect(railX - node / 2, ny - node / 2, node, node); ctx.strokeRect(railX - node / 2, ny - node / 2, node, node);
          ctx.fillStyle = pal.hue; ctx.font = `600 ${T.size.index}px "${mono}"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillText(String(k + 1), railX, ny + 1);
          ctx.fillStyle = rgba(pal.hue, 0.5); ctx.fillRect(rtl ? px + w : railX + node / 2, ny - 1, rtl ? railX - node / 2 - px - w : px - railX - node / 2, 2);
          ctx.restore();
          kit.rec(railX - node / 2, railX + node / 2, ny - node / 2, ny + node / 2, String(k + 1), { decor: true });
        }
        const kp = M.plate(ctx, px, y, w, ph, pal, span(t, tk, tk + T.dur.open), span(t, out0 + k * 0.03, d));
        if (kp <= 0) return;
        const lockT = tk + T.dur.open + 0.3;
        ctx.save(); ctx.beginPath(); const hh = ph * kp; ctx.rect(0, y + (ph - hh) / 2, W, hh); ctx.clip();
        kit.drawText(ctx, f, { ...o, color: pal.white, key: pal.white, each: (w2, i, box, c) => {
          const s0 = tk + T.dur.open * 0.6 + i * T.dur.step, r = M.resolve(c, span(t, s0, s0 + T.dur.scan), box, f.size, pal, rtl);
          if (r === false || typeof r === 'string') return r;
          if (w2.key && t >= lockT) return pal.lock;
        } });
        ctx.restore();
        if (kb) M.brackets(ctx, kb, span(t, lockT - T.dur.lock, lockT), pal, out);
      });
    },
  };
}
