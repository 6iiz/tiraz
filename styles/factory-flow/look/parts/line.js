// A line as one station of the works: a cut-away room with the accent frame and a belt along its floor. The room's light comes on,
// then the words ride in on the belt from the reading side, one after another, and come to rest in their places. A press drops from
// the ceiling onto the key word (*…*) and stamps it: the word now sits on an accent label. The lead-in is a plaque bolted above the
// room. Leaving, the light goes off and the words ride on down the line. spec: { duration, at?, y?, cut?, says: { text, lead? } }
import { need, span, SAFE } from '/engine/kit.js';

export async function create({ W, H, brand, look, spec, clock, kit }) {
  need(spec, ['duration', 'says'], 'the line spec'); need(spec.says, ['text'], 'the line spec\'s "says"');
  const T = look.tokens, at = spec.at ?? 0, d = spec.duration, rtl = kit.rtl;
  const ground = (await import(look.base + 'ground.js')).create({ W, H, brand, look, clock });
  const M = await import(look.base + 'motion.js'), P = ground.P;
  const rx0 = SAFE.left - 6, rx1 = SAFE.right + 6, tx0 = SAFE.left + 24, tx1 = SAFE.right - 24;
  const line = kit.fit(spec.says.text, { size: T.size.line, weight: T.weight.line, maxW: tx1 - tx0, minScale: 0.6 });
  const lead = spec.says.lead ? kit.fit(spec.says.lead, { size: T.size.lead, weight: T.weight.lead, maxW: SAFE.right - SAFE.left - 60, single: true, where: 'the lead-in' }) : null;
  const leadH = lead ? lead.lead + 30 + 40 : 0, padT = 80, padB = 104, roomH = padT + line.height + padB;
  const top = spec.y ?? kit.place(leadH + roomH, 740);
  const ry0 = top + leadH, ry1 = ry0 + roomH, yLine = ry0 + padT + line.lead / 2, yPl = top + (lead ? (lead.lead + 30) / 2 : 0);
  const n = line.rows.reduce((s, r) => s + r.words.length, 0);
  const wb = M.boxes(kit, line, { x0: tx0, x1: tx1, y: yLine, align: 'start' }), keys = wb.filter((b) => b.key);
  const keyT = at + (n - 1) * T.dur.step + T.dur.in + 0.12;
  const kx = keys.length ? (Math.min(...keys.map((b) => b.x)) + Math.max(...keys.map((b) => b.x + b.width))) / 2 : 0;
  const kw = keys.length ? Math.max(...keys.map((b) => b.x + b.width)) - Math.min(...keys.map((b) => b.x)) : 0;
  const out0 = d - T.dur.out;
  return {
    duration: d,
    draw(ctx, t) {
      ground.draw(ctx, t);
      const out = span(t, out0, d), o = M.I(out);
      const lit = span(t, at - 0.35, at - 0.1) * (1 - span(t, out0, out0 + 0.15));
      M.room(ctx, rx0, ry0, rx1, ry1, P, lit);
      const travel = (t - at) * 300 * (rtl ? -1 : 1) * (t < keyT + 0.3 || t > out0 ? 1 : 0);
      M.belt(ctx, rx0 + 16, rx1 - 16, ry1 - 30, P, travel);
      if (lead) {
        const pw = lead.width + 70, px1 = rtl ? SAFE.right : SAFE.left + pw, px0 = px1 - pw;
        const drop = M.E(span(t, at - 0.5, at - 0.2)), dy = (1 - drop) * -40;
        if (drop > 0) {
          ctx.save(); ctx.globalAlpha = 1 - o; ctx.translate(0, dy);
          ctx.fillStyle = P.line; ctx.fillRect(px0 + 30, yPl + lead.lead / 2 + 14, 8, ry0 - yPl - lead.lead / 2 - 14); ctx.fillRect(px1 - 38, yPl + lead.lead / 2 + 14, 8, ry0 - yPl - lead.lead / 2 - 14);
          M.plaque(ctx, px0, yPl - lead.lead / 2 - 14, px1, yPl + lead.lead / 2 + 14, P);
          kit.drawText(ctx, lead, { x0: px0 + 35, x1: px1 - 35, y: yPl, color: P.onPlaque });
          ctx.restore();
        }
      }
      // the press and the label it stamps
      if (keys.length) {
        if (t >= keyT && out < 1) for (const b of M.spans(keys)) { ctx.save(); ctx.translate(M.I(out) * (rtl ? -1 : 1) * T.dur.run * 1.6, 0); ctx.beginPath(); ctx.rect(rx0, ry0, rx1 - rx0, ry1 - ry0); ctx.clip(); M.label(ctx, b, line.size, P, span(t, keyT, keyT + 0.25)); ctx.restore(); }
      }
      kit.drawText(ctx, line, { x0: tx0, x1: tx1, y: yLine, align: 'start', color: P.light, key: P.light,
        each: (w, i, box, c) => {
          if (M.ride(c, span(t, at + i * T.dur.step, at + i * T.dur.step + T.dur.in), box, line.size, rtl, T.dur.run, rx0, rx1, out) === false) return false;
          if (w.key && t >= keyT) return P.onAccent;
        } });
      if (keys.length) M.press(ctx, kx, ry0, keys[0].y - line.size * 0.66, kw + 40, span(t, keyT - 0.22, keyT + 0.22), P);
    },
  };
}
