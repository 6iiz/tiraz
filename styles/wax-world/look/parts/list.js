// A list as a stack of toy blocks: each item is a slab of wax with real depth, its words written on the slab's face in the dark
// crayon, and the slabs drop in one per beat and land one under the other, each a little shifted, like blocks a child has lined up.
// The item that holds a key word is a slab of the accent. The title is a row of small quiet solids above the stack.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, C = M.sets(P);
  const D = T.depth.slab, padX = 44, maxText = SAFE.right - SAFE.left - padX * 2 - D - 60;
  const rows = kit.fitAll(items, { size: T.size.item, weight: 800, maxW: maxText, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 700, maxW: SAFE.right - SAFE.left - 60, single: true, where: 'the list title' }) : null;
  const slabH = rows[0].size * 1.75, gap = 22, pitch = slabH + D * 0.69 + gap, head = title ? title.lead + 50 : 0;
  const top = kit.place(head + pitch * items.length, 700);
  const keyed = items.map((s) => /\*[^*]+\*/.test(s));
  const slabs = rows.map((f, k) => {
    const w = Math.max(f.width + padX * 2, 300), c = keyed[k] ? C.key : C.plain;
    const sp = M.solid(W, H, { w, h: slabH, D, ...c, seed: 40 + k * 5, fx: 100 * k, fy: 400,
      draw: (g, col) => { g.fillStyle = col; g.fillRect(0, 0, w, slabH); },
      decorate: (g) => kit.drawText(g, f, { x0: padX, x1: w - padX, y: slabH / 2, align: 'center', color: P.night, key: P.night, decor: true }) });
    const shift = (k % 2 ? -1 : 1) * 16, xr = rtl ? SAFE.right - 20 - shift : SAFE.left + 20 + D + shift;
    const x = rtl ? xr - w : xr, y = top + head + k * pitch;
    return { sp, x, y, w, text: f.rows[0].words.map((q) => q.w).join(' ') };
  });
  const T1 = title ? M.solidText(kit, W, H, title, { x0: SAFE.left + 20, x1: SAFE.right - 20, y: top + title.lead / 2, align: 'start', D: T.depth.small, colours: { plain: C.dim, key: C.key }, seed: 5 }) : [];
  const R1 = title ? M.rowsOf(T1, title.size) : [];
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const ts = ground.step(t), dx = -ground.cam(t) * 0.3;
      if (title) M.words(ctx, kit, T1, R1, ts, (k) => at + k * T.dur.gap, { dx, h: 90, dur: T.dur.drop });
      for (let k = slabs.length - 1; k >= 0; k--) {        // drawn bottom first, so an upper slab's depth falls over the one below
        const s = slabs[k], t0 = at + 0.2 + k * T.dur.beat, p = span(ts, t0, t0 + T.dur.drop);
        M.place(ctx, s.sp, s.x - s.sp.ox + dx, s.y - s.sp.oy, M.drop(p, T.drop), s.y + slabH);
        if (p >= 0.7) kit.rec(s.x + dx + padX, s.x + s.w + dx - padX, s.y + slabH / 2 - rows[k].size * 0.7, s.y + slabH / 2 + rows[k].size * 0.7, s.text);
      }
    },
  };
}
