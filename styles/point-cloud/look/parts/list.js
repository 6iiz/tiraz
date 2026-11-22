// A list as classes of a scan. Each row carries a small swatch of returns (its class, a step up the height ramp per row) on the
// reading side and is scanned in on its own, one after the other; a key phrase in a row takes the class colour and one bracket box.
// A hairline joins the swatches like a legend. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, rng, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const indent = 78, X0 = SAFE.left + 10, X1 = SAFE.right - 10;
  const tx0 = kit.rtl ? X0 : X0 + indent, tx1 = kit.rtl ? X1 - indent : X1;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 500, maxW: X1 - X0, minScale: 0.92, minPx: 44, where: 'the list title' }) : null;
  const pitch = Math.max(104, rows[0].size * 1.8), tH = title ? title.height + 34 : 0;
  const top = kit.place(tH + pitch * items.length, 640);
  const out0 = d - T.dur.out, sw = (kit.rtl ? X1 - 24 : X0 + 24);
  const parts = [];
  if (title) {
    const a = { x0: X0, x1: X1, y: top + title.lead / 2, align: 'start' }, s = M.sampleText(kit, title, a, T.step.item); Object.assign(s, { x0: X0, x1: X1 });
    parts.push({ f: title, a, color: pal.grey, scan: M.scanned(s, { t0: at, sweep: 0.3, land: T.dur.land, out0, outDur: T.dur.out }), runs: [] });
  }
  const r = rng(808), swatches = [];
  rows.forEach((f, k) => {
    const y = top + tH + k * pitch + pitch / 2, a = { x0: tx0, x1: tx1, y, align: 'start' }, s = M.sampleText(kit, f, a, T.step.item);
    Object.assign(s, { x0: X0, x1: X1 });
    const t0 = at + 0.2 + k * T.dur.stagger;
    parts.push({ f, a, y, t0, color: pal.light, scan: M.scanned(s, { t0, sweep: 0.26, land: T.dur.land, out0: out0 + k * 0.03, outDur: T.dur.out }), runs: M.runs(M.layout(kit, f, a)) });
    const b = Math.min(9, Math.round(5 + (k / Math.max(1, items.length - 1)) * 4));
    swatches.push({ y, t0, b, dots: Array.from({ length: 26 }, () => [(r() - 0.5) * 34, (r() - 0.5) * 34, r()]) });
  });
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const live = 1 - M.inC(span(t, out0, d));
      if (swatches.length > 1) {                                            // the legend spine
        const s0 = swatches[0].y, s1 = swatches.at(-1).y, lp = M.outC(span(t, at + 0.1, at + 0.2 + items.length * T.dur.stagger));
        ctx.fillStyle = pal.faint; ctx.globalAlpha = live; ctx.fillRect(sw - 1, s0, 2, (s1 - s0) * lp); ctx.globalAlpha = 1;
      }
      swatches.forEach((s) => {
        const p = M.outC(span(t, s.t0, s.t0 + 0.3)) * live; if (p <= 0) return;
        ctx.fillStyle = pal.dark; ctx.fillRect(sw - 24, s.y - 24, 48, 48);
        ctx.fillStyle = ground.colors[s.b];
        for (const [dx, dy, j] of s.dots) if (j < p) ctx.fillRect(sw + dx * p - 2.5, s.y + dy * p - 2.5, 5, 5);
      });
      for (const P of parts) {
        P.runs.forEach((rn) => M.bracket(ctx, rn, P.f.size, span(t, P.t0 + 0.3, P.t0 + 0.55) * live, pal.accent, P.f.space * 0.45));
        P.scan.draw(ctx, t, { text: P.color, key: pal.key, front: pal.key }, (a, b) => {
          ctx.save(); ctx.beginPath(); ctx.rect(0, a, W, b - a); ctx.clip(); kit.drawText(ctx, P.f, { ...P.a, color: P.color, key: pal.key }); ctx.restore();
        }, 2.2);
      }
    },
  };
}
