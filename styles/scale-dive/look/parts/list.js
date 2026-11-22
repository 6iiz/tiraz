// A list as the stops of a dive: a scale track runs down the reading side with minor log ticks between the stops; a pointer slides
// down it, and at each stop a small world lights up (a disc with its hard glow rings) and the item grows out of the distance beside
// it. A key phrase in an item is locked on by one next-stop pill. spec: { duration, at?, says: { title?, items: [ "…", … ] } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the list spec'); need(spec.says, ['items'], 'the list spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, items = spec.says.items, rtl = kit.rtl;
  if (!Array.isArray(items) || !items.length || items.length > 5) throw new Error('the list spec\'s "items" must be a list of 1 to 5 texts');
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const trackX = rtl ? SAFE.right - 34 : SAFE.left + 34, inset = 96;
  const tx0 = rtl ? SAFE.left + 20 : SAFE.left + inset, tx1 = rtl ? SAFE.right - inset : SAFE.right - 20;
  const rows = kit.fitAll(items, { size: T.size.item, weight: T.weight.item, maxW: tx1 - tx0 - 30, single: true, where: 'a list item' });
  const title = spec.says.title ? kit.fit(spec.says.title, { size: T.size.title, weight: 600, maxW: SAFE.right - SAFE.left, minPx: 46, where: 'the list title' }) : null;
  const pitch = Math.max(132, rows[0].size * 2.15);
  const titleH = title ? title.height + 36 : 0;
  const top = kit.place(titleH + pitch * items.length, 720), y0 = top + titleH;
  const ys = items.map((_, k) => y0 + k * pitch + pitch / 2);
  const keyed = items.map((s) => /\*[^*]+\*/.test(s));
  const t0s = items.map((_, k) => at + 0.25 + k * T.beat);
  const runs = rows.map((f, k) => M.keyRuns(f, { x0: tx0, x1: tx1, y: ys[k], align: 'start' }, rtl));
  const word = (t, t0) => (w, i, box, c) => { const s = t0 + i * 0.05; if (M.arrive(c, span(t, s, s + T.dur.in), box, trackX, box.y) === false) return false; if (w.key) return t >= s + 0.2 ? pal.onSun : pal.ink; };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      ctx.save();
      if (M.rushOut(ctx, span(t, d - T.dur.out, d), W / 2, ground.vy * 0.6)) {
        if (title) kit.drawText(ctx, title, { x0: SAFE.left, x1: SAFE.right, y: top + title.lead / 2, align: 'start', color: pal.muted,
          each: (w, i, box, c) => { const s = at + i * 0.05; if (M.arrive(c, span(t, s, s + T.dur.in), box, W / 2, ground.vy) === false) return false; } });
        // the track grows down with the dive, minor log ticks between the stops
        const yA = ys[0] - pitch * 0.45, yB = ys.at(-1) + pitch * 0.45, g = M.E(span(t, at, at + 0.25 + items.length * T.beat));
        if (g > 0) {
          const yE = yA + (yB - yA) * g;
          ctx.fillStyle = pal.tone(0.3); ctx.fillRect(trackX - 1.5, yA, 3, yE - yA);
          for (let k = 0; k < items.length; k++) for (let m = 2; m < 10; m++) {
            const y = ys[k] + Math.log10(m) * pitch; if (y > yE || y > yB) continue; ctx.fillStyle = pal.tone(0.26); ctx.fillRect(trackX - 7, y - 1, 14, 2);
          }
        }
        // the pointer travels from stop to stop
        let py = ys[0] - pitch * 0.45;
        items.forEach((_, k) => { const p = M.Q(span(t, t0s[k] - 0.25, t0s[k])); if (p > 0) py = (k ? ys[k - 1] : ys[0] - pitch * 0.45) + ((ys[k]) - (k ? ys[k - 1] : ys[0] - pitch * 0.45)) * p; });
        if (t >= at) { const dx = rtl ? 1 : -1; ctx.fillStyle = pal.sun; ctx.beginPath(); ctx.moveTo(trackX + dx * 22, py); ctx.lineTo(trackX + dx * 44, py - 12); ctx.lineTo(trackX + dx * 44, py + 12); ctx.closePath(); ctx.fill(); }
        items.forEach((_, k) => {
          const p = M.Q(span(t, t0s[k] - 0.05, t0s[k] + 0.35));
          if (p > 0) {
            ctx.save(); ctx.translate(trackX, ys[k]); ctx.scale(p, p);
            M.glow(ctx, 0, 0, 16, pal, 0.8);
            if (keyed[k]) M.disc(ctx, 0, 0, 16, pal.sun, pal.sunTone(0.7)); else M.disc(ctx, 0, 0, 16, pal.tone(0.55), pal.tone(0.35));
            ctx.restore();
          }
          for (const r of runs[k]) { const s = t0s[k] + r.first * 0.05 + 0.06; M.stop(ctx, r, rows[k].size, span(t, s, s + 0.42), pal, t + clock); }
          kit.drawText(ctx, rows[k], { x0: tx0, x1: tx1, y: ys[k], align: 'start', color: pal.ink, key: pal.onSun, each: word(t, t0s[k]) });
        });
      }
      ctx.restore();
    },
  };
}
