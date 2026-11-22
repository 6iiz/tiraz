// A line as a window sign: the lead-in is painted on the panel in small letters (it may take two rows), and the statement is bent
// in glass tubes under it. The segments are switched on one after another from the reading side, each catching with a short
// stutter while its gas runs along the tube; the key phrase (*…*, one or several words) is one circuit of the accent gas that lights
// as a single segment, with a straight accent tube under it. spec: { duration, at?, y?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), pal = ground.pal;
  const x0 = SAFE.left + 20, x1 = SAFE.right - 20, maxW = x1 - x0;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW, minScale: 0.6, minPx: 62, where: 'the line' });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW, minPx: 46, where: 'the lead-in' }) : null;
  const gap = lead ? 26 : 0, block = (lead ? lead.height + gap : 0) + line.height;
  const top = spec.y ?? kit.place(block, 700);
  const yLead = top + (lead ? lead.lead / 2 : 0), yLine = top + (lead ? lead.height + gap : 0) + line.lead / 2;
  const leadSign = lead ? M.sign(lead, { x0, x1, y: yLead }, pal, rtl, { painted: true }) : null;
  const sign = M.sign(line, { x0, x1, y: yLine }, pal, rtl);
  // one switch per plain word, one switch for each key run
  const slot = []; let k = -1, prevKey = false;
  for (const w of sign.words) { if (!(w.key && prevKey)) k++; slot[w.index] = k; prevKey = w.key; }
  const n = k + 1, len = T.dur.strike, step = n <= 1 ? 0 : Math.min(T.dur.step, (0.68 - len) / (n - 1)), t0 = at + 0.08;
  const runs = []; for (const w of sign.words) if (w.key) { const r = runs.find((q) => q.slot === slot[w.index] && q.row === w.row); if (r) { r.x0 = Math.min(r.x0, w.x); r.x1 = Math.max(r.x1, w.x + w.width); } else runs.push({ slot: slot[w.index], row: w.row, x0: w.x, x1: w.x + w.width, y: w.y }); }
  return {
    duration: d,
    draw(ctx, t) {
      const time = t + clock, lit = (i, w) => { const L = M.sequence(t, t0, step, len, slot[i], 0); L.b *= M.hum(time, slot[i]); void w; return L; };
      const power = n ? Math.min(1, Math.max(0, (t - t0) / (step * (n - 1) + len))) : 1;
      ground.draw(ctx, t, { power });
      ground.spill(ctx, W / 2, yLine, 560, 260 + line.height / 2, pal.main.glow, power);
      if (leadSign) { leadSign.draw(ctx, () => null); leadSign.rec(kit); }
      for (const r of runs) {                                         // the accent tube under the key phrase: glass, then lit with its circuit
        const L = M.sequence(t, t0, step, len, r.slot, 0), y = r.y + line.size * 0.62, xa = r.x0 - 6, xb = r.x1 + 6;
        ctx.save(); ctx.lineCap = 'round';
        ctx.strokeStyle = pal.glass; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(xb, y); ctx.stroke();
        if (L.b > 0 && L.run > 0) {
          const e = Math.min(1, L.run), xr = rtl ? xb - (xb - xa) * e : xa + (xb - xa) * e;
          ctx.globalAlpha = L.b * M.hum(time, r.slot); ctx.shadowColor = pal.key.glow; ctx.shadowBlur = 26;
          ctx.strokeStyle = pal.key.tube; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(rtl ? xb : xa, y); ctx.lineTo(xr, y); ctx.stroke();
          ctx.shadowBlur = 0; ctx.strokeStyle = pal.key.core; ctx.lineWidth = 4; ctx.stroke();
        }
        ctx.restore();
      }
      sign.draw(ctx, lit); sign.rec(kit);
      ground.glass(ctx, t);
    },
  };
}
