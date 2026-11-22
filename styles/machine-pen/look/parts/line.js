// A line, plotted: the grey pen rasters the lead-in word by word, the accent pen hatches a band where the key phrase will sit and traces
// its border, then the ink pen rasters the statement. Afterwards the ink pen rules a long double line under the block at drawing
// speed, and the gantry goes home. In the opening scene ("at" < 0) the whole plot is squeezed to finish before the first frame, so
// the hook is whole when the reel starts; only the rule is drawn in view. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), K = ground.K;
  const x0 = SAFE.left, x1 = SAFE.right, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: 44, where: 'the lead-in' }) : null;
  const gap = lead ? 18 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block + 60, 640);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const lb = lead ? M.boxes(lead, x0, x1, yLead, 'start', rtl) : [], tb = M.boxes(line, x0, x1, yLine, 'start', rtl);
  const groups = M.keyGroups(tb), pad = line.size * 0.16;
  const jobs = [], wordJob = new Map(), keyJobs = [];
  lb.forEach((b) => { const j = M.wordJob(b, 'grey', T, rtl, 0.8); jobs.push(j); wordJob.set('l' + b.i, j); });
  for (const g of groups) {
    const r = { x: g.x0 - pad, y: g.y - g.size * 0.6, w: g.x1 - g.x0 + pad * 2, h: g.size * 1.2 };
    const h = M.hatchJob(r, 'accent', T, rtl), b = M.strokeJob([[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h], [r.x, r.y]], 'accent', T);
    b.after = true; jobs.push(h, b); keyJobs.push(h, b);
  }
  tb.forEach((b) => { const j = M.wordJob(b, 'ink', T, rtl); jobs.push(j); wordJob.set('t' + b.i, j); });
  const yRule = yLine + (line.rows.length - 1) * line.lead + line.size * 0.95, ra = rtl ? x1 : x0, rb = rtl ? x0 : x1;
  const rule = M.strokeJob([[ra, yRule], [rb, yRule], [rb, yRule + 9], [ra + (rb - ra) * 0.55, yRule + 9]], 'ink', T, { speed: 1300, lifts: [2] });
  const main = M.program(jobs, { start: at, park: ground.park, by: at < 0 ? -0.3 : at + 1.7 });
  const tStart = Math.max(main.end, 0.15), tail = M.program([rule], { start: tStart, park: ground.park, from: main.pen(tStart) });
  const penAt = (t) => (t < tStart ? main.pen(t) : tail.pen(t));
  const each = (pre, t) => (w, i, box, c) => (M.rasterClip(c, wordJob.get(pre + i), main.q(wordJob.get(pre + i), t)) ? undefined : false);
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      for (let k = 0; k < keyJobs.length; k += 2) {
        keyJobs[k].draw(ctx, main.q(keyJobs[k], t), K.accent);
        keyJobs[k + 1].draw(ctx, main.q(keyJobs[k + 1], t), K.accent, 4);
      }
      if (lead) kit.drawText(ctx, lead, { x0, x1, y: yLead, align: 'start', color: K.grey, each: each('l', t) });
      kit.drawText(ctx, line, { x0, x1, y: yLine, align: 'start', color: K.ink, key: K.ink, each: each('t', t) });
      rule.draw(ctx, tail.q(rule, t), K.ink, 3);
      ground.machine(ctx, penAt(t));
    },
  };
}
