// A list as an evidence log: a time axis runs down the reading side with a tick and a mono timecode for each entry. A playhead walks
// down the axis; each entry is set (like a transcription) the moment the playhead reaches its tick, and the tick becomes a filled
// mark. Key words carry the accent highlight. The title sits above the log under a thin rule.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P, mono = brand.fonts.mono?.family ?? brand.fonts.display.family;
  const maxW = SAFE.right - SAFE.left, col = 150;                    // the axis and its timecodes take the reading-side column
  const ax = rtl ? SAFE.right - 12 : SAFE.left + 12;
  const tx0 = rtl ? SAFE.left : SAFE.left + col, tx1 = rtl ? SAFE.right - col : SAFE.right;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: maxW - col, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 500, maxW, minScale: 0.92, where: 'the list title' }) : null;
  const pitch = rows[0].size * 2.1, titleH = title ? title.height + 50 : 0;
  const top = kit.place(titleH + pitch * items.length, 760);
  const ys = items.map((_, k) => top + titleH + k * pitch + pitch / 2);
  const runsK = rows.map((f, k) => M.runs(M.boxes(kit, f, { x0: tx0, x1: tx1, y: ys[k], align: 'start' })));
  const beat = 0.42, t0 = (k) => at + 0.3 + k * beat, codes = items.map((_, k) => '00:' + String(12 + k * 7 + (k * k) % 5).padStart(2, '0'));
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, d - T.dur.out, d), keep = 1 - M.I(out);
      if (title) {
        kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: top + title.lead / 2, align: 'start', color: P.grey,
          each: (w, i, box, c) => { const s0 = at + i * T.dur.stagger; if (M.set(c, span(t, s0, s0 + T.dur.in), out, title.size) === false) return false; } });
        const rw = maxW * M.E(span(t, at, at + 0.4)) * keep; ctx.fillStyle = P.rule; ctx.fillRect(rtl ? SAFE.right - rw : SAFE.left, top + title.height + 18, rw, 2);
      }
      // the axis and the playhead walking down it
      const a0 = top + titleH, a1 = a0 + pitch * items.length;
      ctx.save(); ctx.globalAlpha = keep;
      ctx.fillStyle = P.rule; ctx.fillRect(ax - 1, a0, 2, (a1 - a0) * M.E(span(t, at, at + 0.35)));
      const last = t0(items.length - 1), hy = ys[0] + (ys.at(-1) - ys[0]) * span(t, t0(0), last) - 0;
      const hyy = t < t0(0) ? a0 + (ys[0] - a0) * span(t, at, t0(0)) : hy;
      ctx.fillStyle = P.mark; ctx.fillRect(rtl ? ax - 2 : ax - 26, hyy - 1, 28, 2);
      ctx.beginPath(); ctx.moveTo(ax + (rtl ? 14 : -14), hyy - 9); ctx.lineTo(ax + (rtl ? 2 : -2), hyy); ctx.lineTo(ax + (rtl ? 14 : -14), hyy + 9); ctx.fill();
      ctx.restore();
      rows.forEach((f, k) => {
        const s0 = t0(k), y = ys[k], hit = t >= s0;
        ctx.save(); ctx.globalAlpha = keep;
        ctx.strokeStyle = hit ? P.mark : P.rule; ctx.fillStyle = P.mark; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(ax, y, 8, 0, Math.PI * 2); hit ? ctx.fill() : ctx.stroke();
        if (t >= at + 0.1) M.code(ctx, codes[k], rtl ? ax - 28 : ax + 28, y, { mono, size: T.size.code, color: hit ? P.ink : P.dim, align: rtl ? 'right' : 'left' });
        ctx.restore();
        const hp = M.E(span(t, s0 + 0.15, s0 + 0.15 + T.dur.wipe)) * keep;
        for (const r of runsK[k]) M.highlight(ctx, r, f.size, hp, P, rtl);
        kit.drawText(ctx, f, { x0: tx0, x1: tx1, y, align: 'start', color: P.ink, key: P.ink,
          each: (w, i, box, c) => { const w0 = s0 + i * 0.04; if (M.set(c, span(t, w0, w0 + T.dur.in), out, f.size) === false) return false; if (w.key && hp > 0.5) return P.onAccent; } });
      });
    },
  };
}
