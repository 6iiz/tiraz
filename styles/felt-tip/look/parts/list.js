// A checklist on its own sheet: for each item, one per beat, a box is drawn with the black marker (four strokes, corners overshot),
// the item is lettered beside it, and the coloured marker ticks the box. An item's key word gets a colour-in block behind it. The
// title, when there is one, is lettered in the grey marker and underlined. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const full = SAFE.right - SAFE.left, bx = 64, gapX = 34;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: full - bx - gapX - 20, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: T.weight.lead, maxW: full - 20, single: true, where: 'the list title' }) : null;
  const pitch = Math.max(rows[0].lead + 26, bx + 40), head = title ? title.lead + 50 : 0;
  const top = kit.place(head + pitch * items.length, 720), y0 = top + head;
  const st = title ? M.schedule(title, at, T.write.lead) : null;
  const tUnder = title ? M.hand([rtl ? SAFE.right : SAFE.left, top + title.lead - 6], [rtl ? SAFE.right - title.width - 20 : SAFE.left + title.width + 20, top + title.lead - 2], 70, 2) : null;
  const t0 = (k) => (st ? st.end + 0.15 : at + 0.1) + k * T.dur.item;
  const boxX0 = rtl ? SAFE.right - bx : SAFE.left, boxX1 = boxX0 + bx;
  const boxes = items.map((_, k) => { const ym = y0 + k * pitch + pitch / 2; return M.box(boxX0, ym - bx / 2, boxX1, ym + bx / 2, 80 + k * 7, 9); });
  const ticks = items.map((_, k) => { const ym = y0 + k * pitch + pitch / 2, x = boxX0 + bx / 2; return [[x - 22, ym - 4], [x - 6, ym + 16], [x + 30, ym - 30]]; });
  const ss = rows.map((f, k) => M.schedule(f, t0(k) + 0.32, T.write.item));
  const fills = rows.map((f, k) => {
    const o = {}; let i = 0;
    f.rows.forEach((r) => r.words.forEach((w) => { if (w.key) o[i] = M.fillIn(0, 0, w.width + f.size * 0.3, f.size * 0.9, T.pen.fill, rtl, 90 + k * 5 + i); i++; }));
    return o;
  });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      if (title) {
        kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: top + title.lead / 2 - 10, align: 'start', color: P.grey, each: (w, j, b, c) => M.letter(c, t, st.at(j), w, b, title, P.grey, rtl) });
        M.marker(ctx, tUnder, span(t, st.end, st.end + 0.2), P.grey, T.pen.thin);
      }
      items.forEach((_, k) => {
        const tk = t0(k), ym = y0 + k * pitch + pitch / 2;
        boxes[k].forEach((s, j) => M.marker(ctx, s, span(t, tk + j * 0.07, tk + j * 0.07 + 0.08), P.ink, T.pen.thin));
        kit.drawText(ctx, rows[k], { x0: rtl ? SAFE.left : boxX1 + gapX, x1: rtl ? boxX0 - gapX : SAFE.right, y: ym, align: 'start', color: P.ink, key: P.ink,
          each: (w, j, b, c) => {
            const sp = ss[k].at(j);
            if (fills[k][j]) {
              const ox = b.x - rows[k].size * 0.15, oy = b.y - rows[k].size * 0.45;
              M.marker(c, fills[k][j].map(([x, y]) => [x + ox, y + oy]), span(t, sp[0] - 0.25, sp[0]), P.pen, T.pen.fill, T.pen.tint);
            }
            return M.letter(c, t, sp, w, b, rows[k], P.ink, rtl);
          } });
        M.marker(ctx, ticks[k], span(t, ss[k].end, ss[k].end + 0.16), P.pen, T.pen.line);
      });
    },
  };
}
