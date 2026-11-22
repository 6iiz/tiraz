// A number as a big solid of wax: the numeral is a deep block, face in firm wax and sides hatched dark, that drops in, lands with a
// squash and then counts up to its value in stepped drawings (each value is its own crayon solid, made once). A slab of the accent
// lands under it like a plinth, the label is a row of small solids below, and the number's shadow lies on the floor.
// spec: { duration, at?, decimals?, says: { value, label, prefix?, suffix? } }
import { need, span, countValue, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the count spec'); need(spec.says, ['value', 'label'], 'the count spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, S = spec.says;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.pal, C = M.sets(P);
  const text = (v) => (S.prefix ?? '') + kit.fmt(v, spec.decimals ?? 0) + (S.suffix ?? '');
  let size = T.size.count; while (kit.numberWidth(text(S.value), size, 900, 1) > 760 && size > 110) size -= 8;
  const label = kit.fit(S.label, { size: T.size.label, weight: 700, maxW: SAFE.right - SAFE.left - 60, minScale: 0.7, where: 'the count label' });
  const yNum = 560, D = T.depth.count, cx = W / 2;
  const sprites = new Map();
  const numeral = (s, settle) => {
    const k = s + '|' + settle; if (sprites.has(k)) return sprites.get(k);
    const w = kit.numberWidth(s, size, 900, settle) + 20, h = size * 1.2;
    const sp = M.solid(W, H, { w, h, D, ...C.plain, seed: 3, fx: cx, fy: yNum,
      draw: (g, c) => kit.number(g, s, { x: w / 2, y: h / 2, size, color: c, align: 'center', settle, decor: true }) });
    sprites.set(k, sp); return sp;
  };
  const slabW = Math.min(820, kit.numberWidth(text(S.value), size, 900, 1) + 200), slabH = 34;
  const slab = M.solid(W, H, { w: slabW, h: slabH, D: 30, ...C.key, seed: 9, draw: (g, c) => { g.fillStyle = c; g.fillRect(0, 0, slabW, slabH); } });
  const ySlab = yNum + size * 0.6 + 6, yLabel = ySlab + slabH + 30 + 50 + label.lead / 2;
  const L = M.solidText(kit, W, H, label, { x0: SAFE.left + 30, x1: SAFE.right - 30, y: yLabel, D: T.depth.label, colours: { plain: C.plain, key: C.key }, seed: 21 });
  const R = M.rowsOf(L, label.size), shadow = M.smudge(W, H, slabW * 0.9, P.shadow, 2);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const ts = ground.step(t), dx = -ground.cam(t) * 0.3;
      const ps = span(ts, at, at + T.dur.drop);
      if (ps > 0) { ctx.save(); ctx.globalAlpha = ps; ctx.drawImage(shadow, cx - shadow.width / 2 + dx * 1.6 - 40, ground.horizon + 70 - shadow.height / 2); ctx.restore(); }
      M.place(ctx, slab, cx - slabW / 2 - slab.ox + dx, ySlab - slab.oy, M.drop(ps, T.drop));
      const pn = span(ts, at + 0.12, at + 0.12 + T.dur.drop), pc = span(ts, at + 0.5, at + 1.5);
      if (pn > 0) {
        const s = text(countValue(0, S.value, pc)), sp = numeral(s, pc >= 1 ? 1 : 0);
        M.place(ctx, sp, cx - sp.w / 2 - sp.ox + dx, yNum - sp.h / 2 - sp.oy, M.drop(pn, T.drop), yNum + sp.h / 2);
        if (pn >= 0.7) kit.rec(cx - sp.w / 2 + dx, cx + sp.w / 2 + dx, yNum - size * 0.6, yNum + size * 0.6, s);
      }
      M.words(ctx, kit, L, R, ts, (k) => at + 0.45 + k * T.dur.gap, { dx, h: T.drop * 0.7, dur: T.dur.drop });
    },
  };
}
