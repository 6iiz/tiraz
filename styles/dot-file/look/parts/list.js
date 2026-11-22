// A list as numbered exhibits: each item is stamped onto the page one per beat, its exhibit number in the mono face reversed out of a
// small ink badge on the reading side, a row of halftone dots ruled under it. A key word (*…*) is stamped on an accent rubber block.
// The title is set in paper on an ink file chip above. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, wear = M.wearTile(P.paper, 57);
  const maxW = SAFE.right - SAFE.left, badge = 64, textW = maxW - badge - 50;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: textW, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead, weight: T.weight.lead, maxW: maxW - 60, single: true, where: 'the list title' }) : null;
  const chipH = title ? title.lead + 20 : 0, chipW = title ? title.width + 60 : 0, head = title ? chipH + 50 : 0;
  const pitch = rows[0].lead + 34;
  const top = kit.place(head + pitch * items.length, 720), y0 = top + head;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const tx0 = rtl ? SAFE.left : SAFE.left + badge + 34, tx1 = rtl ? SAFE.right - badge - 34 : SAFE.right;
  const dotRow = (() => { const c = document.createElement('canvas'); c.width = maxW; c.height = 10; const g = c.getContext('2d'); g.fillStyle = P.dotInk;
    for (let x = 5; x < maxW; x += 14) { const r = 1.4 + 2.2 * (0.5 + 0.5 * Math.sin(x * 0.02)); g.beginPath(); g.arc(rtl ? maxW - x : x, 5, r, 0, Math.PI * 2); g.fill(); } return c; })();
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const q = span(t, d - 0.32, d);
      if (title) {
        const cx = rtl ? SAFE.right - chipW : SAFE.left;
        ctx.save();
        if (M.slam(ctx, (t - at) / 0.16, q, cx + chipW / 2, top + chipH / 2, 0.3) !== false) {
          M.chip(ctx, cx, top, chipW, chipH, P, rtl);
          kit.drawText(ctx, title, { x0: cx + 30, x1: cx + chipW - 30, y: top + chipH / 2, align: 'start', color: P.onInk });
        }
        ctx.restore();
      }
      items.forEach((_, k) => {
        const t0 = at + 0.25 + k * T.beat, ym = y0 + k * pitch + pitch / 2, qk = span(t, d - 0.34 + k * 0.025, d);
        ctx.save();
        if (M.slam(ctx, (t - t0) / 0.16, qk, W / 2, ym, 0.22, k % 2 ? 0.006 : -0.006) !== false) {
          ctx.drawImage(dotRow, SAFE.left, ym + pitch / 2 - 8);
          const bx = rtl ? SAFE.right - badge : SAFE.left;
          ctx.fillStyle = P.ink; ctx.fillRect(bx, ym - badge / 2, badge, badge);
          ctx.font = `700 ${T.size.index}px "${mono}"`; ctx.fillStyle = P.onInk; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
          ctx.fillText(String(k + 1).padStart(2, '0'), bx + badge / 2, ym + 2);
          kit.rec(bx, bx + badge, ym - badge / 2, ym + badge / 2, String(k + 1), { decor: true });
          kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ym, align: 'start', color: P.ink, key: P.onAccent,
            each: (w, i, box, c) => {
              if (!w.key) return;
              if (M.slam(c, (t - t0 - 0.22) / 0.16, 0, box.x + box.width / 2, box.y, 0.5, -0.03) === false) return false;
              const px = rows[k].space * 0.5; M.stampBlock(c, box.x - px, box.y - rows[k].size * 0.72, box.width + px * 2, rows[k].size * 1.44, P, wear);
              return P.onAccent;
            } });
        }
        ctx.restore();
      });
    },
  };
}
