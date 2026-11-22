// A list as terminal output: an optional title printed at once as a header over a rule of characters, then one row per beat, each
// typed by the cursor after its index in brackets. Key words (*…*) are inverse video. All of it is cleared by afterglow at the end.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal, ch = ground.ch, cw = ground.cw;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const indexW = cw * 6, x0 = rtl ? SAFE.left : SAFE.left + indexW, x1 = rtl ? SAFE.right - indexW : SAFE.right;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: x1 - x0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.lead, weight: T.weight.lead, maxW: SAFE.right - SAFE.left, single: true, where: 'the list title' }) : null;
  const pitch = ch * 3, head = title ? ch * 3 : 0;
  const top = Math.round(kit.place(head + pitch * items.length, 700) / ch) * ch;
  const yTitle = top + ch, yRule = top + ch * 2.1;
  const sTitle = title && M.screenText(kit, title, { x0: SAFE.left, x1: SAFE.right, y: yTitle, align: 'start' }, pal, T, pal.soft);
  const lines = rows.map((f, k) => {
    const y = top + head + k * pitch + pitch / 2, s = M.screenText(kit, f, { x0, x1, y, align: 'start' }, pal, T);
    return { f, y, s, tt: M.typing(s.boxes, at + 0.25 + k * T.dur.beat, T, 31 + k) };
  });
  const off = d - T.dur.out, lastEnd = lines.at(-1).tt.end;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const fade = M.decay(t, off, T.dur.tau);
      if (sTitle && t >= at) {
        sTitle.draw(ctx, () => fade, () => M.heat(t, at, T.dur.heat));
        const n = Math.floor((SAFE.right - SAFE.left) / (cw * 1.02));
        ctx.save(); ctx.globalAlpha = fade; M.charRow(ctx, '='.repeat(n), SAFE.left, yRule, Math.round(ch * 0.55), mono, pal.dim); ctx.restore();
      }
      let cur = null;
      lines.forEach(({ f, y, s, tt }, k) => {
        if (t < tt.on[0] - 0.05) return;
        ctx.save(); ctx.globalAlpha = fade;
        const ix = rtl ? SAFE.right : SAFE.left;
        M.charRow(ctx, '[' + (k + 1) + ']', ix, y, T.size.index, mono, pal.dim, rtl ? 'right' : 'left');
        ctx.restore();
        kit.rec(rtl ? ix - 60 : ix, rtl ? ix : ix + 60, y - 18, y + 18, String(k + 1), { decor: true });
        s.draw(ctx, (i) => (t >= tt.on[i] ? fade : 0), (i) => M.heat(t, tt.on[i], T.dur.heat));
        const kk = M.typedUpTo(tt.on, t); if (kk >= 0) cur = { x: M.cursorX(s.boxes, kk, f, rtl, x0, x1), y: s.boxes[kk].y, size: f.size };
      });
      if (cur) M.cursor(ctx, pal, T, t, { ...cur, rtl, typingUntil: lastEnd, alpha: t < off ? 1 : 0 });
    },
  };
}
