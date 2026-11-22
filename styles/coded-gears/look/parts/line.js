// A line: the statement sits on a housing plate in the paper colour, its own outline darker. Under and behind the plate a gear train
// runs at its true ratios: a slate driver, an accent wheel (the part being explained), a deep-accent wheel and a neutral one. The
// accent wheel is dyed from the point where the driver meets it, and the key word (or phrase) is set on one accent chip, dyed in from
// the reading side. spec: { duration, at?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const maxW = SAFE.right - SAFE.left - 40, x0 = SAFE.left + 20, x1 = SAFE.right - 20;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minScale: 0.96, minPx: 44, where: 'the lead-in' }) : null;
  const block = (lead ? lead.height + 6 : 0) + line.height;
  const top = kit.place(block + 80, 520) + 40;
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + 6 : 0) + line.lead / 2;
  const pT = top - 44, pB = top + block + 40;
  const runs = M.keyRuns(M.boxes(kit, line, x0, x1, yLine));
  const nLead = lead ? lead.rows.reduce((s, r) => s + r.words.length, 0) : 0, nAll = nLead + line.rows.reduce((s, r) => s + r.words.length, 0);
  const step = Math.min(T.dur.step, 0.4 / Math.max(1, nAll)), out0 = d - T.dur.out;
  const m = T.drive.module, sx = rtl ? 1 : -1;
  const tr = M.train(m, { N: 24, x: W / 2 + sx * 250, y: pB + 200 }, [
    { N: 14, phi: rtl ? Math.PI * 0.93 : Math.PI * 0.07 }, { N: 20, phi: rtl ? Math.PI * 0.78 : Math.PI * 0.22 }, { N: 12, phi: rtl ? Math.PI * 1.1 : -Math.PI * 0.1 }]);
  const back = M.train(m, { N: 18, x: W / 2 - sx * 380, y: pT - 10 }, [{ N: 10, phi: -Math.PI * 0.5 + sx * 0.6 }]);
  const sys = [pal.B, pal.A, pal.C, pal.N];
  const tKey = runs.length ? at + (nLead + runs[0].first) * step : at;
  const word = (t, base) => (w, i, box, c) => {
    if (M.click(c, t, at + (base + i) * step, T.dur.word, out0, d, box) === false) return false;
    if (w.key) return M.keyInk(pal, span(t, tKey, tKey + 0.25));
  };
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const a0 = t * T.drive.speed, q = span(t, out0, d), A = tr.angles(a0), B = back.angles(-a0 * 0.7);
      ctx.save(); ctx.globalAlpha = 1 - q;
      back.g.forEach((g, i) => M.drawGear(ctx, g.G, g.x, g.y, B[i], i ? pal.C : pal.N));
      tr.g.forEach((g, i) => {
        if (i === 1) { const c = tr.g[0], k = c.G.r / (c.G.r + g.G.r); M.drawGear(ctx, g.G, g.x, g.y, A[i], pal.A, { neutral: pal.N, dye: { x: c.x + (g.x - c.x) * k, y: c.y + (g.y - c.y) * k, r: 260 * M.smooth(span(t, Math.min(at, 0) + 0.1, Math.min(at, 0) + 0.9)) } }); }
        else M.drawGear(ctx, g.G, g.x, g.y, A[i], sys[i]);
      });
      M.plate(ctx, pal.P, SAFE.left - 24, pT, SAFE.right - SAFE.left + 48, pB - pT);
      ctx.restore();
      ctx.save(); ctx.globalAlpha = 1 - q; runs.forEach((r) => M.chip(ctx, pal, r, line.size, span(t, tKey, tKey + 0.25), rtl)); ctx.restore();
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: pal.grey, each: word(t, 0) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: pal.ink, key: pal.ink, each: word(t, nLead) });
    },
  };
}
