// A list as a strip of panels: each item is its own long panel, inked in on the beat in reading order, its number in a solid ink
// square on the reading side and its words stamped on beside it. The far end of each panel carries a dot tone that stops short of the
// words. A key word (*…*) is lettered as a sound effect. The title sits in a narration box above. spec: { duration, at?, says: { title?, items } }
import { need, span } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const X0 = T.text.x0, X1 = T.text.x1, sq = 66, indent = sq + 30;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: X1 - X0 - indent - 20, single: true, where: 'a list item' });
  const title = spec.says.title ? M.balanced(kit, spec.says.title, { size: T.size.title, weight: 700, maxW: X1 - X0 - 60, minScale: 0.88, where: 'the list title' }) : null;
  const tw = title ? title.width + 56 : 0, th = title ? title.height + 26 : 0, head = title ? th + 40 : 0;
  const ph = rows[0].lead + 40, gap = 24, n = items.length;
  const top = kit.place(head + n * (ph + gap) - gap, 760), y0 = top + head, m = 34;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const panels = items.map((_, k) => {
    const ya = y0 + k * (ph + gap), yb = ya + ph, s = k % 2 ? 7 : -7;
    return rtl ? [[W - m, ya + s], [m, ya - s], [m, yb - s], [W - m, yb + s]] : [[m, ya + s], [W - m, ya - s], [W - m, yb - s], [m, yb + s]];
  });
  const yEnd = y0 + n * (ph + gap) - gap;
  const frameTop = top > 220 ? [[W - m, m], [m, m], [m, top - 40 + 9], [W - m, top - 40 - 9]] : null;
  const frameLow = [[W - m, yEnd + 44 - 9], [m, yEnd + 44 + 9], [m, H - m], [W - m, H - m]];
  const toneTop = M.tone(W, Math.max(60, top), T.tone.cell, (u, v) => 0.1 + 0.45 * (1 - u) * v, P.ink);
  const toneLow = M.tone(W, H - yEnd, T.tone.cell, (u, v) => 0.05 + 0.3 * v * u, P.ink);
  const rush = M.speed(W, H - yEnd, 60, 77, P.ink);
  const tones = rows.map((r) => {                                    // the tone fades in from the far end and stops 120 px short of the words
    const stop = ((rtl ? X1 - indent - r.width : W - (X0 + indent + r.width)) - 120) / W;
    return M.tone(W, ph + 30, T.tone.cell, (u, v) => { const q = rtl ? u : 1 - u; return q > stop ? 0 : 0.08 + 0.5 * (1 - q / stop) * (0.7 + 0.3 * v); }, P.ink);
  });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ctx.save(); M.camera(ctx, W, H, span(t, 0, d));
      const fa = 1, fb = 1;
      if (frameTop) M.panel(ctx, frameTop, fa, P.ink, fa > 0.5 ? () => ctx.drawImage(toneTop, 0, 0) : null);
      M.panel(ctx, frameLow, fb, P.ink, fb > 0.5 ? () => { ctx.drawImage(toneLow, 0, yEnd); ctx.drawImage(rush, 0, yEnd); } : null);
      if (title) {
        ctx.save();
        if (M.stamp(ctx, span(t, at, at + T.dur.stamp), rtl ? X1 : X0, top, 0.12) !== false) {
          const bx = rtl ? X1 - tw : X0;
          M.box(ctx, bx, top, tw, th, P);
          kit.drawText(ctx, title, { x0: bx + 28, x1: bx + tw - 28, y: top + 13 + title.lead / 2, align: 'start', color: P.ink });
        }
        ctx.restore();
      }
      items.forEach((_, k) => {
        const t0 = at + 0.2 + k * T.beat, ink = span(t, t0, t0 + T.dur.ink);
        if (ink <= 0) return;
        const pts = panels[k], ya = y0 + k * (ph + gap), ym = ya + ph / 2;
        M.panel(ctx, pts, ink, P.ink, ink > 0.5 ? () => ctx.drawImage(tones[k], 0, ya - 15) : null);
        const pt = span(t, t0 + 0.12, t0 + 0.12 + T.dur.stamp);
        if (pt <= 0) return;
        const sx = rtl ? X1 - sq : X0;
        ctx.save(); M.stamp(ctx, pt, sx + sq / 2, ym, 0.25);
        ctx.fillStyle = P.ink; ctx.fillRect(sx, ym - sq / 2, sq, sq);
        ctx.font = `800 ${T.size.index}px "${mono}"`; ctx.fillStyle = P.paper; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
        ctx.fillText(String(k + 1), sx + sq / 2, ym + 2); ctx.restore();
        kit.rec(sx, sx + sq, ym - sq / 2, ym + sq / 2, String(k + 1), { decor: true });
        kit.drawText(ctx, rows[k], { x0: rtl ? X0 : X0 + indent, x1: rtl ? X1 - indent : X1, y: ym, align: 'start', color: P.ink, key: P.accent,
          each: (w, i, b, c) => { M.stamp(c, pt, b.x + b.width / 2, b.y, w.key ? 0.4 : 0.15); if (w.key) return M.sfx(c, w, b, rows[k].size, P); } });
      });
      ctx.restore();
    },
  };
}
