// A list typed down a column: the title sits in a merged range, then the selection steps down one item per beat (Enter moves it to the
// next row). Each item drops into its merged range when the selection reaches it, and the narrow first-column cell beside it fires its
// rule (a flash, then the accent with a check). The cells under a key phrase (*…*) fill with the accent, one block per phrase.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.palette, S = M.sheet(T, W, rtl);
  const all = S.rect(0, 0, S.cols - 1, 0), xa = Math.max(all.x + 26, SAFE.left + 6), xb = Math.min(all.x + all.w - 26, SAFE.right - 6);
  const it = S.rect(1, 0, S.cols - 1, 0), ix0 = Math.max(it.x + 26, SAFE.left + 6), ix1 = Math.min(it.x + it.w - 26, SAFE.right - 6);
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: ix1 - ix0, single: true, where: 'a list item' });
  const title = spec.says.title ? M.balanced(kit, spec.says.title, { size: T.size.title, weight: 600, maxW: xb - xa, minPx: 44, where: 'the list title' }) : null;
  const nT = title ? M.rowsFor(title, S.rh, 0.3) : 0, nI = M.rowsFor(rows[0], S.rh, 0.6), gap = 1;
  const total = (title ? nT + 1 : 0) + items.length * (nI + gap);
  const r0 = Math.max(1, Math.round((720 - (total * S.rh) / 2 - S.top) / S.rh)), rI = r0 + (title ? nT + 1 : 0);
  const rowOf = (k) => rI + k * (nI + gap);
  const yMid = (r, n) => S.yOf(r) + (n * S.rh) / 2;
  const keys = rows.map((f, k) => M.keySpans(f, ix0, ix1, yMid(rowOf(k), nI), 'start', rtl).map((s) => M.cellsUnder(S, s, f.size)));
  const formula = `=SORT(${M.ref(1, rI)}:${M.ref(S.cols - 1, rowOf(items.length - 1) + nI - 1)})`;
  const tAt = (k) => at + 0.3 + k * T.beat;
  const check = (ctx, R, c) => { const s = Math.min(R.w, R.h) * 0.4, cx = R.x + R.w / 2, cy = R.y + R.h / 2; ctx.strokeStyle = c; ctx.lineWidth = 5; ctx.lineCap = 'square';
    ctx.beginPath(); ctx.moveTo(cx - s * 0.6, cy); ctx.lineTo(cx - s * 0.15, cy + s * 0.5); ctx.lineTo(cx + s * 0.7, cy - s * 0.55); ctx.stroke(); };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      let cur = -1; items.forEach((_, k) => { if (t >= tAt(k)) cur = k; });
      M.formulaBar(ctx, T, P, ground.mono, t, at, cur >= 0 ? M.ref(1, rowOf(cur)) : M.ref(1, rI), formula, W);
      if (title) { M.merged(ctx, S, 0, r0, S.cols - 1, r0 + nT - 1, P); kit.drawText(ctx, title, { x0: xa, x1: xb, y: yMid(r0, nT) - ((title.rows.length - 1) * title.lead) / 2, align: 'start', color: P.muted }); }
      items.forEach((_, k) => {
        const r = rowOf(k), t0 = tAt(k);
        const R = M.merged(ctx, S, 1, r, S.cols - 1, r + nI - 1, P);
        const C = S.rect(0, r, 0, r + nI - 1);
        if (t < t0) return;
        if (M.paint(ctx, C, t, t0 + 0.08, P.accent, P, T.dur.flash) && t >= t0 + 0.08 + T.dur.flash) check(ctx, C, P.on(P.accent));
        keys[k].forEach((kc, j) => kc.cells.forEach((q, i) => M.paint(ctx, q, t, t0 + 0.12 + i * 0.01, P.accent, P, T.dur.flash)));
        kit.drawText(ctx, rows[k], { x0: ix0, x1: ix1, y: yMid(r, nI), align: 'start', color: P.ink, key: P.on(P.accent) });
        if (k === cur) M.selection(ctx, R, P, t, rtl, k === items.length - 1);
      });
    },
  };
}
