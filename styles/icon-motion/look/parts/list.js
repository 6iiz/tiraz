// A list: up to five rows, each led by one cell of the pattern (its motif in the accent tones) on the reading side. Every row slides
// in sideways out of its mask on its own beat, the cell first, the words just behind it; the stage disc's list pictogram lights one
// more bar each time. A key phrase rides on one accent capsule. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, S = ground.stage, C = 84;
  const x0 = SAFE.left, x1 = SAFE.right, indent = C + 40;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0 - indent - 30 - M.keyRoom(T.size.item), single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: x1 - x0, minScale: 0.88, where: 'the list title' }) : null;
  const pitch = Math.max(C + 26, rows[0].size * 1.75), tH = title ? title.height + 34 : 0, block = tH + pitch * items.length;
  const top = Math.min(kit.place(block, 680), T.textBottom - block);
  const n = items.length, room = Math.max(0.3, Math.min(0.5, (d - 1.2) / n));     // one row per beat when there is time
  const t0 = (k) => at + 0.15 + k * room;
  const o0 = d - T.dur.out - 0.06 * n, out = (k) => (t) => span(t, o0 + k * 0.05, o0 + k * 0.05 + T.dur.out);
  // each row's cell: a little canvas cut from the pattern sheet, so the bullets are the ground's own motifs
  const cells = items.map((_, k) => ({ sx: ((k * 3 + 2) % 9) * ground.C, sy: (k % 2 ? 5 : 3) * ground.C }));
  const travel = (x1 - x0) + 80, dir = kit.rtl ? 1 : -1;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      let shown = 0; for (let k = 0; k < n; k++) if (t >= t0(k) + 0.2) shown = k + 1;
      M.stage(ctx, S.x, S.y, S.r, P); M.sheetIcon(ctx, S.x, S.y, S.r, P, n, shown);
      if (title) M.slideText(ctx, kit, title, { x0, x1, y: top + title.lead / 2, color: P.grey, P, keyed: false,
        rowIn: (r) => span(t, at + r * 0.08, at + r * 0.08 + T.dur.row), rowOut: (r) => span(t, o0 - 0.05, o0 - 0.05 + T.dur.out) });
      items.forEach((_, k) => {
        const ym = top + tH + k * pitch + pitch / 2, pin = span(t, t0(k), t0(k) + T.dur.row), po = out(k)(t);
        if (pin <= 0 || po >= 1) return;
        const cx = kit.rtl ? x1 - C : x0, dx = (1 - M.snap(pin)) * travel * dir - M.accel(po) * travel * dir;
        ctx.save(); ctx.beginPath(); ctx.rect(x0 - 70, ym - pitch / 2, x1 - x0 + 140, pitch); ctx.clip(); ctx.translate(dx, 0);
        ctx.beginPath(); ctx.roundRect(cx, ym - C / 2, C, C, 10); ctx.clip();
        ctx.drawImage(ground.sheet, cells[k].sx, cells[k].sy, ground.C, ground.C, cx, ym - C / 2, C, C);
        ctx.restore();
        const lag = (r) => span(t, t0(k) + 0.06, t0(k) + 0.06 + T.dur.row);
        M.slideText(ctx, kit, rows[k], { x0: kit.rtl ? x0 : x0 + indent, x1: kit.rtl ? x1 - indent : x1, y: ym, color: P.ink, P, rowIn: lag, rowOut: () => po });
        ctx.fillStyle = P.rule; ctx.fillRect(x0, ym + pitch / 2 - 1, x1 - x0, 2);
      });
    },
  };
}
