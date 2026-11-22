// A list as a collage: the title on a dark label slip, then one torn paper slip per item, put down and pressed one per beat, each
// turned a little the other way from the one above, with its number in an inked circle like a stamp at its reading end. An item
// with a key word (*…*) is cut from the accent instead. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const stamp = 54;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: T.textW - stamp - 60, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: T.textW - 40, single: true, where: 'the list title' }) : null;
  const sh = rows[0].lead + 22, gap = 22, tw = title ? title.width + 60 : 0, th = title ? title.lead + 24 : 0;
  const block = (title ? th + 30 : 0) + items.length * (sh + gap) - gap, top = Math.min(kit.place(block, 660), T.floor - block);
  const y0 = top + (title ? th + 30 : 0), keyed = items.map((s) => /\*[^*]+\*/.test(s));
  const sw = rows.map((r) => Math.max(320, r.width + stamp + 90));
  const shapes = rows.map((r, k) => M.torn(sw[k], sh, 61 + k, 10)), titleS = title ? M.torn(tw, th, 71, 8) : null;
  const side = (w) => W / 2 + (rtl ? 1 : -1) * (T.textW + 60 - w) / 2;                  // slips stand against the reading edge
  return {
    duration: spec.duration,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const tt = M.twos(t);
      if (title) M.piece(ctx, P, M.press(span(tt, at, at + T.dur.press), -1.4, -1), side(tw), top + th / 2, titleS, (c) => {
        M.slip(c, P, titleS, P.ink); kit.drawText(c, title, { x0: -title.width / 2, x1: title.width / 2, y: 0, color: P.paper, key: P.paper });
      });
      items.forEach((_, k) => {
        const t0 = at + 0.2 + k * T.beat, w = sw[k], fill = keyed[k] ? P.accent : P.paper, ink = keyed[k] ? P.onAccent : P.ink;
        M.piece(ctx, P, M.press(span(tt, t0, t0 + T.dur.press), k % 2 ? 1.2 : -1.0, k % 2 ? 1 : -1), side(w), y0 + k * (sh + gap) + sh / 2, shapes[k], (c) => {
          M.slip(c, P, shapes[k], fill);
          const sx = rtl ? w / 2 - 22 - stamp / 2 : -w / 2 + 22 + stamp / 2;
          c.fillStyle = P.ink; c.beginPath(); c.arc(sx, 0, stamp / 2, 0, Math.PI * 2); c.fill();
          c.strokeStyle = fill; c.lineWidth = 2; c.beginPath(); c.arc(sx, 0, stamp / 2 - 6, 0, Math.PI * 2); c.stroke();
          c.fillStyle = P.paper; c.font = `700 28px "${mono}"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'ltr'; c.fillText(String(k + 1), sx, 2);
          const x0 = rtl ? -w / 2 + 30 : -w / 2 + 44 + stamp, x1 = rtl ? w / 2 - 44 - stamp : w / 2 - 30;
          kit.drawText(c, rows[k], { x0, x1, y: 0, align: 'start', color: ink, key: ink });
        });
      });
    },
  };
}
