// A list as the contents of one open tray: the belt pulls the tray in with every item still a faint low-energy ghost; then the operator
// steps through them, one per beat: the dashed selection box jumps onto the row and the row comes up to full penetration (dense ink).
// A key phrase in a row is switched to inverse when its row is checked. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const x0 = SAFE.left + T.pad, x1 = SAFE.right - T.pad, tag = 54;
  const tx0 = rtl ? x0 : x0 + tag + 20, tx1 = rtl ? x1 - tag - 20 : x1;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead, weight: 600, maxW: x1 - x0, minPx: T.minPx, where: 'the list title' }) : null;
  const pitch = rows[0].size * 1.8, tH = title ? title.height + 20 : 0;
  const hBox = tH + pitch * items.length + T.pad * 2, top = kit.place(hBox, 720);
  const box = { x: SAFE.left, y: top, w: SAFE.right - SAFE.left, h: hBox }, shell = M.bag(box.w, box.h, pal, 5);
  const ys = items.map((_, k) => top + T.pad + tH + pitch * k + pitch / 2);
  const tStop = at + T.dur.belt, t0s = items.map((_, k) => tStop + 0.05 + k * T.dur.beat), out0 = d - T.dur.out;
  const runs = rows.map((r, k) => M.keyRuns(r, { x0: tx0, x1: tx1, y: ys[k], align: 'start', rtl }));
  const tagX = rtl ? x1 - tag : x0;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx);
      const off = M.belt(t, at, T.dur.belt, out0, W, ground.dir), running = Math.min(1, Math.abs(off) / 60);
      ctx.save(); ctx.beginPath();
      ctx.rect(rtl ? 0 : ground.sensorX, ground.top, rtl ? ground.sensorX : W - ground.sensorX, ground.bottomY - ground.top); ctx.clip();
      ground.items(ctx, off); ctx.translate(off, 0);
      ctx.drawImage(shell.cv, box.x - shell.pad, box.y - shell.pad);
      if (title) kit.drawText(ctx, title, { x0, x1, y: top + T.pad + title.lead / 2, align: 'start', decor: Math.abs(off) > 1, color: pal.soft });
      // the selection box travels from row to row
      let cur = -1; t0s.forEach((t0, k) => { if (t >= t0) cur = k; });
      items.forEach((_, k) => {
        const on = M.outC(span(t, t0s[k], t0s[k] + 0.22));
        // the item's tag: an empty square that fills dense when checked
        ctx.strokeStyle = on > 0.5 ? pal.ink : pal.ghost; ctx.lineWidth = 3; ctx.strokeRect(tagX + 8, ys[k] - 19, 38, 38);
        if (on > 0) { ctx.fillStyle = pal.mixed; const s = 26 * on; ctx.fillRect(tagX + 27 - s / 2, ys[k] - s / 2, s, s); }
        runs[k].forEach((r) => M.inverse(ctx, pal, r, span(t, t0s[k] + 0.1, t0s[k] + 0.35), rtl));
        const col = on >= 1 ? pal.ink : (on > 0 ? pal.soft : pal.ghost);
        kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ys[k], align: 'start', decor: Math.abs(off) > 1, color: col, key: col,
          each: (w) => (w.key && t >= t0s[k] + 0.22 ? pal.light : undefined) });
      });
      if (cur >= 0) {
        const k = cur, jump = M.outC(span(t, t0s[k], t0s[k] + 0.2)), yPrev = k > 0 ? ys[k - 1] : ys[0] - pitch;
        const y = yPrev + (ys[k] - yPrev) * jump, h = rows[k].size * 1.35;
        M.select(ctx, pal, x0 - 24, y - h / 2, x1 - x0 + 48, h, k === 0 ? span(t, t0s[0], t0s[0] + 0.25) : 1, t);
      }
      ctx.restore();
      ground.sensor(ctx, running);
    },
  };
}
