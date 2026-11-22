// A list as the channels of a scope. Each item has its own channel: one per beat the beam draws a flat line in from the far edge of the
// screen, kicks it into a square pulse, and runs it up to the item, which lights as the beam arrives. Channel numbers sit at the far
// edge. Key words (*…*) are in the full beam colour. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, g = ground.g;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const lane = 230, x0 = rtl ? SAFE.left + lane : SAFE.left, x1 = rtl ? SAFE.right : SAFE.right - lane;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead, weight: T.weight.lead, maxW: SAFE.right - SAFE.left, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(g.div, rows[0].lead + 30), head = title ? title.lead + 40 : 0;
  const top = kit.place(head + pitch * items.length, 720);
  const sTitle = title && M.lightText(kit, title, { x0: SAFE.left, x1: SAFE.right, y: top + title.lead / 2, align: 'start' }, pal, T, pal.soft);
  const tRun = 0.32, out0 = d - T.dur.out;
  const ch = rows.map((f, k) => {
    const y = top + head + k * pitch + pitch / 2, s = M.lightText(kit, f, { x0, x1, y, align: 'start' }, pal, T);
    const edge = rtl ? SAFE.right - f.width - 26 : SAFE.left + f.width + 26, far = rtl ? g.x0 + 50 : g.x1 - 50;
    const kick = far + (edge - far) * 0.55, hi = 24, base = y + 4;
    const pts = M.curve(far, edge, (x) => base - ((rtl ? x > kick && x < kick + 60 : x < kick && x > kick - 60) ? hi : 0), 3);
    return { f, y, s, pts, far, t0: at + 0.2 + k * T.dur.beat };
  });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const fade = t < out0 ? 1 : Math.exp(-(t - out0) / 0.09);
      if (sTitle) sTitle.draw(ctx, () => (t >= at ? M.cool(t - at, T.dur.tau, 0.75) * fade : 0), () => M.cool(t - at, T.dur.heat, 0));
      ch.forEach(({ s, pts, far, y, t0 }, k) => {
        if (t < t0) return;
        const head = span(t, t0, t0 + tRun), tOn = t0 + tRun;
        M.trace(ctx, pts, pal, { head, alpha: fade, width: 2.4, age: (i) => M.cool(t - (t0 + tRun * i / pts.length), T.dur.tau, 0.45) });
        ctx.save(); ctx.globalAlpha = fade; ctx.font = `600 ${T.size.index}px "${mono}"`; ctx.fillStyle = pal.soft; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        ctx.textAlign = rtl ? 'right' : 'left'; ctx.fillText(String(k + 1), rtl ? far - 14 : far + 14, y + 4); ctx.restore();
        kit.rec(rtl ? far - 40 : far + 14, rtl ? far - 14 : far + 40, y - 12, y + 16, String(k + 1), { decor: true });
        s.draw(ctx, () => (t >= tOn ? M.cool(t - tOn, T.dur.tau, 0.75) * fade : 0), () => M.cool(t - tOn, T.dur.heat, 0));
      });
    },
  };
}
