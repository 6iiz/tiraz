// A list is a parts list. The specimen sits on the upper sheet, cut open; under it, a ruled parts table. On each beat a numbered
// balloon is placed on the drawing with its leader, and the matching row is inked into the table with the same number. The item with
// a key word is the one the accent path belongs to: its balloon points at the path and its key words are underlined by it.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, n = items.length;
  const g = { cx: W / 2 - 30, cy: 450, L: 560, R: 92 };
  const numW = 80, x0 = SAFE.left, x1 = SAFE.right, tx0 = rtl ? x0 : x0 + numW + 20, tx1 = rtl ? x1 - numW - 20 : x1;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: x1 - x0, minScale: 0.92, minPx: 44, where: 'the list title' }) : null;
  let y = g.cy + g.R + 100;
  const yTitle = title ? y + title.lead / 2 : 0; if (title) y += title.height + 6;
  const pitch = Math.min(130, (SAFE.bottom - 10 - y) / n), yRow = (k) => y + pitch * (k + 0.5), yTop = y;
  const keyItem = items.findIndex((s) => /\*/.test(s));
  const t0 = (k) => at + 0.3 + k * 0.5, out0 = d - T.dur.out;
  const others = ['coil', 'shell', 'tube', 'end'];
  let o = 0; const target = items.map((_, k) => (k === keyItem ? 'path' : others[o++ % 4]));
  const spots = items.map((_, k) => [g.cx - g.L / 2 - 40 + (k + 0.5) * (g.L + 120) / n, g.cy - g.R - 95]);
  const boxes = rows.map((r, k) => M.boxes(kit, r, tx0, tx1, yRow(k)));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, out0, d);
      ctx.save(); ctx.globalAlpha = 1 - q;
      const f0 = keyItem >= 0 ? t0(keyItem) - 0.35 : at + 0.4;
      const pts = M.specimen(ctx, pal, g, { draw: span(t, at - 0.2, at + 0.35), cut: M.E(span(t, at + 0.05, at + 0.6)), flow: t, flowP: span(t, f0, f0 + 0.5), plug: 0, rtl });
      // the table: a top rule, a column rule, a hairline under each row as it arrives
      const tw = (x1 - x0) * M.soft(span(t, at, at + 0.4));
      ctx.fillStyle = pal.ink; ctx.fillRect(rtl ? x1 - tw : x0, yTop, tw, 2.5);
      const cx = rtl ? x1 - numW : x0 + numW, ch = pitch * n * M.soft(span(t, at + 0.1, at + 0.5));
      ctx.fillRect(cx, yTop, 1.5, ch);
      items.forEach((_, k) => {
        const p = span(t, t0(k) - 0.1, t0(k) + 0.25), rw = (x1 - x0) * M.soft(p);
        ctx.fillStyle = pal.grey; ctx.fillRect(rtl ? x1 - rw : x0, yRow(k) + pitch / 2, rw, 1.2);
        M.balloon(ctx, pal, mono, pts[target[k]], spots[k], k + 1, span(t, t0(k) - 0.2, t0(k) + 0.2));
        if (p > 0) {
          const bx = rtl ? x1 - numW / 2 : x0 + numW / 2, by = yRow(k), r = 22 * M.soft(p * 2);
          ctx.strokeStyle = pal.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.stroke();
          ctx.save(); ctx.fillStyle = pal.ink; ctx.font = `600 22px "${mono}"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
          ctx.globalAlpha = (1 - q) * span(t, t0(k), t0(k) + 0.1); ctx.fillText(String(k + 1), bx, by + 1); ctx.restore();
        }
        if (k === keyItem) M.keyRuns(boxes[k]).forEach((run) => {
          const w = (run.x1 - run.x0) * M.soft(span(t, t0(k) + 0.15, t0(k) + 0.45)), yu = run.y + rows[k].size * 0.72;
          ctx.fillStyle = pal.path; ctx.fillRect(rtl ? run.x1 - w : run.x0, yu - 3, w, 6);
          if (w >= run.x1 - run.x0 - 1) M.arrowHead(ctx, rtl ? run.x0 - 8 : run.x1 + 8, yu, rtl ? Math.PI : 0, 18, pal.path);
        });
      });
      ctx.restore();
      if (title) kit.drawText(ctx, title, { x0, x1, y: yTitle, align: 'start', color: pal.grey,
        each: (w, i, box, c) => { if (M.inked(c, t, at + i * 0.05, T.dur.word, out0, d, box, title.size, rtl) === false) return false; } });
      items.forEach((_, k) => kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: yRow(k), align: 'start', color: pal.ink, key: pal.key,
        each: (w, i, box, c) => { if (M.inked(c, t, t0(k) + 0.05 + i * 0.05, T.dur.word, out0, d, box, rows[k].size, rtl) === false) return false; } }));
    },
  };
}
