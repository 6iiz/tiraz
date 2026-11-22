// A list as marked sites. Each row of the caption plate carries a site marker (a ring with a letter in the mono face) and, as the row
// settles, the same marker is pinned on the ground below with one ring of ping. A key phrase in a row is locked on by the reticle.
// spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, P = T.plate;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const X0 = SAFE.left + 20, X1 = SAFE.right - 20, indent = 70, tx0 = kit.rtl ? X0 : X0 + indent, tx1 = kit.rtl ? X1 - indent : X1;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? M.balanced(kit, spec.says.title, { size: T.size.title, weight: 500, maxW: X1 - X0, minScale: 0.92, minPx: 44, where: 'the list title' }) : null;
  const pitch = Math.max(100, rows[0].size * 1.75), tH = title ? title.height + 24 : 0, top = kit.place(tH + pitch * items.length, 600);
  const py0 = top - P.pad + 6, py1 = top + tH + pitch * items.length + P.pad - 22;
  const mono = brand.fonts.mono?.family ?? brand.fonts.display.family, letters = 'ABCDE', mx = kit.rtl ? X1 - 24 : X0 + 24;
  const t0 = clock + Math.max(0, at), spots = [[0.22, 1150], [0.7, 1080], [0.45, 1215], [0.86, 1190], [0.12, 1060]]
    .map(([fx, y]) => ground.fromScreen((kit.rtl ? 1 - fx : fx) * W, y, t0));
  const R = rows.map((f, k) => { const y = top + tH + k * pitch + pitch / 2, a = { x0: tx0, x1: tx1, y, align: 'start' }; return { f, a, y, t: at + 0.3 + k * T.dur.row, runs: M.runs(M.layout(kit, f, a)) }; });
  const aT = title && { x0: X0, x1: X1, y: top + title.lead / 2, align: 'start' };
  const out0 = d - T.dur.out;
  const marker = (ctx, x, y, k, r = 19) => {
    ctx.strokeStyle = pal.light; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.stroke();
    ctx.font = `600 ${Math.round(r * 1.05)}px "${mono}"`; ctx.fillStyle = pal.light; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'; ctx.fillText(letters[k], x, y + 1);
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const pp = M.plateP(t, at, T.dur.open, out0, T.dur.out); if (pp <= 0) return;
      const hold = 1 - M.inC(span(t, out0, out0 + T.dur.out * 0.6));
      R.forEach((r, k) => {                                                // the sites on the ground
        const q = span(t, r.t + 0.1, r.t + 0.5); if (q <= 0 || hold <= 0) return;
        const s = ground.toScreen(spots[k].x, spots[k].y, t + clock);
        ctx.save(); ctx.globalAlpha = hold;
        ctx.fillStyle = pal.plate; ctx.beginPath(); ctx.arc(s.x, s.y, 22, 0, 6.283); ctx.fill(); marker(ctx, s.x, s.y, k);
        if (q < 1) { ctx.globalAlpha = hold * (1 - q); ctx.strokeStyle = pal.key; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x, s.y, 22 + 50 * M.outC(q), 0, 6.283); ctx.stroke(); }
        ctx.restore();
      });
      M.plate(ctx, pal, P.x0, py0, P.x1, py1, pp, kit.rtl);
      const w = (P.x1 - P.x0) * M.snap(pp);
      ctx.save(); ctx.beginPath(); ctx.rect(kit.rtl ? P.x1 - w : P.x0, py0, w, py1 - py0); ctx.clip();
      if (title) M.settle(kit, ctx, title, aT, t, at + 0.05, 0.04, T.dur.word, pal.grey, pal.key);
      R.forEach((r, k) => {
        const q = span(t, r.t, r.t + 0.2); if (q <= 0) return;
        ctx.save(); ctx.globalAlpha = Math.min(1, q * 2); marker(ctx, mx, r.y, k); ctx.restore();
        M.settle(kit, ctx, r.f, r.a, t, r.t + 0.04, 0.04, T.dur.word, pal.light, pal.key);
      });
      ctx.restore();
      R.forEach((r) => r.runs.forEach((rn) => M.lockOn(ctx, pal, rn, r.f.size, ground.toScreen(spots[R.indexOf(r)].x, spots[R.indexOf(r)].y, t + clock), span(t, r.t + 0.2, r.t + 0.2 + T.dur.lock), 0, hold, r.f.space * 0.4)));
    },
  };
}
